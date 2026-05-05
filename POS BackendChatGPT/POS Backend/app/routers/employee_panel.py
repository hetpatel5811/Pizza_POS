# app/routers/employee_panel.py
from __future__ import annotations
from datetime import date, datetime, timedelta, timezone
from typing import Optional, Tuple, List
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.deps import get_db, get_current_user
from app.models import User
from app.models_pos import TimeClockEvent, POSShiftSchedule, ClockEventType
from app.schemas_pos import (
    ClockEventCreate,
    ClockEventRead,
    ClockStatusRead,
    EmployeeWorkDailyRead,
    ShiftScheduleCreate,
    ShiftScheduleRead,
)

router = APIRouter()  # main.py mounts this under /api/employee

def _resolve_business_tz():
    try:
        return ZoneInfo("America/Toronto")
    except ZoneInfoNotFoundError:
        # Windows environments may miss IANA tzdata package.
        # Fallback to server local timezone so app still boots and day-reset works.
        return datetime.now().astimezone().tzinfo or timezone.utc

BUSINESS_TZ = _resolve_business_tz()
UTC_TZ = timezone.utc


# -------------------------
# Role helpers (case-insensitive)
# -------------------------

EMPLOYEE_ROLES = {"admin", "manager", "employee", "cashier", "kitchen", "staff"}
MANAGER_ROLES = {"admin", "manager"}


def _role(user: User) -> str:
    return str(getattr(user, "role", "") or "").strip().lower()

def require_employee(user: User = Depends(get_current_user)) -> User:
    if _role(user) not in EMPLOYEE_ROLES:
        raise HTTPException(status_code=403, detail="Employee access required")
    return user

def require_manager(user: User = Depends(get_current_user)) -> User:
    if _role(user) not in MANAGER_ROLES:
        raise HTTPException(status_code=403, detail="Manager approval required")
    return user

# -------------------------
# Time helpers (NAIVE UTC to match your DB default=datetime.utcnow)
# -------------------------

def _utcnow() -> datetime:
    # Your TimeClockEvent uses default=datetime.utcnow (naive) :contentReference[oaicite:2]{index=2}
    return datetime.utcnow()

def _business_now() -> datetime:
    return datetime.now(tz=BUSINESS_TZ)

def _aware_to_naive_utc(dt: datetime) -> datetime:
    return dt.astimezone(UTC_TZ).replace(tzinfo=None)

def _today_utc_range() -> Tuple[datetime, datetime]:
    local_now = _business_now()
    local_start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    local_end = local_start + timedelta(days=1)
    return _aware_to_naive_utc(local_start), _aware_to_naive_utc(local_end)

def _day_utc_range(day: date) -> Tuple[datetime, datetime]:
    local_start = datetime(day.year, day.month, day.day, tzinfo=BUSINESS_TZ)
    local_end = local_start + timedelta(days=1)
    return _aware_to_naive_utc(local_start), _aware_to_naive_utc(local_end)

def _report_utc_range(day: date) -> Tuple[datetime, datetime]:
    """
    Report window rules:
    - Past day: full day window
    - Today: midnight -> now (prevents future-time inflation)
    - Future day: empty window
    """
    start, end = _day_utc_range(day)
    today = _business_now().date()
    if day > today:
        return start, start
    if day == today:
        return start, min(_utcnow(), end)
    return start, end

# -------------------------
# State machine
# -------------------------

STATE_OFF_DUTY = "OFF_DUTY"
STATE_ON_SHIFT = "ON_SHIFT"
STATE_ON_BREAK = "ON_BREAK"

def _transition_state(current_state: str, event_type: ClockEventType) -> str:
    if event_type == ClockEventType.CLOCK_IN:
        return STATE_ON_SHIFT
    if event_type == ClockEventType.BREAK_START and current_state == STATE_ON_SHIFT:
        return STATE_ON_BREAK
    if event_type == ClockEventType.BREAK_END and current_state == STATE_ON_BREAK:
        return STATE_ON_SHIFT
    if event_type == ClockEventType.CLOCK_OUT and current_state in {STATE_ON_SHIFT, STATE_ON_BREAK}:
        return STATE_OFF_DUTY
    return current_state

