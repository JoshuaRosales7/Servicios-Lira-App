'use client'

import React from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, X, Loader2, Filter } from 'lucide-react'

export function FiscalSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const [search, setSearch] = useState(searchParams.get('search') || '')
    const regime = searchParams.get('regime') || 'all'
    const frequency = searchParams.get('frequency') || 'all'

    const updateParams = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== 'all') {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        startTransition(() => {
            router.push(`/dashboard/fiscal?${params.toString()}`)
        })
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        updateParams('search', search)
    }

    const clearFilters = () => {
        setSearch('')
        startTransition(() => {
            router.push('/dashboard/fiscal')
        })
    }

    const hasFilters = search || regime !== 'all' || frequency !== 'all'

    return (
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-muted/30 p-4 rounded-xl border mb-6">
            <div className="flex items-center gap-2 lg:hidden mb-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Filtros</span>
            </div>

            <form onSubmit={handleSearch} className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {isPending ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                        <Search className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
                <Input
                    placeholder="Buscar contribuyente o NIT..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 bg-background border-border rounded-lg text-sm transition-all"
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearch('')
                            updateParams('search', '')
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </form>

            <div className="flex flex-wrap items-center gap-3">
                <Select value={regime} onValueChange={(value) => updateParams('regime', value)}>
                    <SelectTrigger className="w-[180px] h-10 rounded-lg text-xs font-semibold bg-background">
                        <SelectValue placeholder="Régimen" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="text-xs">Todos</SelectItem>
                        <SelectItem value="Pequeño Contribuyente" className="text-xs">Pequeño Contribuyente</SelectItem>
                        <SelectItem value="General" className="text-xs">General (IVA)</SelectItem>
                        <SelectItem value="Opcional Simplificado" className="text-xs">Opcional Simplificado</SelectItem>
                        <SelectItem value="Sobre Utilidades" className="text-xs">Sobre Utilidades</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={frequency} onValueChange={(value) => updateParams('frequency', value)}>
                    <SelectTrigger className="w-[140px] h-10 rounded-lg text-xs font-semibold bg-background">
                        <SelectValue placeholder="Frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="text-xs">Todas</SelectItem>
                        <SelectItem value="monthly" className="text-xs">Mensual</SelectItem>
                        <SelectItem value="quarterly" className="text-xs">Trimestral</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleSearch}
                        className="h-10 px-6 rounded-lg font-bold text-xs uppercase tracking-tight"
                    >
                        Buscar
                    </Button>
                    {(hasFilters) && (
                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            size="sm"
                            className="h-10 px-4 rounded-lg font-bold text-xs uppercase tracking-tight text-muted-foreground"
                        >
                            Limpiar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
