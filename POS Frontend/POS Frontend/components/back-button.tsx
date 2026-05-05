"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  label?: string
  href?: string
  className?: string
}

export function BackButton({ label = "Back", href, className }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <Button variant="ghost" onClick={handleClick} className={className ?? "mb-6"}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  )
}
