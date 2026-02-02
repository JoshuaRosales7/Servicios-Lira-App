import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientForm } from '@/components/dashboard/client-form'

export default async function NewClientPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Añadir Nuevo Cliente</h1>
        <p className="text-muted-foreground mt-1">
          Crea un nuevo perfil de cliente con su información básica
        </p>
      </div>
      <ClientForm />
    </div>
  )
}
