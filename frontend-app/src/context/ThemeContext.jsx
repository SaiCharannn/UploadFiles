import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Restore from localStorage, default to 'dark'
    return localStorage.getItem('uf_theme') || 'dark'
  })

  useEffect(() => {
    // Apply theme class to <html> element so CSS vars cascade everywhere
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('uf_theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
