"use client"

import { ChangeEvent, useEffect, useMemo, useState } from "react"
import { Camera, Heart, History, Save, User2 } from "lucide-react"

import { BackButton } from "@/components/back-button"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useAuth from "@/hooks/useAuth"
import { useFavorites } from "@/hooks/useFavorites"
import { useToast } from "@/hooks/use-toast"
import { me, updateMe } from "@/lib/api/auth"
import { listCustomerOrders } from "@/lib/api/customerOrders"

type ProfileForm = {
  name: string
  email: string
  phone: string
  avatar: string
}

type ProfileActivity = {
  orderCount: number
  favoriteCount: number
  lastOrderDate: string
}

function getAvatarStorageKey(userId?: number, userEmail?: string) {
  if (typeof userId === "number") return `fhp:profile-avatar:id:${userId}`
  if (userEmail?.trim()) return `fhp:profile-avatar:email:${userEmail.trim().toLowerCase()}`
  return "fhp:profile-avatar:guest"
}

function toInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "CU"
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
}

function formatDateLabel(value: string) {
  if (!value) return "No orders yet"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "No orders yet"
  return parsed.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function AccountSettingsPage() {
  const { user, token, updateUser } = useAuth()
  const { favorites } = useFavorites()
  const { toast } = useToast()

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [activity, setActivity] = useState<ProfileActivity>({
    orderCount: 0,
    favoriteCount: 0,
    lastOrderDate: "",
  })

  const avatarStorageKey = useMemo(() => getAvatarStorageKey(user?.id, user?.email), [user?.email, user?.id])

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      if (!user) {
        setForm({ name: "", email: "", phone: "", avatar: "" })
        setIsLoadingProfile(false)
        return
      }

      const localAvatar = typeof window !== "undefined" ? localStorage.getItem(avatarStorageKey) || "" : ""

      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar: localAvatar,
      })

      if (!token) {
        if (active) setIsLoadingProfile(false)
        return
      }

      try {
        const liveProfile = await me(token)
        if (!active) return

        updateUser({
          name: liveProfile.name,
          email: liveProfile.email,
          phone: liveProfile.phone,
        })

        setForm((prev) => ({
          ...prev,
          name: liveProfile.name || prev.name,
          email: liveProfile.email || prev.email,
          phone: liveProfile.phone || prev.phone,
        }))
      } catch {
        // keep locally available user data
      } finally {
        if (active) setIsLoadingProfile(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [avatarStorageKey, token, updateUser, user])

  useEffect(() => {
    let active = true

    const loadActivity = async () => {
      if (!user) {
        setActivity({ orderCount: 0, favoriteCount: 0, lastOrderDate: "" })
        return
      }

      try {
        const orders = await listCustomerOrders({ limit: 200 })
        if (!active) return

        const sortedOrders = [...orders].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setActivity({
          orderCount: sortedOrders.length,
          favoriteCount: favorites.length,
          lastOrderDate: sortedOrders[0]?.created_at || "",
        })
      } catch {
        if (!active) return
        setActivity((prev) => ({
          ...prev,
          favoriteCount: favorites.length,
        }))
      }
    }

    loadActivity()

    return () => {
      active = false
    }
  }, [favorites.length, user])

  useEffect(() => {
    setActivity((prev) => ({ ...prev, favoriteCount: favorites.length }))
  }, [favorites.length])

  const handleFieldChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (!result) return

      setForm((prev) => ({ ...prev, avatar: result }))
      localStorage.setItem(avatarStorageKey, result)

      toast({
        title: "Avatar updated",
        description: "Your profile photo was updated successfully.",
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setForm((prev) => ({ ...prev, avatar: "" }))
    localStorage.removeItem(avatarStorageKey)
  }

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to update your profile.",
      })
      return
    }

    const nextName = form.name.trim()
    const nextEmail = form.email.trim()
    const nextPhone = form.phone.trim()

    if (!nextName || !nextEmail || !nextPhone) {
      toast({
        title: "Missing details",
        description: "Name, email, and phone are required.",
      })
      return
    }

    setIsSaving(true)

    try {
      if (token) {
        const updated = await updateMe(token, {
          name: nextName,
          email: nextEmail,
          phone: nextPhone,
        })

        updateUser({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
        })
      } else {
        updateUser({
          name: nextName,
          email: nextEmail,
          phone: nextPhone,
        })
      }

      if (form.avatar) {
        localStorage.setItem(avatarStorageKey, form.avatar)
      }

      toast({
        title: "Profile saved",
        description: "Your account settings are now updated.",
      })
    } catch (error) {
      toast({
        title: "Unable to save",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
          <BackButton />

          <div className="mb-8">
            <h1 className="mb-3 font-heading text-4xl font-bold md:text-5xl">Account Settings</h1>
            <p className="text-lg text-muted-foreground">Fully dynamic profile settings synced with your customer account.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border bg-background p-6 shadow-sm">
              <h2 className="mb-6 flex items-center gap-2 font-heading text-2xl font-bold">
                <User2 className="h-6 w-6 text-primary" />
                Personal Information
              </h2>

              <div className="mb-8 flex flex-col gap-5 rounded-2xl border bg-muted/30 p-4 sm:flex-row sm:items-center">
                <Avatar className="h-24 w-24 border-2 border-primary/35">
                  <AvatarImage src={form.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-xl font-bold text-white">
                    {toInitials(form.name || user?.name || "Customer")}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-3">
                  <p className="font-semibold">Profile Photo</p>
                  <div className="flex flex-wrap gap-2">
                    <Label
                      htmlFor="profile-avatar-input"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <Camera className="h-4 w-4" />
                      Upload New
                    </Label>
                    <input id="profile-avatar-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

                    <Button type="button" variant="outline" onClick={handleRemoveAvatar} className="bg-transparent">
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={form.name}
                    onChange={(event) => handleFieldChange("name", event.target.value)}
                    disabled={isLoadingProfile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email Address</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => handleFieldChange("email", event.target.value)}
                    disabled={isLoadingProfile}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profile-phone">Phone Number</Label>
                  <Input
                    id="profile-phone"
                    value={form.phone}
                    onChange={(event) => handleFieldChange("phone", event.target.value)}
                    disabled={isLoadingProfile}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      name: user?.name || "",
                      email: user?.email || "",
                      phone: user?.phone || "",
                      avatar: typeof window !== "undefined" ? localStorage.getItem(avatarStorageKey) || "" : "",
                    })
                  }
                >
                  Reset
                </Button>
                <Button type="button" className="gap-2" onClick={handleSave} disabled={isSaving || isLoadingProfile}>
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border bg-background p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Profile Status</p>
                <p className="mt-2 font-heading text-2xl font-bold">{form.name || "Guest Customer"}</p>
                <Badge className="mt-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Dynamic profile active</Badge>
              </div>

              <div className="rounded-2xl border bg-background p-5 shadow-sm">
                <h3 className="mb-4 font-heading text-xl font-semibold">Customer Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-sm">
                      <History className="h-4 w-4 text-primary" />
                      Orders placed
                    </span>
                    <span className="font-semibold">{activity.orderCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-sm">
                      <Heart className="h-4 w-4 text-primary" />
                      Favorite pizzas
                    </span>
                    <span className="font-semibold">{activity.favoriteCount}</span>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <p className="text-sm text-muted-foreground">Last order date</p>
                    <p className="font-medium">{formatDateLabel(activity.lastOrderDate)}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
