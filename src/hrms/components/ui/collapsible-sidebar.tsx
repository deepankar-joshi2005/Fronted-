import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  PanelLeftClose, 
  PanelLeftOpen 
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

interface SidebarContextType {
  isCollapsed: boolean
  toggle: () => void
  isMobile: boolean
  isMobileOpen: boolean
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export function SidebarProvider({ 
  children, 
  defaultCollapsed = false 
}: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const [isMobile, setIsMobile] = React.useState(false)
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  const toggle = React.useCallback(() => {
    if (isMobile) {
      setIsMobileOpen(prev => !prev)
    } else {
      setIsCollapsed(prev => !prev)
    }
  }, [isMobile])

  // Handle responsive behavior
  React.useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024 // Changed to 1024px for tablet support
      setIsMobile(mobile)
      // Auto-collapse on mobile/tablet
      if (mobile) {
        setIsMobileOpen(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Save sidebar state to localStorage (only for desktop)
  React.useEffect(() => {
    if (!isMobile) {
      const saved = localStorage.getItem("sidebar-collapsed")
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved))
      }
    }
  }, [isMobile])

  React.useEffect(() => {
    if (!isMobile) {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed))
    }
  }, [isCollapsed, isMobile])

  // Close mobile sidebar when clicking outside
  React.useEffect(() => {
    if (isMobile && isMobileOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element
        if (!target.closest('[data-sidebar]') && !target.closest('[data-sidebar-toggle]')) {
          setIsMobileOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobile, isMobileOpen])

  return (
    <SidebarContext.Provider value={{ 
      isCollapsed: isMobile ? false : isCollapsed, 
      toggle,
      isMobile,
      isMobileOpen 
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Sidebar({ children, className, ...props }: SidebarProps) {
  const { isCollapsed, isMobile, isMobileOpen } = useSidebar()

  return (
    <>
      {/* Mobile/Tablet overlay */}
      {isMobile && isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
      )}
      
      <div
        data-sidebar
        className={cn(
          "relative flex h-screen flex-col border-r transition-all duration-300 ease-in-out",
          "sidebar-gradient-bg text-[var(--sidebar-foreground)] border-[var(--sidebar-border)] shadow-premium-lg",
          // Desktop behavior
          "lg:relative lg:translate-x-0",
          // Mobile/Tablet behavior
          isMobile && "fixed left-0 top-0 z-50 transform",
          isMobile && !isMobileOpen && "-translate-x-full",
          isMobile && isMobileOpen && "translate-x-0",
          // Desktop width
          !isMobile && (isCollapsed ? "w-16" : "w-64"),
          // Mobile/Tablet width - responsive width
          isMobile && "w-72 sm:w-80",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  )
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function SidebarHeader({ 
  children, 
  className, 
  ...props 
}: SidebarHeaderProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div
      className={cn(
        "flex items-center border-b px-3 py-4",
        "border-[var(--sidebar-border)]",
        isCollapsed ? "justify-center" : "justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function SidebarContent({ 
  children, 
  className, 
  ...props 
}: SidebarContentProps) {
  return (
    <div
      className={cn("flex-1 overflow-auto py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarToggleProps extends React.ComponentProps<typeof Button> {}

export function SidebarToggle({ className, ...props }: SidebarToggleProps) {
  const { isCollapsed, toggle, isMobile, isMobileOpen } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      data-sidebar-toggle
      className={cn(
        "h-8 w-8 rounded-md",
        "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover-bg)]",
        className
      )}
      {...props}
    >
      {isMobile ? (
        // Mobile: show hamburger menu icon
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ) : isCollapsed ? (
        <PanelLeftOpen className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
      <span className="sr-only">
        {isMobile 
          ? (isMobileOpen ? "Close sidebar" : "Open sidebar")
          : (isCollapsed ? "Expand sidebar" : "Collapse sidebar")
        }
      </span>
    </Button>
  )
}

interface SidebarTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function SidebarTitle({ 
  children, 
  className, 
  ...props 
}: SidebarTitleProps) {
  const { isCollapsed } = useSidebar()

  if (isCollapsed) return null

  return (
    <h2
      className={cn(
        "text-lg font-semibold tracking-tight truncate",
        "text-[var(--sidebar-title)]",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function SidebarNav({ children, className, ...props }: SidebarNavProps) {
  return (
    <nav
      className={cn("space-y-1 px-3", className)}
      {...props}
    >
      {children}
    </nav>
  )
}

interface SidebarNavItemProps {
  to: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}

export function SidebarNavItem({ 
  to, 
  icon: Icon, 
  children, 
  className 
}: SidebarNavItemProps) {
  const { isCollapsed } = useSidebar()
  const location = useLocation()
  
  // Only match exact path to prevent parent routes from matching child routes
  // e.g., "/superadmin" should NOT match "/superadmin/messages"
  const isActive = location.pathname === to

  return (
    <NavLink
      to={to}
      end={true}
      className={({ isActive: linkActive }) => {
        const active = isActive || linkActive
        return cn(
          "group relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          active
            ? "bg-gradient-to-r from-[var(--sidebar-primary)] to-[#7C3AED] text-white shadow-premium-sm"
            : "text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-foreground)] hover:translate-x-0.5",
          isCollapsed && "justify-center px-2 hover:translate-x-0",
          className
        )
      }}
    >
      {({ isActive: linkActive }) => {
        const active = isActive || linkActive
        return (
          <>
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                active && "bg-white/15",
                !isCollapsed && "mr-3"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
            </span>
            {!isCollapsed && <span className="truncate">{children}</span>}
            {isCollapsed && <span className="sr-only">{children}</span>}
          </>
        )
      }}
    </NavLink>
  )
}

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  label?: string
}

export function SidebarGroup({ 
  children, 
  label, 
  className, 
  ...props 
}: SidebarGroupProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className={cn("space-y-1", className)} {...props}>
      {label && !isCollapsed && (
        <h3 className="px-3 text-xs font-medium !text-[var(--sidebar-foreground)] uppercase tracking-wider opacity-80">
          {label}
        </h3>
      )}
      {children}
    </div>
  )
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function SidebarFooter({ 
  children, 
  className, 
  ...props 
}: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "border-t p-3",
        "border-[var(--sidebar-border)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
