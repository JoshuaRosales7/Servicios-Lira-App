'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { Settings, CheckCircle, XCircle, Clock, AlertTriangle, PlayCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TicketActionsProps {
    ticketId: string
    currentStatus: string
    currentPriority: string
}

const statuses = [
    { value: 'open', label: 'Abierto', icon: Clock },
    { value: 'in_progress', label: 'En Proceso', icon: PlayCircle },
    { value: 'resolved', label: 'Resuelto', icon: CheckCircle },
    { value: 'closed', label: 'Cerrado', icon: XCircle },
]

const priorities = [
    { value: 'low', label: 'Baja' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
]

export function TicketActions({ ticketId, currentStatus, currentPriority }: TicketActionsProps) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Optimistic UI could be improved, but simple update is fine for now

    const updateField = async (field: 'status' | 'priority', value: string) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('tickets')
                .update({ [field]: value })
                .eq('id', ticketId)

            if (error) throw error

            toast.success(`${field === 'status' ? 'Estado' : 'Prioridad'} actualizado a ${value}`)
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Error al actualizar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={loading}>
                    <Settings className="h-4 w-4" />
                    Gestionar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Estado del Ticket</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={currentStatus} onValueChange={(v) => updateField('status', v)}>
                    {statuses.map((status) => (
                        <DropdownMenuRadioItem key={status.value} value={status.value} className="gap-2">
                            <status.icon className="h-4 w-4 opacity-50" />
                            {status.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Prioridad</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={currentPriority} onValueChange={(v) => updateField('priority', v)}>
                    {priorities.map((priority) => (
                        <DropdownMenuRadioItem key={priority.value} value={priority.value}>
                            {priority.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
