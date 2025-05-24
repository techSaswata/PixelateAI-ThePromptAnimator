"use client"

import { usePathname } from "next/navigation"
import Navbar from "./Navbar"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Pages that should NOT show the navbar
  const noNavbarPages = ["/", "/login", "/signup"]
  
  const shouldShowNavbar = pathname ? !noNavbarPages.includes(pathname) : false

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <div className={shouldShowNavbar ? "pt-16" : ""}>
        {children}
      </div>
    </>
  )
} 