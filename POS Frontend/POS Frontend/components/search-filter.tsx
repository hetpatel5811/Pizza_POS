"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchFilterProps {
  onSearch: (query: string) => void
}

export function SearchFilter({ onSearch }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/75" />
        <Input
          type="text"
          placeholder="Search pizzas by name, style, or ingredients"
          value={searchQuery}
          onChange={(event) => handleSearch(event.target.value)}
          className="h-12 rounded-xl border-[#d8b896] bg-card/90 pl-12 pr-11 text-sm shadow-sm placeholder:text-muted-foreground/80"
        />

        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleSearch("")}
            className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
