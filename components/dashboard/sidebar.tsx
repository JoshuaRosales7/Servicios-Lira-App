'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Calculator,
    Users,
    FileText,
    LayoutDashboard,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Scale,
    Landmark,
    Receipt,
    StickyNote,
    Activity,
    UploadCloud,
    MessageSquare
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

interface SidebarProps {
    user: User
    profile: Profile | null
}

const navigationItems = [
    { name: 'Panel', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/dashboard/clients', icon: Users },
    { name: 'Datos Fiscales', href: '/dashboard/fiscal', icon: Receipt },
    { name: 'Datos Legales', href: '/dashboard/legal', icon: Scale },
    { name: 'Banca', href: '/dashboard/banking', icon: Landmark },
    { name: 'Documentos', href: '/dashboard/documents', icon: FileText },
    { name: 'Importar', href: '/dashboard/import', icon: UploadCloud },
    { name: 'Solicitudes', href: '/dashboard/tickets', icon: MessageSquare },
    { name: 'Notas', href: '/dashboard/notes', icon: StickyNote },
    { name: 'Actividad', href: '/dashboard/activity', icon: Activity },
]

const bottomItems = [
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
]

import { ModeToggle } from '@/components/mode-toggle'

export function Sidebar({ user, profile }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/auth/login')
        router.refresh()
    }

    // Filter navigation items based on role
    const isAdmin = profile?.role === 'admin'
    const filteredNavItems = isAdmin
        ? navigationItems
        : navigationItems.filter(item => ['Panel', 'Solicitudes'].includes(item.name))

    return (
        <aside
            className={cn(
                'flex flex-col border-r bg-background transition-all duration-300 ease-in-out select-none relative z-50 h-full',
                collapsed ? 'w-20' : 'w-64'
            )}
        >
            <div className="flex h-16 items-center px-6">
                {!collapsed ? (
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Calculator className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-base tracking-tight">NOMBRE PANEL</span>
                    </Link>
                ) : (
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Calculator className="h-4 w-4" />
                    </div>
                )}
            </div>

            <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                <div className="space-y-1">
                    {!collapsed && <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Sistema</p>}
                    {filteredNavItems.map((item) => {
                        const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors group',
                                    isActive
                                        ? 'bg-primary/5 text-primary'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground/70")} />
                                {!collapsed && <span>{item.name}</span>}
                            </Link>
                        )
                    })}
                </div>
            </div>

            <div className="p-3 space-y-4">
                <div className="flex items-center justify-between px-3">
                    {!collapsed && <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Tema</span>}
                    <ModeToggle />
                </div>

                <div className="space-y-1">
                    {bottomItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors group',
                                    isActive
                                        ? 'bg-primary/5 text-primary'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                {!collapsed && <span>{item.name}</span>}
                            </Link>
                        )
                    })}
                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive"
                    >
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span>Salir</span>}
                    </button>
                </div>

                <div className="pt-4 border-t border-border/50">
                    <div className={cn("flex items-center gap-3 p-2 rounded-lg transition-colors bg-muted/50")}>
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold">
                            {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 truncate">
                                <p className="text-xs font-bold truncate leading-none mb-1 text-foreground">
                                    {profile?.full_name?.split(' ')[0] || 'Admin'}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate font-medium">
                                    {user.email}
                                </p>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => setCollapsed(!collapsed)}
                        >
                            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                        </Button>
                    </div>
                </div>
            </div>
        </aside>
    )
}