def _infer_state(db: Session, employee_id: int) -> Tuple[str, Optional[datetime], Optional[datetime]]:
    """
    Uses all-time events to determine CURRENT state.
    Totals are calculated separately as "today totals".
    """
    last_in = (
        db.query(TimeClockEvent)
        .filter(TimeClockEvent.employee_id == employee_id, TimeClockEvent.event_type == ClockEventType.CLOCK_IN)
        .order_by(TimeClockEvent.occurred_at.desc())
        .first()
    )
    if not last_in:
        return STATE_OFF_DUTY, None, None

    last_out_after_in = (
        db.query(TimeClockEvent)
        .filter(
            TimeClockEvent.employee_id == employee_id,
            TimeClockEvent.event_type == ClockEventType.CLOCK_OUT,
            TimeClockEvent.occurred_at > last_in.occurred_at,
        )
        .order_by(TimeClockEvent.occurred_at.desc())
        .first()
    )
    if last_out_after_in:
        return STATE_OFF_DUTY, None, None

    last_break_start = (
        db.query(TimeClockEvent)
        .filter(
            TimeClockEvent.employee_id == employee_id,
            TimeClockEvent.event_type == ClockEventType.BREAK_START,
            TimeClockEvent.occurred_at > last_in.occurred_at,
        )
        .order_by(TimeClockEvent.occurred_at.desc())
        .first()
    )
    if not last_break_start:
        return STATE_ON_SHIFT, last_in.occurred_at, None

    last_break_end_after_start = (
        db.query(TimeClockEvent)
        .filter(
            TimeClockEvent.employee_id == employee_id,
            TimeClockEvent.event_type == ClockEventType.BREAK_END,
            TimeClockEvent.occurred_at > last_break_start.occurred_at,
        )
        .order_by(TimeClockEvent.occurred_at.desc())
        .first()
    )
    if last_break_end_after_start:
        return STATE_ON_SHIFT, last_in.occurred_at, None

    return STATE_ON_BREAK, last_in.occurred_at, last_break_start.occurred_at

def _auto_close_stale_open_shift(db: Session, employee_id: int) -> None:
    """
    Auto-closes old open shifts at the day boundary.
    This prevents accidental "always ON_SHIFT" behavior when staff forgot to clock out yesterday.
    """
    state, shift_started_at, _ = _infer_state(db, employee_id)
    if state == STATE_OFF_DUTY or not shift_started_at:
        return

    today_start, _ = _today_utc_range()
    if shift_started_at >= today_start:
        return

    auto_out = TimeClockEvent(
        employee_id=employee_id,
        event_type=ClockEventType.CLOCK_OUT,
        occurred_at=today_start,
        note="Auto clock-out at day boundary (stale open shift)",
    )
    db.add(auto_out)
    db.commit()

def _compute_totals_for_window(
    db: Session,
    employee_id: int,
    start: datetime,
    end: datetime,
) -> Tuple[int, int]:
    """
    Computes worked/break totals inside [start, end) using an event-state timeline.
    Handles shifts that started before the window and open shifts that continue past window end.
    """
    if end <= start:
        return 0, 0

    pre_events = (
        db.query(TimeClockEvent)
        .filter(
            TimeClockEvent.employee_id == employee_id,
            TimeClockEvent.occurred_at < start,
        )
        .order_by(TimeClockEvent.occurred_at.asc())
        .all()
    )
    in_window_events = (
        db.query(TimeClockEvent)
        .filter(
            TimeClockEvent.employee_id == employee_id,
            TimeClockEvent.occurred_at >= start,
            TimeClockEvent.occurred_at < end,
        )
        .order_by(TimeClockEvent.occurred_at.asc())
        .all()
    )

    state = STATE_OFF_DUTY
    for ev in pre_events:
        state = _transition_state(state, ev.event_type)

    worked_total = 0
    break_total = 0
    prev_t = start

    for ev in in_window_events:
        t = ev.occurred_at
        if t > prev_t:
            delta = int((t - prev_t).total_seconds())
            if state == STATE_ON_SHIFT:
                worked_total += delta
            elif state == STATE_ON_BREAK:
                break_total += delta
        state = _transition_state(state, ev.event_type)
        prev_t = t

    if end > prev_t:
        delta = int((end - prev_t).total_seconds())
        if state == STATE_ON_SHIFT:
            worked_total += delta
        elif state == STATE_ON_BREAK:
            break_total += delta

    return max(0, worked_total), max(0, break_total)

