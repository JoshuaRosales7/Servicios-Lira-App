'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Sparkles,
    Send,
    Bot,
    User,
    Loader2,
    AlertCircle,
    CheckCircle2,
    FileText,
    ArrowRight
} from "lucide-react"
import { processNaturalLanguageQuery, AISearchResult } from '@/app/actions/ai-search'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface NeuroSearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface Message {
    role: 'user' | 'assistant'
    content: string
    result?: AISearchResult
}

export function NeuroSearchDialog({ open, onOpenChange }: NeuroSearchDialogProps) {
    const [query, setQuery] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hola. Soy tu asistente de datos. Pregúntame algo como "Muestra los clientes sin IVA de enero" o "Clientes nuevos".'
        }
    ])
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!query.trim()) return

        // Add User Message
        const userMsg = { role: 'user' as const, content: query }
        setMessages(prev => [...prev, userMsg])
        const currentQuery = query
        setQuery('')
        setLoading(true)

        try {
            // Call Server Action
            const result = await processNaturalLanguageQuery(currentQuery)

            // Add AI Response
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.message,
                result: result
            }])
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Lo siento, tuve un problema procesando eso.'
            }])
        } finally {
            setLoading(false)
        }
    }

    // Render helper for results
    const renderResult = (result: AISearchResult) => {
        if (result.type === 'client_list') {
            const clients = result.data
            if (!clients || clients.length === 0) return null

            return (
                <div className="mt-3 space-y-2">
                    {clients.map((client: any) => (
                        <Link
                            key={client.id}
                            href={`/dashboard/clients/${client.id}`}
                            onClick={() => onOpenChange(false)}
                            className="block"
                        >
                            <div className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs">
                                        {(client.commercial_name || client.legal_name || 'C')[0]}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium group-hover:text-primary transition-colors">
                                            {client.commercial_name || client.legal_name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            NIT: {client.nit}
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                            </div>
                        </Link>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[650px] flex flex-col gap-0 p-0 overflow-hidden bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl transition-all duration-300">
                <DialogHeader className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                    <DialogTitle className="flex items-center gap-2 text-primary font-bold tracking-tight">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <Sparkles className="h-4 w-4 fill-primary/20 text-primary" />
                        </div>
                        Asistente Lira IA
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground/80 font-medium">
                        Potenciado por Lira-Intelligence v1.0
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-transparent to-muted/5">
                    <div className="space-y-6">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex gap-3",
                                    msg.role === 'user' ? "flex-row-reverse" : ""
                                )}
                            >
                                <div
                                    className={cn(
                                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground border-primary/50"
                                            : "bg-background text-foreground border-border/50"
                                    )}
                                >
                                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-indigo-500" />}
                                </div>

                                <div className={cn(
                                    "space-y-2 max-w-[85%]",
                                    msg.role === 'user' ? "items-end" : "items-start"
                                )}>
                                    <div
                                        className={cn(
                                            "rounded-2xl px-5 py-3 text-sm shadow-sm whitespace-pre-wrap leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm"
                                                : "bg-card border border-border/40 text-foreground rounded-tl-sm shadow-sm"
                                        )}
                                    >
                                        {msg.content.split(/(\*\*.*?\*\*)/).map((part, index) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                // Adjust color for user bubbles vs assistant bubbles? 
                                                // Actually, user bubbles are dark/primary, usually white text. Assistant is card color.
                                                // Let's rely on specific inheritance or force class only if assistant.
                                                // Ideally, bold is just bold.
                                                return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>
                                            }
                                            return part
                                        })}
                                    </div>

                                    {/* Render Result Content if available */}
                                    {msg.result && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 w-full pl-1">
                                            {renderResult(msg.result)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-3 animate-pulse">
                                <div className="h-8 w-8 rounded-xl bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
                                    <Bot className="h-4 w-4 text-indigo-500" />
                                </div>
                                <div className="bg-card border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1 shadow-sm h-[46px]">
                                    <div className="w-2 h-2 bg-indigo-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-indigo-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-indigo-500/50 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 bg-background/80 backdrop-blur-sm border-t border-border/40">
                    <form onSubmit={handleSubmit} className="flex gap-2 relative">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Pregunta sobre impuestos, clientes o documentos..."
                            className="flex-1 pl-4 pr-12 h-11 rounded-xl border-border/50 bg-muted/20 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-indigo-500 transition-all shadow-sm"
                            autoFocus
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!query.trim() || loading}
                            className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                        >
                            <Send className="h-3.5 w-3.5" />
                        </Button>
                    </form>
                    <div className="mt-2 text-[10px] text-center text-muted-foreground/60">
                        La IA puede cometer errores. Verifica la información importante.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
