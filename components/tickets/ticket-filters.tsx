'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { useState, FormEvent, useEffect } from 'react'

export function TicketFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // State to handle local inputs before pushing to URL
    const [search, setSearch] = useState(searchParams.get('q') || '')

    // We update URL for selects immediately
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    // Effect to sync state if URL changes elsewhere (e.g. back button)
    useEffect(() => {
        setSearch(searchParams.get('q') || '')
    }, [searchParams])

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        applyFilters({ q: search })
    }

    const applyFilters = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())

        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null || value === 'all' || value === '') {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })

        router.push(`/dashboard/tickets?${params.toString()}`)
    }

    const clearFilters = () => {
        setSearch('')
        router.push('/dashboard/tickets')
    }

    const hasFilters = !!(status || priority || searchParams.get('q'))

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-card p-3 rounded-lg border shadow-sm">
            <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por asunto..."
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </form>

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <Select value={status || 'all'} onValueChange={(v) => applyFilters({ status: v })}>
                    <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="open">Abierto</SelectItem>
                        <SelectItem value="in_progress">En Proceso</SelectItem>
                        <SelectItem value="resolved">Resuelto</SelectItem>
                        <SelectItem value="closed">Cerrado</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={priority || 'all'} onValueChange={(v) => applyFilters({ priority: v })}>
                    <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                </Select>

                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-9 px-2 text-muted-foreground hover:text-destructive"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Limpiar
                    </Button>
                )}
            </div>
        </div>
    )
}
