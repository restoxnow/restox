'use client'
import { useEffect, useRef } from 'react'

export function useScrollReveal<T extends HTMLElement>(
  animClass = 'reveal',
  options?: IntersectionObserverInit
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}

export function useScrollRevealChildren(
  animClass = 'reveal',
  options?: IntersectionObserverInit
) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const children = container.querySelectorAll(`.${animClass}`)
    const observers: IntersectionObserver[] = []

    children.forEach((child) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.disconnect()
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -30px 0px', ...options }
      )
      observer.observe(child)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [animClass])

  return ref
}