# -------------------------
# TODAY totals (cumulative) — includes open shift/break up to "now"
# -------------------------

def _compute_today_totals_including_open(db: Session, employee_id: int) -> Tuple[int, int]:
    """
    Returns:
      worked_seconds_today (sum of all shift work today, excluding breaks)
      break_seconds_today  (sum of all breaks today)
    Behavior:
      - If user clocked out, totals stay until day ends
      - If user clocks in again, totals continue from previous
      - If shift/break is open, counts time up to now
      - After day changes, totals become 0 naturally (new day range)
    """
    start, end = _today_utc_range()
    now = min(_utcnow(), end)
    return _compute_totals_for_window(db, employee_id, start, now)

# -------------------------
# Schedule helpers
# -------------------------

def _today_schedule(db: Session, employee_id: int) -> List[ShiftScheduleRead]:
    start, end = _today_utc_range()
    shifts = (
        db.query(POSShiftSchedule)
        .filter(
            POSShiftSchedule.employee_id == employee_id,
            POSShiftSchedule.start_dt < end,
            POSShiftSchedule.end_dt > start,
        )
        .order_by(POSShiftSchedule.start_dt.asc())
        .all()
    )
    return [
        ShiftScheduleRead(
            id=s.id,
            employee_id=s.employee_id,
            start_dt=s.start_dt,
            end_dt=s.end_dt,
            role_label=s.role_label,
            note=s.note,
        )
        for s in shifts
    ]


def _to_clock_event_read(ev: TimeClockEvent) -> ClockEventRead:
    return ClockEventRead(
        id=ev.id,
        employee_id=ev.employee_id,
        event_type=ev.event_type.value if hasattr(ev.event_type, "value") else str(ev.event_type),
        occurred_at=ev.occurred_at,
        note=ev.note,
    )

# -------------------------
# Clock endpoints
# -------------------------

@router.post("/clock-in", response_model=ClockEventRead)
def clock_in(payload: ClockEventCreate, db: Session = Depends(get_db), user: User = Depends(require_employee)):
    _auto_close_stale_open_shift(db, user.id)
    state, _, _ = _infer_state(db, user.id)
    if state != STATE_OFF_DUTY:
        raise HTTPException(status_code=400, detail="Already clocked in")
    ev = TimeClockEvent(employee_id=user.id, event_type=ClockEventType.CLOCK_IN, occurred_at=_utcnow(), note=payload.note)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return _to_clock_event_read(ev)


@router.post("/break-start", response_model=ClockEventRead)
def break_start(payload: ClockEventCreate, db: Session = Depends(get_db), user: User = Depends(require_employee)):
    _auto_close_stale_open_shift(db, user.id)
    state, _, _ = _infer_state(db, user.id)
    if state != STATE_ON_SHIFT:
        raise HTTPException(status_code=400, detail="Not on shift")
    ev = TimeClockEvent(employee_id=user.id, event_type=ClockEventType.BREAK_START, occurred_at=_utcnow(), note=payload.note)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return _to_clock_event_read(ev)


@router.post("/break-end", response_model=ClockEventRead)
def break_end(payload: ClockEventCreate, db: Session = Depends(get_db), user: User = Depends(require_employee)):
    _auto_close_stale_open_shift(db, user.id)
    state, _, on_break_started_at = _infer_state(db, user.id)
    if state != STATE_ON_BREAK or not on_break_started_at:
        raise HTTPException(status_code=400, detail="Not on break")
    ev = TimeClockEvent(employee_id=user.id, event_type=ClockEventType.BREAK_END, occurred_at=_utcnow(), note=payload.note)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return _to_clock_event_read(ev)


