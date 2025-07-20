import * as React from "react"

// iPhone 6.5" and 6.7" screen width range: 414px-428px
const MOBILE_BREAKPOINT = 640  // Anything below 640px is considered mobile (iPhone/small devices)
const IPHONE_MAX_WIDTH = 428   // iPhone 6.7" max width

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// iPhone-specific hook for 6.5" and 6.7" detection
export function useIsIPhone() {
  const [isIPhone, setIsIPhone] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${IPHONE_MAX_WIDTH}px)`)
    const onChange = () => {
      setIsIPhone(window.innerWidth <= IPHONE_MAX_WIDTH)
    }
    mql.addEventListener("change", onChange)
    setIsIPhone(window.innerWidth <= IPHONE_MAX_WIDTH)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isIPhone
}

// Generic media query hook
export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => {
      setMatches(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setMatches(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return !!matches
}
