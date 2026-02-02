'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from '@/lib/utils'
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead } from '@/app/actions/system'
import { Notification } from '@/lib/types'
import { toast } from 'sonner'
import Link from 'next/link'

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)

    const fetchData = async () => {
        try {
            const count = await getUnreadNotificationCount()
            setUnreadCount(count)

            // If open, fetch the list too
            if (isOpen) {
                const list = await getNotifications()
                setNotifications(list)
            }
        } catch (e) {
            console.error(e)
        }
    }

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [isOpen])

    // When opening, fetch list and mark visible as read (optional, or user manually marks)
    // Let's just fetch list
    useEffect(() => {
        if (isOpen) {
            getNotifications().then(setNotifications)
        }
    }, [isOpen])

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead()
        setUnreadCount(0)
        setNotifications([]) // Clear list as user only wants unread
        toast.success("Todas marcadas como leídas")
    }

    const handleMarkRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()

        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id))
        setUnreadCount(prev => Math.max(0, prev - 1))

        await markNotificationAsRead(id)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-4 border-b flex items-center justify-between">
                    <h4 className="font-semibold leading-none">Notificaciones</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleMarkAllRead}>
                            Marcar leídas
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No tienes notificaciones</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors relative group",
                                        !notification.is_read ? "bg-muted/20" : ""
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className={cn("text-sm font-medium leading-none", !notification.is_read && "font-bold")}>
                                                    {notification.title}
                                                </p>
                                                {notification.actor_profile && (
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium border",
                                                        notification.actor_profile.role === 'admin'
                                                            ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                                            : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                    )}>
                                                        {notification.actor_profile.full_name || 'Usuario'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/70">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>

                                            {notification.link && (
                                                <div className="pt-2">
                                                    <Link href={notification.link} className='text-xs text-primary hover:underline' onClick={() => setIsOpen(false)}>
                                                        Ver detalles
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                                                onClick={(e) => handleMarkRead(notification.id, e)}
                                                title="Marcar como leída"
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
