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

// If useDebounce doesn't exist, I'll use a local timeout.
// I will assume standard shadcn approach or write a simple effect.

const ACTIONS = [
    { value: 'all', label: 'Todas las acciones' },
    { value: 'CREATE_CLIENT', label: 'Cliente Creado' },
    { value: 'REVOKE_ACCESS', label: 'Acceso Revocado' },
    { value: 'RESET_PASSWORD_REQUEST', label: 'Solicitud Reset Pass' },
    { value: 'UPDATE_FISCAL_DATA', label: 'Datos Fiscales Editados' },
    { value: 'CREATE_FISCAL_DATA', label: 'Datos Fiscales Creados' },
    { value: 'UPDATE_LEGAL_DATA', label: 'Datos Legales Editados' },
    { value: 'CREATE_LEGAL_DATA', label: 'Datos Legales Creados' },
    { value: 'UPDATE_ACCOUNTING_DATA', label: 'Contabilidad Editada' },
    { value: 'CREATE_ACCOUNTING_DATA', label: 'Contabilidad Creada' },
    { value: 'ADD_BANK_ACCOUNT', label: 'Cuenta Bancaria Agregada' },
    { value: 'UPDATE_BANK_ACCOUNT', label: 'Cuenta Bancaria Editada' },
    { value: 'DELETE_BANK_ACCOUNT', label: 'Cuenta Bancaria Eliminada' },
    { value: 'CREATE_NOTE', label: 'Nota Creada' },
    { value: 'UPDATE_NOTE', label: 'Nota Editada' },
    { value: 'DELETE_NOTE', label: 'Nota Eliminada' },
    { value: 'UPLOAD_DOCUMENT', label: 'Documento Subido' },
    { value: 'DELETE_DOCUMENT', label: 'Documento Eliminado' },
    { value: 'RENAME_DOCUMENT', label: 'Documento Renombrado' },
    { value: 'CREATE_FOLDER', label: 'Carpeta Creada' },
    { value: 'MOVE_DOCUMENT', label: 'Documento Movido' },
]

const RESOURCES = [
    { value: 'all', label: 'Todos los recursos' },
    { value: 'client', label: 'Cliente' },
    { value: 'document', label: 'Documento' },
    { value: 'fiscal_data', label: 'Datos Fiscales' },
    { value: 'legal_data', label: 'Datos Legales' },
    { value: 'accounting_data', label: 'Contabilidad' },
    { value: 'banking_data', label: 'Datos Bancarios' },
    { value: 'note', label: 'Nota' },
]

export function ActivityFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [action, setAction] = useState(searchParams.get('action') || 'all')
    const [resource, setResource] = useState(searchParams.get('resourceType') || 'all')

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
            if (updates[key] && updates[key] !== 'all') {
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
        setAction('all')
        setResource('all')
        router.push('?')
    }

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-4 bg-card rounded-lg border p-4 shadow-sm mb-6">
            <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar en detalles..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Select
                    value={action}
                    onValueChange={(val) => {
                        setAction(val)
                        updateFilters({ action: val })
                    }}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Acción" />
                    </SelectTrigger>
                    <SelectContent>
                        {ACTIONS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={resource}
                    onValueChange={(val) => {
                        setResource(val)
                        updateFilters({ resourceType: val })
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Recurso" />
                    </SelectTrigger>
                    <SelectContent>
                        {RESOURCES.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(search || action !== 'all' || resource !== 'all') && (
                    <Button variant="ghost" size="icon" onClick={handleReset} title="Limpiar filtros">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
