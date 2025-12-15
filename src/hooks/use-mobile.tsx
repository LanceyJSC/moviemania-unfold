import * as React from "react"

// iPhone 6.5" and 6.7" screen width range: 414px-428px
const MOBILE_BREAKPOINT = 640  // Anything below 640px is considered mobile (iPhone/small devices)
const IPHONE_MAX_WIDTH = 428   // iPhone 6.7" max width

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(true) // Default to true for SSR/iframe safety

  React.useEffect(() => {
    const checkMobile = () => {
      // Check multiple indicators for mobile detection
      const width = window.innerWidth
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = width < MOBILE_BREAKPOINT
      
      // Consider it mobile if small screen OR touch device with reasonable width
      setIsMobile(isSmallScreen || (isTouchDevice && width <= 768))
    }
    
    checkMobile()
    
    // Use both resize and matchMedia for better detection
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

// iPhone-specific hook for 6.5" and 6.7" detection
export function useIsIPhone() {
  const [isIPhone, setIsIPhone] = React.useState<boolean>(true) // Default to true for safety

  React.useEffect(() => {
    const checkIPhone = () => {
      setIsIPhone(window.innerWidth <= IPHONE_MAX_WIDTH)
    }
    
    checkIPhone()
    
    const mql = window.matchMedia(`(max-width: ${IPHONE_MAX_WIDTH}px)`)
    mql.addEventListener("change", checkIPhone)
    window.addEventListener('resize', checkIPhone)
    
    return () => {
      mql.removeEventListener("change", checkIPhone)
      window.removeEventListener('resize', checkIPhone)
    }
  }, [])

  return isIPhone
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
