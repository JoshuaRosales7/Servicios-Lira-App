'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function CreateTicketDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const subject = formData.get('subject') as string
        const priority = formData.get('priority') as string
        const message = formData.get('message') as string

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No usuario autenticado')

            // 1. Crear el Ticket
            const { data: ticket, error: ticketError } = await supabase
                .from('tickets')
                .insert({
                    client_id: user.id,
                    subject,
                    priority,
                    status: 'open'
                })
                .select()
                .single()

            if (ticketError) throw ticketError

            // 2. Crear el primer mensaje
            const { error: messageError } = await supabase
                .from('ticket_messages')
                .insert({
                    ticket_id: ticket.id,
                    user_id: user.id,
                    message: message
                })

            if (messageError) throw messageError

            toast.success('Solicitud creada correctamente')
            setOpen(false)
            router.refresh()
            router.push(`/dashboard/tickets/${ticket.id}`)

        } catch (error) {
            console.error(error)
            toast.error('Error al crear la solicitud')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Nueva Solicitud
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Crear Nueva Solicitud</DialogTitle>
                        <DialogDescription>
                            Describe tu problema o requerimiento. Te atenderemos lo antes posible.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="subject">Asunto</Label>
                            <Input id="subject" name="subject" placeholder="Ej: Necesito mi constancia fiscal" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Prioridad</Label>
                            <Select name="priority" defaultValue="normal">
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona la prioridad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Baja</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="urgent">Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message">Mensaje Inicial</Label>
                            <Textarea
                                id="message"
                                name="message"
                                placeholder="Detalla tu solicitud..."
                                required
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Solicitud
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
