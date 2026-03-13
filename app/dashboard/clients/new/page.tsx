import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientForm } from '@/components/dashboard/client-form'
import { ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NewClientPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg hidden sm:block">
          <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Nuevo Cliente</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Crea un nuevo perfil de cliente</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <ClientForm />
      </div>
    </div>
  )
}
