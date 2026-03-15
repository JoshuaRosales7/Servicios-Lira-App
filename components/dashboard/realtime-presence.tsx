'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RealtimePresenceProps {
    roomId: string
    userId: string
    userName: string
}

export function RealtimePresence({ roomId, userId, userName }: RealtimePresenceProps) {
    const [activeUsers, setActiveUsers] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase.channel(`room:${roomId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const users = Object.values(state).map((presenceState: any) => presenceState[0])
                setActiveUsers(users)
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                // Optional: show toast notification if needed
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                // Optional: show toast notification if needed
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: userId,
                        user_name: userName,
                        online_at: new Date().toISOString(),
                    })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, userId, userName, supabase])

    if (activeUsers.length <= 1) return null // Don't show if it's only the current user

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 animate-pulse flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Viendo ahora:
            </span>
            <div className="flex -space-x-2">
                <TooltipProvider>
                    {activeUsers.filter(u => u.user_id !== userId).map((user) => (
                        <Tooltip key={user.user_id}>
                            <TooltipTrigger asChild>
                                <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-900 shadow-sm transition-transform hover:scale-110 hover:z-10 cursor-pointer">
                                    <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                        {user.user_name?.substring(0, 2).toUpperCase() || 'US'}
                                    </AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">{user.user_name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
        </div>
    )
}
