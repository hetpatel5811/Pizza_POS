"use client"

import { type ImgHTMLAttributes, type SyntheticEvent, useEffect, useState } from "react"

type SmartImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string
}

const DEFAULT_FALLBACK = "/placeholder.svg"

function resolveSrc(src?: string, fallbackSrc?: string) {
  if (src && src.trim()) return src
  if (fallbackSrc && fallbackSrc.trim()) return fallbackSrc
  return DEFAULT_FALLBACK
}

export function SmartImage({ src, fallbackSrc = DEFAULT_FALLBACK, onError, ...props }: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState(resolveSrc(typeof src === "string" ? src : undefined, fallbackSrc))

  useEffect(() => {
    setCurrentSrc(resolveSrc(typeof src === "string" ? src : undefined, fallbackSrc))
  }, [src, fallbackSrc])

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
    } else if (currentSrc !== DEFAULT_FALLBACK) {
      setCurrentSrc(DEFAULT_FALLBACK)
    }

    onError?.(event)
  }

  return <img {...props} src={currentSrc} onError={handleError} />
}
