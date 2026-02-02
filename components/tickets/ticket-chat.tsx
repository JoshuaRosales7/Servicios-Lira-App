'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Paperclip, Send, Loader2, FileIcon, Download, Check, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Attachment {
    name: string
    url: string
    type: string
    size: number
}

interface Message {
    id: string
    user_id: string
    message: string
    attachments: Attachment[] | null
    created_at: string
    read: boolean
    is_internal?: boolean
}

interface TicketChatProps {
    ticketId: string
    initialMessages: Message[]
    currentUserId: string
    isAdmin?: boolean
}

export function TicketChat({ ticketId, initialMessages, currentUserId, isAdmin = false }: TicketChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [isInternal, setIsInternal] = useState(false)

    // We assume if one can see the page they have permissions.
    // Ideally we pass isAdmin as prop to show/hide internal controls.
    // For now we will show them (assuming client might use this component too but we can't easily detect role client-side without prop or context).
    // Let's assume this component is used in a context where we want these features available if the user is admin.
    // But wait, clients shouldn't see "Internal Note" button.
    // I will add a simple check: if the user can toggle 'isInternal', they are admin.
    // Actually, I'll just clear the state if not used. 
    // To make it robust, we should pass `isAdmin`. I'll update the component signature later. 
    // For now, I'll render the controls. If a client tries to send internal, RLS or backend should probably block or ignore, 
    // but the UI will show it. Let's rely on the user being admin to use it for now (since we are creating "professional functions").

    const supabase = createClient()
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        // Scroll to bottom on load and new messages
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    useEffect(() => {
        const channel = supabase
            .channel('ticket_messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'ticket_messages',
                filter: `ticket_id=eq.${ticketId}`
            }, (payload) => {
                const newMsg = payload.new as Message
                setMessages((prev) => [...prev, newMsg])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [ticketId, supabase])

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim() && !uploading) return

        setSending(true)
        try {
            const { error } = await supabase
                .from('ticket_messages')
                .insert({
                    ticket_id: ticketId,
                    user_id: currentUserId,
                    message: newMessage.trim(),
                    is_internal: isInternal,
                    attachments: []
                })

            if (error) throw error

            // Only update ticket last update if external
            if (!isInternal) {
                await supabase.from('tickets').update({ last_message_at: new Date().toISOString() }).eq('id', ticketId)
            }

            setNewMessage('')
            setIsInternal(false)
        } catch (error) {
            console.error(error)
            toast.error('Error al enviar mensaje')
        } finally {
            setSending(false)
        }
    }

    const insertCanned = (text: string) => {
        setNewMessage(text)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${ticketId}/${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // Assuming 'documents' bucket exists and is public or accessible
            // If not, we might need a specific bucket for tickets
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath)

            const attachment: Attachment = {
                name: file.name,
                url: publicUrl,
                type: file.type,
                size: file.size
            }

            // Send message with attachment
            const { error: msgError } = await supabase
                .from('ticket_messages')
                .insert({
                    ticket_id: ticketId,
                    user_id: currentUserId,
                    message: `Adjuntó un archivo: ${file.name}`,
                    attachments: [attachment]
                })

            if (msgError) throw msgError

            // Update ticket
            await supabase.from('tickets').update({ last_message_at: new Date().toISOString() }).eq('id', ticketId)

            toast.success('Archivo enviado')
        } catch (error) {
            console.error(error)
            toast.error('Error al subir archivo. Verifique permisos o tamaño.')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="flex flex-col h-[600px] border rounded-xl overflow-hidden bg-background shadow-sm">
            <div className="flex-1 p-4 overflow-y-auto bg-muted/30" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.user_id === currentUserId
                        const isInternalMsg = msg.is_internal

                        // If internal and not me (and I am client), I shouldn't see it (handled by RLS hopefully, but UI wise)
                        // Actually RLS should prevent fetching it.

                        return (
                            <div key={msg.id} className={cn("flex gap-3", isMe ? "justify-end" : "justify-start")}>
                                {!isMe && (
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">U</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl p-3 text-sm shadow-sm relative group",
                                    isMe
                                        ? (isInternalMsg ? "bg-amber-100 text-amber-900 border-amber-200 border" : "bg-primary text-primary-foreground rounded-br-none")
                                        : (isInternalMsg ? "bg-amber-100 text-amber-900 border-amber-200 border" : "bg-card border rounded-bl-none")
                                )}>
                                    {isInternalMsg && (
                                        <div className="absolute -top-2.5 left-2 bg-amber-200 text-amber-800 text-[9px] px-1.5 rounded-full font-bold uppercase tracking-wider">
                                            Nota Interna
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>

                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {msg.attachments.map((att, idx) => (
                                                <a
                                                    key={idx}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={cn(
                                                        "flex items-center gap-2 p-2 rounded-md transition-colors",
                                                        isMe ? "bg-white/10 hover:bg-white/20" : "bg-muted hover:bg-muted/80"
                                                    )}
                                                >
                                                    <FileIcon className="h-4 w-4" />
                                                    <span className="truncate max-w-[150px] text-xs font-medium">{att.name}</span>
                                                    <Download className="h-3 w-3 opacity-50" />
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    <div className={cn(
                                        "flex items-center justify-end gap-1 mt-1.5 text-[10px]",
                                        isMe && !isInternalMsg ? "text-primary-foreground/70" : "text-muted-foreground"
                                    )}>
                                        <span>{format(new Date(msg.created_at), 'hh:mm a', { locale: es })}</span>
                                        {isMe && (
                                            msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="p-4 bg-background border-t space-y-3">
                {isAdmin && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <button
                            type="button"
                            onClick={() => setIsInternal(!isInternal)}
                            className={cn(
                                "text-xs px-2 py-1 rounded border transition-colors flex items-center gap-1 whitespace-nowrap",
                                isInternal ? "bg-amber-100 text-amber-700 border-amber-300" : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <LockIcon className="h-3 w-3" />
                            Nota Interna
                        </button>

                        <div className="h-4 w-px bg-border mx-1" />

                        <button type="button" onClick={() => insertCanned("Hola, hemos recibido tu solicitud y la estamos revisando.")} className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground whitespace-nowrap">
                            Saludo Inicial
                        </button>
                        <button type="button" onClick={() => insertCanned("¿Podrías enviarnos el comprobante adjunto?")} className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground whitespace-nowrap">
                            Pedir Comprobante
                        </button>
                        <button type="button" onClick={() => insertCanned("Tu solicitud ha sido resuelta. ¿Necesitas algo más?")} className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground whitespace-nowrap">
                            Cierre
                        </button>
                    </div>
                )}

                <form onSubmit={handleSendMessage} className={cn("flex gap-2 items-end p-2 rounded-md transition-colors", isInternal ? "bg-amber-50" : "")}>
                    <div className="relative">
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-10 w-10 text-muted-foreground hover:text-foreground"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            <Paperclip className="h-5 w-5" />
                        </Button>
                    </div>

                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isInternal ? "Escribe una nota interna (solo visible para admin)..." : "Escribe un mensaje..."}
                        className={cn("min-h-[44px] max-h-[120px] resize-none py-3 border-0 focus-visible:ring-0 shadow-none bg-transparent", isInternal && "placeholder:text-amber-700/50")}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendMessage()
                            }
                        }}
                    />

                    <Button
                        type="submit"
                        size="icon"
                        className={cn("h-10 w-10 transition-all", isInternal ? "bg-amber-500 hover:bg-amber-600 text-white" : "")}
                        disabled={(!newMessage.trim() && !uploading) || sending}
                    >
                        {sending || uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}

function LockIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}
