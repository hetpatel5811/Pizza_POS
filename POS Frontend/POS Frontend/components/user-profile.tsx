// components/user-profile.tsx
"use client";

import { LogOut, Settings, MapPin, Heart, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!isOpen) return null;

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const avatarUrl =
    user?.name
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          user.name
        )}`
      : "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest";

  const handleLogout = () => {
    logout();
    onClose();
    router.push("/login");
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Profile Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-background z-50 shadow-xl overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-2xl">My Profile</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-2 border-primary">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-primary text-white font-bold text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-heading font-bold text-xl">
                  {user?.name || "Guest User"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {user?.email || "Not logged in"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user?.phone || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 mb-6">
            <Link href="/order-history" onClick={onClose}>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                size="lg"
              >
                <Clock className="w-5 h-5 mr-3" />
                Order History
              </Button>
            </Link>
            <Link href="/favorite-pizzas" onClick={onClose}>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                size="lg"
              >
                <Heart className="w-5 h-5 mr-3" />
                Favorite Pizzas
              </Button>
            </Link>

            <Link href="/account-settings" onClick={onClose}>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                size="lg"
              >
                <Settings className="w-5 h-5 mr-3" />
                Account Settings
              </Button>
            </Link>
          </div>

          {/* Logout */}
          <Button
            variant="destructive"
            className="w-full"
            size="lg"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}
