import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Edit, ArrowLeft, Building2, User, Mail, Phone, MapPin, Receipt, Scale, Landmark,
  FileText, StickyNote, Calendar, Fingerprint, Activity
} from 'lucide-react'
import { FiscalDataForm } from '@/components/dashboard/fiscal-data-form'
import { LegalDataForm } from '@/components/dashboard/legal-data-form'
import { BankingDataSection } from '@/components/dashboard/banking-data-section'
import { AccountingDataForm } from '@/components/dashboard/accounting-data-form'
import { DocumentsSection } from '@/components/dashboard/documents-section'
import { NotesSection } from '@/components/dashboard/notes-section'
import { ClientAdminTools } from '@/components/dashboard/client-admin-tools'
import { getDocumentCounts } from '@/app/actions/documents'
import { getClientActivityLogs } from '@/app/actions/system'
import { ClientTimeline } from '@/components/dashboard/client-timeline'
import { cn } from '@/lib/utils'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', currentUser?.id).single()
  const isAdmin = currentProfile?.role === 'admin'

  const [
    { data: fiscalData }, { data: legalData }, { data: bankingData },
    { data: accountingData }, documentCounts, { data: notes }, logs
  ] = await Promise.all([
    supabase.from('fiscal_data').select('*').eq('client_id', id).maybeSingle(),
    supabase.from('legal_data').select('*').eq('client_id', id).maybeSingle(),
    supabase.from('banking_data').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('accounting_data').select('*').eq('client_id', id).maybeSingle(),
    getDocumentCounts(id),
    supabase.from('notes').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    getClientActivityLogs(id, 20),
  ])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{client.commercial_name || client.legal_name}</h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                {client.person_type === 'juridica' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {client.person_type === 'juridica' ? 'Jurídica' : 'Individual'}
              </span>
              <span>·</span>
              <span className="font-mono">NIT: {client.nit}</span>
            </div>
          </div>
        </div>
        {isAdmin && (
          <Link href={`/dashboard/clients/${id}/edit`}>
            <Button size="sm" className="h-8 rounded-lg text-xs"><Edit className="h-3.5 w-3.5 mr-1.5" />Editar</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="h-20 bg-slate-100 dark:bg-slate-800 relative">
              <div className="absolute -bottom-8 left-5">
                <div className="h-16 w-16 rounded-xl bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-900 shadow flex items-center justify-center">
                  {client.person_type === 'juridica' ? (
                    <Building2 className="h-7 w-7 text-slate-400" />
                  ) : (
                    <User className="h-7 w-7 text-slate-400" />
                  )}
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md font-semibold",
                  client.fiscal_status === 'active'
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                )}>
                  {client.fiscal_status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="px-5 pt-12 pb-5 space-y-4">
              <div className="space-y-2.5">
                {client.email && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${client.email}`} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 truncate">{client.email}</a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">{client.phone}</span>
                  </div>
                )}
                {(client.municipality || client.department) && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">{[client.municipality, client.department].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">DPI</p>
                  <p className="font-mono text-xs text-slate-700 dark:text-slate-300">{client.dpi || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Registrado</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {new Date(client.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <FileText className="h-4 w-4 text-blue-500 mb-2" />
              <p className="text-xl font-bold text-slate-900 dark:text-white">{Object.values(documentCounts).reduce((a: any, b: any) => a + b, 0)}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Archivos</p>
            </div>
            <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <StickyNote className="h-4 w-4 text-amber-500 mb-2" />
              <p className="text-xl font-bold text-slate-900 dark:text-white">{notes?.length || 0}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Notas</p>
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <Activity className="h-4 w-4 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-900 dark:text-white">{logs?.length || 0} eventos</p>
              <p className="text-[10px] text-slate-500">registrados</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <Tabs defaultValue="timeline" className="w-full">
              <div className="border-b border-slate-100 dark:border-slate-800 px-6 overflow-x-auto bg-slate-50/50 dark:bg-slate-900/20">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 p-0">
                  {[
                    { value: 'timeline', label: 'Historia', icon: Activity, always: true },
                    { value: 'notes', label: 'Notas', icon: StickyNote, always: true },
                    { value: 'fiscal', label: 'Fiscal', icon: Receipt, adminOnly: true },
                    { value: 'legal', label: 'Legal', icon: Scale, adminOnly: true },
                    { value: 'banking', label: 'Banca', icon: Landmark, adminOnly: true },
                    { value: 'accounting', label: 'Contabilidad', icon: Receipt, adminOnly: true },
                    { value: 'admin', label: 'Admin', icon: Fingerprint, adminOnly: true }
                  ].map((tab) => {
                    const isAvailable = tab.always || (tab.adminOnly && isAdmin)
                    return (
                      <TabsTrigger key={tab.value} value={tab.value} disabled={!isAvailable}
                        className={cn(
                          "h-12 rounded-none border-b-2 border-transparent bg-transparent px-0 text-sm font-medium text-slate-500 shadow-none data-[state=active]:border-blue-600 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white whitespace-nowrap",
                          !isAvailable && "opacity-40 cursor-not-allowed"
                        )}>
                        <div className="flex items-center gap-1.5">
                          <tab.icon className="h-3.5 w-3.5" />
                          <span>{tab.label}</span>
                        </div>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              <div className="p-6 h-[600px] overflow-y-auto">
                <TabsContent value="timeline" className="mt-0 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Actividad Reciente</h3>
                    <p className="text-xs text-slate-500">Registro cronológico de movimientos.</p>
                  </div>
                  <ClientTimeline logs={logs as any[]} />
                </TabsContent>

                <TabsContent value="notes" className="mt-0 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Notas Internas</h3>
                    <p className="text-xs text-slate-500">Observaciones y seguimiento.</p>
                  </div>
                  <NotesSection clientId={id} notes={notes || []} />
                </TabsContent>

                {isAdmin && (
                  <>
                    <TabsContent value="fiscal" className="mt-0 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Información Fiscal</h3>
                        <p className="text-xs text-slate-500">Datos SAT y obligaciones tributarias.</p>
                      </div>
                      <FiscalDataForm clientId={id} fiscalData={fiscalData} />
                    </TabsContent>

                    <TabsContent value="legal" className="mt-0 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Información Legal</h3>
                        <p className="text-xs text-slate-500">Constitución y representaciones legales.</p>
                      </div>
                      <LegalDataForm clientId={id} legalData={legalData} />
                    </TabsContent>

                    <TabsContent value="banking" className="mt-0 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Información Bancaria</h3>
                        <p className="text-xs text-slate-500">Cuentas e integraciones financieras.</p>
                      </div>
                      <BankingDataSection clientId={id} bankingData={bankingData || []} />
                    </TabsContent>

                    <TabsContent value="accounting" className="mt-0 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Información Contable</h3>
                        <p className="text-xs text-slate-500">Sistemas de costeo y plataformas contables.</p>
                      </div>
                      <AccountingDataForm clientId={id} accountingData={accountingData} />
                    </TabsContent>

                    <TabsContent value="admin" className="mt-0 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Administración</h3>
                        <p className="text-xs text-slate-500">Usuario, facturación y configuración.</p>
                      </div>
                      <ClientAdminTools clientId={client.id} clientEmail={client.email || ''} clientNit={client.nit} userId={client.user_id || null} />
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </div>

        </div>
      </div>

      {/* Documents — full width below */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/20">
          <FileText className="h-4 w-4 text-slate-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Expediente Central</h3>
            <p className="text-xs text-slate-500 mt-0.5">Archivos y documentos oficiales del cliente</p>
          </div>
        </div>
        <div className="p-6">
          <DocumentsSection clientId={id} initialCounts={documentCounts} />
        </div>
      </div>
    </div>
  )
}
