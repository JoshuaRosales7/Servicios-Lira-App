import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ClientForm } from '@/components/dashboard/client-form'
import { ArrowLeft, Edit, Building2, User, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  const infoItems = [
    client.email && { icon: Mail, value: client.email },
    client.phone && { icon: Phone, value: client.phone },
    (client.municipality || client.department) && { icon: MapPin, value: [client.municipality, client.department].filter(Boolean).join(', ') },
  ].filter(Boolean) as { icon: any; value: string }[]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/clients/${id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
            <Edit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Editar Cliente</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              {client.commercial_name || client.legal_name}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/clients/${id}`}>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">Ver Perfil</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar — Client Summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="h-16 bg-slate-100 dark:bg-slate-800 relative">
              <div className="absolute -bottom-6 left-4">
                <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-900 shadow flex items-center justify-center">
                  {client.person_type === 'juridica' ? (
                    <Building2 className="h-5 w-5 text-slate-400" />
                  ) : (
                    <User className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>
            </div>
            <div className="px-4 pt-10 pb-4 space-y-3">
              <div>
                <p className="font-medium text-sm text-slate-900 dark:text-white">{client.commercial_name || client.legal_name}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">NIT: {client.nit}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md font-semibold",
                  client.fiscal_status === 'active'
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                )}>
                  {client.fiscal_status === 'active' ? 'Activo' : client.fiscal_status === 'suspended' ? 'Suspendido' : 'Inactivo'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium capitalize">
                  {client.person_type === 'juridica' ? 'Jurídica' : 'Individual'}
                </span>
              </div>

              {infoItems.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {infoItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <item.icon className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span>Registrado {new Date(client.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-100 dark:border-blue-900 p-4">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">Nota</p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
              Los cambios se aplican de inmediato al guardar. Todos los campos marcados con * son obligatorios.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            <ClientForm client={client} />
          </div>
        </div>
      </div>
    </div>
  )
}
