'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Store,
  CalendarClock,
  Package,
  BrainCircuit,
  PieChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  pro?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',                    label: 'Dashboard',          icon: LayoutDashboard },
  { href: '/dashboard/retailers',          label: 'Retailers',          icon: Store },
  { href: '/dashboard/schedules',          label: 'Schedules',          icon: CalendarClock },
  { href: '/dashboard/products',           label: 'Products',           icon: Package },
  { href: '/dashboard/ai-timing',          label: 'AI Reorder Timing',  icon: BrainCircuit, pro: true },
  { href: '/dashboard/spend-intelligence', label: 'Spend Intelligence', icon: PieChart,     pro: true },
  { href: '/dashboard/settings',           label: 'Settings',           icon: Settings },
]

const PLAN_STYLES: Record<string, string> = {
  free:         'bg-gray-100 text-gray-500',
  consumer:     'bg-blue-100 text-blue-700',
  professional: 'bg-rx-orange-light text-rx-orange',
  business:     'bg-purple-100 text-purple-700',
}

interface SidebarProps {
  userName?: string
  userEmail?: string
  avatarUrl?: string
  planTier?: string
}

export default function Sidebar({ userName, userEmail, avatarUrl, planTier = 'free' }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const initials = (userName ?? userEmail ?? 'U')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const planLabel = {
    free: 'Free', consumer: 'Consumer', professional: 'Professional', business: 'Business SMB',
  }[planTier] ?? 'Free'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <aside
      className={`relative flex flex-col h-screen bg-rx-navy text-white transition-all duration-300 ease-in-out shrink-0 z-10
        ${collapsed ? 'w-[72px]' : 'w-60'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-rx-navy-lighter">
        <Image
          src="/restox-logo-icon.png"
          alt="Restox"
          width={32}
          height={32}
          className="shrink-0 rounded-lg"
        />
        {!collapsed && (
          <span className="font-heading font-bold text-lg tracking-tight">Restox</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, pro }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-lg transition-colors duration-150
                ${active
                  ? 'bg-rx-orange text-white'
                  : 'text-white/60 hover:bg-rx-navy-lighter hover:text-white'
                }`}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="font-body text-sm font-medium flex-1 truncate">{label}</span>
                  {pro && !active && (
                    <span className="text-[10px] font-bold bg-rx-orange/20 text-rx-orange-light px-1.5 py-0.5 rounded">
                      PRO
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plan badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-rx-navy-lighter">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_STYLES[planTier] ?? PLAN_STYLES.free}`}>
            {planLabel}
          </span>
        </div>
      )}

      {/* User row */}
      <div className={`flex items-center gap-3 px-4 py-4 border-t border-rx-navy-lighter ${collapsed ? 'justify-center' : ''}`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName ?? 'User'} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-rx-blue flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold font-body">{initials}</span>
          </div>
        )}
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate font-body">{userName ?? userEmail ?? 'User'}</p>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-rx-orange transition-colors"
            >
              <LogOut size={10} /> Sign out
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-[72px] w-6 h-6 bg-rx-navy border border-rx-navy-lighter rounded-full
          flex items-center justify-center text-white/50 hover:text-white hover:bg-rx-blue transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
