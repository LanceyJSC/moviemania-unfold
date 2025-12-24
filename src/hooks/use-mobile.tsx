import * as React from "react"

// Breakpoints for different device categories
const MOBILE_BREAKPOINT = 768   // Below this is mobile (phones)
const TABLET_BREAKPOINT = 1024  // Between mobile and this is tablet (iPad, etc.)

// Hook to detect mobile devices (phones) - under 768px
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(true) // Default to true for SSR/iframe safety

  React.useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth
      // Mobile is anything under tablet breakpoint (768px)
      setIsMobile(width < MOBILE_BREAKPOINT)
    }
    
    checkMobile()
    
    window.addEventListener('resize', checkMobile)
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      mql.removeEventListener("change", checkMobile)
    }
  }, [])

  return isMobile
}

// Hook to detect tablet devices (iPad, etc.) - between 768px and 1024px
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT)
    }
    
    checkTablet()
    
    window.addEventListener('resize', checkTablet)
    
    return () => {
      window.removeEventListener('resize', checkTablet)
    }
  }, [])

  return isTablet
}

// Hook to detect any mobile/touch device (phones + tablets) - under 1024px
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = React.useState<boolean>(true)

  React.useEffect(() => {
    const checkTouch = () => {
      const width = window.innerWidth
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      // Consider it a touch device if under tablet breakpoint OR has touch with reasonable width
      setIsTouchDevice(width < TABLET_BREAKPOINT || (hasTouch && width < 1280))
    }
    
    checkTouch()
    window.addEventListener('resize', checkTouch)
    
    return () => {
      window.removeEventListener('resize', checkTouch)
    }
  }, [])

  return isTouchDevice
}

// Generic media query hook
export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => {
      setMatches(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setMatches(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}
