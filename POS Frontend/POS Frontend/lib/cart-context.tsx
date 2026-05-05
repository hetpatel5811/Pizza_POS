"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface SelectedTopping {
  topping_id: number
  name: string
  price: number
  quantity: number
}

export interface CartItem {
  id: string
  menuItemId?: number
  name: string
  price: number
  size: string
  quantity: number
  image: string
  customizations?: {
    crust?: string
    crustOptionId?: number
    sauce?: string
    extraCheese?: boolean
    extraSauce?: boolean
    specialInstructions?: string
    extraToppings?: string[]
    toppings?: SelectedTopping[]
  }
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void

  // ✅ ADD BACK
  getTotalPrice: () => number

  clearCart: () => void
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  toggleCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
    setIsCartOpen(true)
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    )
  }

  // ✅ RESTORED FUNCTION
  const getTotalPrice = () => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const toggleCart = () => {
    setIsCartOpen(prev => !prev)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        getTotalPrice, // ✅ exposed
        clearCart,
        isCartOpen,
        setIsCartOpen,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}
