'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUpDown } from 'lucide-react'

interface ClientSortProps {
  defaultValue?: string
}

export function ClientSort({ defaultValue = 'created_at' }: ClientSortProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    router.push(`/dashboard/clients?${params.toString()}`)
  }

  return (
    <Select value={defaultValue} onValueChange={handleSortChange}>
      <SelectTrigger className="w-48 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 hover:shadow-sm">
        <ArrowUpDown className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
        <SelectValue placeholder="Ordenar por..." />
      </SelectTrigger>
      <SelectContent className="w-48 p-1">
        <SelectItem value="created_at" className="rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">📅</span>
            Más recientes
          </div>
        </SelectItem>
        <SelectItem value="-created_at" className="rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">📅</span>
            Más antiguos
          </div>
        </SelectItem>
        <SelectItem value="legal_name" className="rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">🔤</span>
            Nombre A-Z
          </div>
        </SelectItem>
        <SelectItem value="-legal_name" className="rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">🔤</span>
            Nombre Z-A
          </div>
        </SelectItem>
        <SelectItem value="commercial_name" className="rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">🏢</span>
            Comercial A-Z
          </div>
        </SelectItem>
        <SelectItem value="-commercial_name" className="rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">🏢</span>
            Comercial Z-A
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}