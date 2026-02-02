'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'

export function ClientSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [term, setTerm] = useState(searchParams.get('search') || '')

    // Simple debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (term) {
                params.set('search', term)
            } else {
                params.delete('search')
            }
            router.push(`/dashboard/clients?${params.toString()}`)
        }, 500)

        return () => clearTimeout(timer)
    }, [term, router, searchParams])

    return (
        <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Buscar clientes..."
                className="pl-9 h-9"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
            />
        </div>
    )
}
