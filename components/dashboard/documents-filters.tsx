'use client'

import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect } from "react"

const DOCUMENT_TYPES = [
    { value: 'all', label: 'Todos los tipos' },
    { value: 'fiscal', label: 'Fiscal' },
    { value: 'legal', label: 'Legal' },
    { value: 'accounting', label: 'Contabilidad' },
    { value: 'banking', label: 'Banca' },
    { value: 'other', label: 'Otros' },
]

const SORT_OPTIONS = [
    { value: 'recent', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'az', label: 'Nombre (A-Z)' },
    { value: 'za', label: 'Nombre (Z-A)' },
    { value: 'size_desc', label: 'Tamaño (Mayor)' },
    { value: 'size_asc', label: 'Tamaño (Menor)' },
]

export function DocumentFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [type, setType] = useState(searchParams.get('type') || 'all')
    const [sort, setSort] = useState(searchParams.get('sort') || 'recent')

    // Debounce search update
    useEffect(() => {
        const timer = setTimeout(() => {
            updateFilters({ search })
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const updateFilters = useCallback((updates: any) => {
        const params = new URLSearchParams(searchParams.toString())

        Object.keys(updates).forEach(key => {
            if (updates[key] && updates[key] !== 'all' && updates[key] !== 'recent') {
                params.set(key, updates[key])
            } else {
                params.delete(key)
            }
        })

        // Reset page on filter change
        if (updates.page === undefined) {
            params.set('page', '1')
        }

        router.push(`?${params.toString()}`)
    }, [searchParams, router])

    const handleReset = () => {
        setSearch('')
        setType('all')
        setSort('recent')
        router.push('?')
    }

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-4 bg-card rounded-lg border p-4 shadow-sm mb-6">
            <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar documentos..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Select
                    value={sort}
                    onValueChange={(val) => {
                        setSort(val)
                        updateFilters({ sort: val })
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Orden" />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={type}
                    onValueChange={(val) => {
                        setType(val)
                        updateFilters({ type: val })
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        {DOCUMENT_TYPES.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(search || type !== 'all' || sort !== 'recent') && (
                    <Button variant="ghost" size="icon" onClick={handleReset} title="Limpiar filtros">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