@router.post("/clock-out", response_model=ClockEventRead)
def clock_out(payload: ClockEventCreate, db: Session = Depends(get_db), user: User = Depends(require_employee)):
    _auto_close_stale_open_shift(db, user.id)
    state, _, _ = _infer_state(db, user.id)
    if state != STATE_ON_SHIFT:
        raise HTTPException(status_code=400, detail="Not on shift (end break first if you are on break)")
    ev = TimeClockEvent(employee_id=user.id, event_type=ClockEventType.CLOCK_OUT, occurred_at=_utcnow(), note=payload.note)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return _to_clock_event_read(ev)


@router.get("/clock-status", response_model=ClockStatusRead)
def clock_status(db: Session = Depends(get_db), user: User = Depends(require_employee)):
    employee_id = user.id
    _auto_close_stale_open_shift(db, employee_id)
    state, shift_started_at, on_break_started_at = _infer_state(db, employee_id)
    last = (
        db.query(TimeClockEvent)
        .filter(TimeClockEvent.employee_id == employee_id)
        .order_by(TimeClockEvent.occurred_at.desc())
        .first()
    )

    # ✅ KEY CHANGE: Always return TODAY cumulative totals (worked + break), even if OFF_DUTY
    worked_today, break_today = _compute_today_totals_including_open(db, employee_id)

    return ClockStatusRead(
        state=state,
        last_event_at=last.occurred_at if last else None,
        shift_seconds_worked=worked_today,
        break_seconds=break_today,
        shift_started_at=shift_started_at if state != STATE_OFF_DUTY else None,
        on_break_started_at=on_break_started_at if state == STATE_ON_BREAK else None,
        today_schedule=_today_schedule(db, employee_id),
    )

@router.get("/work-time/daily", response_model=list[EmployeeWorkDailyRead])
def work_time_daily_report(
    date_str: Optional[str] = Query(default=None, alias="date"),
    employee_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_manager),
):
    """
    Daily worked/break report for admin/manager.
    Example: /api/employee/work-time/daily?date=2026-05-01
    """
    try:
        target_day = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else _business_now().date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    start, end = _report_utc_range(target_day)

    if employee_id is not None:
        employees = db.query(User).filter(User.id == employee_id).all()
        if not employees:
            raise HTTPException(status_code=404, detail="Employee not found")
    else:
        allowed_roles = ["manager", "employee", "cashier", "kitchen", "staff"]
        employees = (
            db.query(User)
            .filter(func.lower(func.trim(User.role)).in_(allowed_roles))
            .order_by(User.name.asc())
            .all()
        )

    def _fmt_hms(seconds: int) -> str:
        s = max(0, int(seconds))
        h = s // 3600
        m = (s % 3600) // 60
        sec = s % 60
        return f"{h:02d}:{m:02d}:{sec:02d}"

    rows = []
    for emp in employees:
        _auto_close_stale_open_shift(db, emp.id)
        worked, brk = _compute_totals_for_window(db, emp.id, start, end)
        rows.append(
            {
                "employee_id": emp.id,
                "employee_name": emp.name,
                "role": str(getattr(emp, "role", "") or ""),
                "date": target_day.isoformat(),
                "worked_seconds": worked,
                "break_seconds": brk,
                "worked_hms": _fmt_hms(worked),
                "break_hms": _fmt_hms(brk),
            }
        )

    return rows

# -------------------------
# Schedule endpoints (optional)
# -------------------------

@router.get("/schedule/today", response_model=list[ShiftScheduleRead])
def schedule_today(db: Session = Depends(get_db), user: User = Depends(require_employee)):
    return _today_schedule(db, user.id)

@router.post("/schedule", response_model=ShiftScheduleRead)
def create_schedule(payload: ShiftScheduleCreate, db: Session = Depends(get_db), user: User = Depends(require_manager)):
    s = POSShiftSchedule(
        employee_id=payload.employee_id,
        start_dt=payload.start_dt,
        end_dt=payload.end_dt,
        role_label=payload.role_label,
        note=payload.note,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return ShiftScheduleRead(
        id=s.id,
        employee_id=s.employee_id,
        start_dt=s.start_dt,
        end_dt=s.end_dt,
        role_label=s.role_label,
        note=s.note,
    )
