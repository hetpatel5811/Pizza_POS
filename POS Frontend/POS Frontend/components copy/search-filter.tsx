"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

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
    <div className="flex gap-3 mb-6">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500"
        />
        <Input
          type="text"
          placeholder="Search for pizzas..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="
            pl-10 h-12 text-base 
            bg-orange-50 
            text-black 
            border border-orange-200 
            rounded-xl 
            placeholder:text-black-300
            focus:ring-2 focus:ring-orange-300
            focus:border-orange-400
            transition-all
          "
        />
      </div>
    </div>
  )
}
