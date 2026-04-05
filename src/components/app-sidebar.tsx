"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Layers, Target, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SignOutButton } from "@/components/sign-out-button"

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/processes", label: "Process Map", icon: Layers },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar({ lastSyncAt }: { lastSyncAt?: Date | null }) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="px-2 text-lg font-bold text-foreground hover:opacity-80">
          Expliq
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href)
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      data-active={isActive}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="px-2 text-[11px] text-text-tertiary">
          {lastSyncAt ? `Synced ${formatTimeAgo(lastSyncAt)}` : "Not synced"}
        </p>
        <SignOutButton />
      </SidebarFooter>
    </Sidebar>
  )
}
