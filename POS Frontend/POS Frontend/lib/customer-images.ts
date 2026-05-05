const PIZZA_IMAGES = [
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1548365328-9f547fb0953f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600628422019-56f5ad7fcecc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1200&q=80",
]

const LIFESTYLE_IMAGES = [
  "https://images.unsplash.com/photo-1594007654729-407eedc4fe0f?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1600&q=80",
]

function hashText(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
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
