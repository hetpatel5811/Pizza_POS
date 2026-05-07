const PIZZA_IMAGES = [
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1613564834361-9436948817d1?auto=format&fit=crop&w=1400&q=80",
]

const LIFESTYLE_IMAGES = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1800&q=80",
]

function hashText(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getPizzaImageByName(name?: string | null) {
  const key = String(name || "pizza")
  return PIZZA_IMAGES[hashText(key) % PIZZA_IMAGES.length]
}

export function getHeroImage() {
  return LIFESTYLE_IMAGES[0]
}

export function getChefImage() {
  return LIFESTYLE_IMAGES[1]
}

export function getDiningImage() {
  return LIFESTYLE_IMAGES[2]
}

export function getAllPizzaImages() {
  return PIZZA_IMAGES
}
