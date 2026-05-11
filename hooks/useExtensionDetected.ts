'use client'

import { useState, useEffect } from 'react'

export function useExtensionDetected(): boolean | null {
  const [detected, setDetected] = useState<boolean | null>(null)

  useEffect(() => {
    const check = () =>
      document.documentElement.getAttribute('data-restox-ext') === '1'

    if (check()) {
      setDetected(true)
      return
    }

    const timer = setTimeout(() => {
      setDetected(check())
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return detected
}
