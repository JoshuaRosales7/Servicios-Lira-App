'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import {
    Search,
    Bell,
    HelpCircle,
    Command,
    Plus,
    Sparkles
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NeuroSearchDialog } from '@/components/dashboard/neuro-search-dialog'
import { useState } from 'react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { NotificationCenter } from '@/components/dashboard/notification-center'

export function TopBar({ isAdmin = false }: { isAdmin?: boolean }) {
    const pathname = usePathname()
    const [isNeuroOpen, setIsNeuroOpen] = useState(false)

    // Debug log to confirm render
    // console.log('TopBar rendered, isNeuroOpen:', isNeuroOpen)

    // Breadcrumb logic
    const segments = pathname.split('/').filter(Boolean)

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur-xl transition-all duration-300">
            <div className="flex h-14 items-center justify-between px-6 lg:px-8">
                <div className="flex items-center gap-4">
                    <Breadcrumb className="hidden sm:flex">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="transition-colors hover:text-primary">
                                    Panel
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {segments.length > 1 && <BreadcrumbSeparator />}
                            {segments.slice(1).map((segment, index) => {
                                const href = `/${segments.slice(0, index + 2).join('/')}`
                                const isLast = index === segments.length - 2
                                const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

                                return (
                                    <React.Fragment key={href}>
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage className="font-semibold text-foreground capitalize">{label}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink href={href} className="capitalize transition-colors hover:text-primary">{label}</BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && <BreadcrumbSeparator />}
                                    </React.Fragment>
                                )
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="flex items-center gap-3 lg:gap-4">
                    <div
                        className="hidden md:flex relative items-center group cursor-pointer"
                        onClick={() => document.dispatchEvent(new CustomEvent('command-menu-open'))}
                    >
                        <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <div
                            className="flex items-center pl-9 h-9 w-[260px] lg:w-[320px] bg-muted/40 border-none text-xs rounded-lg transition-all text-muted-foreground group-hover:bg-muted/60"
                        >
                            Buscar (Cmd + K)
                        </div>
                        <kbd className="absolute right-3 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-50 md:flex">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>

                    <div className="flex items-center gap-1 border-l pl-3 lg:pl-4">
                        {isAdmin && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 text-indigo-500 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900 dark:hover:bg-indigo-950/30 hidden sm:flex mr-1 shadow-[0_0_10px_theme(colors.indigo.500/20%)] transition-all hover:shadow-[0_0_15px_theme(colors.indigo.500/40%)]"
                                onClick={() => setIsNeuroOpen(true)}
                                title="Asistente IA"
                            >
                                <Sparkles className="h-4 w-4 fill-indigo-500/20" />
                            </Button>
                        )}

                        {isAdmin && (
                            <Link href="/dashboard/clients/new">
                                <Button size="sm" variant="ghost" className="hidden sm:flex h-9 gap-2 text-xs font-semibold px-3">
                                    <Plus className="h-4 w-4" />
                                    <span>Nuevo</span>
                                </Button>
                            </Link>
                        )}

                        <NotificationCenter />

                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                            <HelpCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <NeuroSearchDialog open={isNeuroOpen} onOpenChange={setIsNeuroOpen} />
        </header>
    )
}
