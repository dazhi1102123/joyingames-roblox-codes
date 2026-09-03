"use client"

import { useEffect, useState } from "react"

/** The one piece of chrome that must be a client component.
 *
 * Everything else on the site renders on the server -- that is what keeps the
 * SEO equal to the Flask original. This is deliberately small.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const stored = document.documentElement.dataset.theme
    if (stored === "dark" || stored === "light") setTheme(stored)
  }, [])

  function toggle() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem("theme", next)
    } catch {
      // Private browsing blocks this. Not a reason to fail the toggle.
    }
  }

  return (
    <button className="theme" onClick={toggle} aria-label="Switch colour theme">
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  )
}
