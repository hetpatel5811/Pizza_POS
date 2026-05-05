"use client";

import { useEffect, useState } from "react";
import {
  createCrustOption,
  createTopping,
  listCrustOptions,
  listToppings,
  updateCrustOption,
  updateTopping,
  type CrustOptionRead,
  type ToppingRead,
} from "@/lib/api/menu";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function money(value: number | null | undefined) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

export default function MenuCustomizationManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toppings, setToppings] = useState<ToppingRead[]>([]);
  const [crustOptions, setCrustOptions] = useState<CrustOptionRead[]>([]);

  const [newToppingName, setNewToppingName] = useState("");
  const [newToppingDescription, setNewToppingDescription] = useState("");
  const [newToppingCategory, setNewToppingCategory] = useState("");
  const [newToppingPrice, setNewToppingPrice] = useState("0");
  const [newToppingVegetarian, setNewToppingVegetarian] = useState(true);

  const [newCrustName, setNewCrustName] = useState("");
  const [newCrustDescription, setNewCrustDescription] = useState("");
  const [newCrustPrice, setNewCrustPrice] = useState("0");
  const [newCrustSort, setNewCrustSort] = useState("0");

  async function refreshCustomizationData() {
    setError(null);
    setLoading(true);
    try {
      const [toppingData, crustData] = await Promise.all([
        listToppings({ only_available: false }),
        listCrustOptions({ only_available: false }),
      ]);
      setToppings(toppingData);
      setCrustOptions(crustData);
    } catch (e: any) {
      setError(e?.message || "Failed to load customization data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshCustomizationData();
  }, []);

  async function handleAddTopping() {
    setError(null);
    const name = newToppingName.trim();
    if (!name) {
      setError("Topping name is required");
      return;
    }
    const price = Number(newToppingPrice);
    if (!Number.isFinite(price) || price < 0) {
      setError("Topping price must be 0 or higher");
      return;
    }

    setLoading(true);
    try {
      await createTopping({
        name,
        description: newToppingDescription.trim() || null,
        category: newToppingCategory.trim() || null,
        price,
        is_vegetarian: newToppingVegetarian,
        is_available: true,
      });
      setNewToppingName("");
      setNewToppingDescription("");
      setNewToppingCategory("");
      setNewToppingPrice("0");
      setNewToppingVegetarian(true);
      await refreshCustomizationData();
    } catch (e: any) {
      setError(e?.message || "Failed to add topping");
      setLoading(false);
    }
  }

  async function handleToggleToppingAvailability(topping: ToppingRead) {
    setError(null);
    setLoading(true);
    try {
      await updateTopping(topping.id, { is_available: !topping.is_available });
      await refreshCustomizationData();
    } catch (e: any) {
      setError(e?.message || "Failed to update topping");
      setLoading(false);
    }
  }

  async function handleAddCrustOption() {
    setError(null);
    const name = newCrustName.trim();
    if (!name) {
      setError("Crust option name is required");
      return;
    }
    const price = Number(newCrustPrice);
    if (!Number.isFinite(price) || price < 0) {
      setError("Crust price adjustment must be 0 or higher");
      return;
    }
    const sortOrder = Number(newCrustSort);
    if (!Number.isFinite(sortOrder) || !Number.isInteger(sortOrder) || sortOrder < 0) {
      setError("Sort order must be a whole number >= 0");
      return;
    }

    setLoading(true);
    try {
      await createCrustOption({
        name,
        description: newCrustDescription.trim() || null,
        price_adjustment: price,
        sort_order: sortOrder,
        is_available: true,
      });
      setNewCrustName("");
      setNewCrustDescription("");
      setNewCrustPrice("0");
      setNewCrustSort("0");
      await refreshCustomizationData();
    } catch (e: any) {
      setError(e?.message || "Failed to add crust option");
      setLoading(false);
    }
  }

  async function handleToggleCrustAvailability(option: CrustOptionRead) {
    setError(null);
    setLoading(true);
    try {
      await updateCrustOption(option.id, { is_available: !option.is_available });
      await refreshCustomizationData();
    } catch (e: any) {
      setError(e?.message || "Failed to update crust option");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="text-sm font-black text-slate-900">Customization Management</div>
        <div className="mt-1 text-xs font-semibold text-slate-600">
          Add or hide crust types and toppings used in the customer customization modal.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-black text-slate-900">Crust Options</div>
          <div className="mt-1 text-xs font-semibold text-slate-600">Dynamic crust list with optional upcharge.</div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <input
              value={newCrustName}
              onChange={(e) => setNewCrustName(e.target.value)}
              placeholder="Crust name (e.g. Garlic Crust)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
            />
            <input
              value={newCrustDescription}
              onChange={(e) => setNewCrustDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={newCrustPrice}
                onChange={(e) => setNewCrustPrice(e.target.value)}
                placeholder="Upcharge (e.g. 2.50)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
              />
              <input
                value={newCrustSort}
                onChange={(e) => setNewCrustSort(e.target.value)}
                placeholder="Sort order"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <button
              onClick={handleAddCrustOption}
              disabled={loading}
              className={cx(
                "rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white",
                loading ? "opacity-60" : "hover:bg-slate-800"
              )}
            >
              Add Crust Option
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {crustOptions.map((option) => (
              <div key={option.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {option.name} <span className="font-semibold text-slate-500">({money(option.price_adjustment)})</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    {option.is_available ? "Visible to customers" : "Hidden from customers"}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleCrustAvailability(option)}
                  disabled={loading}
                  className={cx(
                    "rounded-lg px-3 py-1.5 text-xs font-black",
                    option.is_available ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-emerald-600 text-white hover:bg-emerald-700"
                  )}
                >
                  {option.is_available ? "Hide" : "Show"}
                </button>
              </div>
            ))}
            {crustOptions.length === 0 ? (
              <div className="text-sm font-semibold text-slate-500">No crust options yet.</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-black text-slate-900">Toppings</div>
          <div className="mt-1 text-xs font-semibold text-slate-600">Manage extra topping options for customers.</div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <input
              value={newToppingName}
              onChange={(e) => setNewToppingName(e.target.value)}
              placeholder="Topping name (e.g. Jalapeno)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
            />
            <input
              value={newToppingDescription}
              onChange={(e) => setNewToppingDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={newToppingCategory}
                onChange={(e) => setNewToppingCategory(e.target.value)}
                placeholder="Category (optional)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
              />
              <input
                value={newToppingPrice}
                onChange={(e) => setNewToppingPrice(e.target.value)}
                placeholder="Price (e.g. 1.25)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={newToppingVegetarian}
                onChange={(e) => setNewToppingVegetarian(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Vegetarian
            </label>
            <button
              onClick={handleAddTopping}
              disabled={loading}
              className={cx(
                "rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white",
                loading ? "opacity-60" : "hover:bg-slate-800"
              )}
            >
              Add Topping
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {toppings.map((topping) => (
              <div key={topping.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {topping.name} <span className="font-semibold text-slate-500">({money(topping.price)})</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    {topping.is_available ? "Visible to customers" : "Hidden from customers"}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleToppingAvailability(topping)}
                  disabled={loading}
                  className={cx(
                    "rounded-lg px-3 py-1.5 text-xs font-black",
                    topping.is_available ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-emerald-600 text-white hover:bg-emerald-700"
                  )}
                >
                  {topping.is_available ? "Hide" : "Show"}
                </button>
              </div>
            ))}
            {toppings.length === 0 ? (
              <div className="text-sm font-semibold text-slate-500">No toppings yet.</div>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="border-t border-slate-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700">{error}</div>
      ) : null}
    </div>
  );
}
