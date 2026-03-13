'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function ClientSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [term, setTerm] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [type, setType] = useState(searchParams.get('type') || 'all')

  // Simple debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (term) {
        params.set('search', term)
      } else {
        params.delete('search')
      }
      if (status && status !== 'all') {
        params.set('status', status)
      } else {
        params.delete('status')
      }
      if (type && type !== 'all') {
        params.set('type', type)
      } else {
        params.delete('type')
      }
      router.push(`/dashboard/clients?${params.toString()}`)
    }, 500)

    return () => clearTimeout(timer)
  }, [term, status, type, router, searchParams])

  const hasFilters = term || (status && status !== 'all') || (type && type !== 'all')

  const clearFilters = () => {
    setTerm('')
    setStatus('all')
    setType('all')
    router.push('/dashboard/clients')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, NIT, email..."
          className="pl-10 h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full sm:w-44 h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <SelectValue placeholder="Estado fiscal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="active">Activo</SelectItem>
          <SelectItem value="inactive">Inactivo</SelectItem>
          <SelectItem value="suspended">Suspendido</SelectItem>
        </SelectContent>
      </Select>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-full sm:w-44 h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <SelectValue placeholder="Tipo de persona" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="individual">Individual</SelectItem>
          <SelectItem value="juridica">Jurídica</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="h-11 px-4 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4 mr-2" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
