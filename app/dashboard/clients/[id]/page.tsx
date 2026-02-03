import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Edit,
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Receipt,
  Scale,
  Landmark,
  FileText,
  StickyNote,
  Calendar,
  Contact,
  Fingerprint,
  Activity
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

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) {
    notFound()
  }

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser?.id)
    .single()

  const isAdmin = currentProfile?.role === 'admin'

  const [
    { data: fiscalData },
    { data: legalData },
    { data: bankingData },
    { data: accountingData },
    documentCounts,
    { data: notes },
    logs
  ] = await Promise.all([
    supabase.from('fiscal_data').select('*').eq('client_id', id).maybeSingle(),
    supabase.from('legal_data').select('*').eq('client_id', id).maybeSingle(),
    supabase.from('banking_data').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('accounting_data').select('*').eq('client_id', id).maybeSingle(),
    getDocumentCounts(id),
    supabase.from('notes').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    getClientActivityLogs(id, 20), // Fetch 20 recent logs
  ])

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Professional Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{client.commercial_name || client.legal_name}</h1>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide border",
                client.fiscal_status === 'active'
                  ? "bg-emerald-50/50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-400"
                  : "bg-amber-50/50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-400"
              )}>
                {client.fiscal_status === 'active' ? 'ACTIVO' : 'INACTIVO'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                {client.person_type === 'juridica' ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                {client.person_type === 'juridica' ? 'Persona Jurídica' : 'Persona Individual'}
              </span>
              <span className="text-border">|</span>
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">NIT: {client.nit}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/clients/${id}/edit`}>
            <Button variant="outline" size="sm" className="h-8">
              <Edit className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              Editar Perfil
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Profile & Stats */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          {/* Profile Card */}
          <Card className="border-border/60 shadow-sm overflow-hidden bg-card">
            <CardHeader className="p-0">
              <div className="h-24 bg-gradient-to-b from-muted to-background border-b border-border/50"></div>
            </CardHeader>
            <CardContent className="px-6 pb-6 -mt-12 relative">
              <div className="h-24 w-24 rounded-2xl bg-card border-2 border-background shadow-md flex items-center justify-center mb-4">
                {client.person_type === 'juridica' ? (
                  <Building2 className="h-10 w-10 text-primary/80" />
                ) : (
                  <User className="h-10 w-10 text-primary/80" />
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-xl leading-tight">{client.commercial_name || client.legal_name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                    client.fiscal_status === 'active'
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}>
                    {client.fiscal_status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contacto</p>
                  {client.email && (
                    <div className="flex items-center gap-3 py-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${client.email}`} className="text-sm hover:underline truncate text-foreground/90">{client.email}</a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3 py-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground/90">{client.phone}</span>
                    </div>
                  )}
                </div>

                {(client.fiscal_address || client.municipality || client.department) && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ubicación</p>
                    <div className="flex items-start gap-3 py-1">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-foreground/90 leading-snug">
                        {client.fiscal_address}
                        <div className="opacity-70 text-xs mt-0.5">
                          {[client.municipality, client.department].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-5 border-t border-border/50 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">DPI</p>
                    <p className="text-xs font-mono bg-muted/50 px-2 py-1 rounded border border-border/50 inline-block">{client.dpi || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Registro</p>
                    <p className="text-xs font-mono bg-muted/50 px-2 py-1 rounded border border-border/50 inline-block">{new Date(client.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Indicators (Stacked in Sidebar) */}
          <div className="grid grid-cols-1 gap-3">
            <Card className="border shadow-none bg-blue-50/30 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">Expedientes</span>
                </div>
                <span className="text-xl font-bold">{Object.values(documentCounts).reduce((a: any, b: any) => a + b, 0)}</span>
              </CardContent>
            </Card>
            <Card className="border shadow-none bg-amber-50/30 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                    <StickyNote className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">Notas</span>
                </div>
                <span className="text-xl font-bold">{notes?.length || 0}</span>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">

          <Tabs defaultValue="timeline" className="w-full">
            <div className="sticky top-[4.5rem] z-30 bg-background/95 backdrop-blur-sm pb-4 pt-1 border-b mb-6">
              <TabsList className="bg-transparent h-auto w-full justify-start gap-6 p-0">
                {[
                  { value: 'timeline', label: 'Historia', icon: Activity },
                  { value: 'fiscal', label: 'Fiscal', icon: Receipt },
                  { value: 'legal', label: 'Legal', icon: Scale },
                  { value: 'banking', label: 'Banca', icon: Landmark },
                  { value: 'accounting', label: 'Contabilidad', icon: Receipt },
                  { value: 'notes', label: 'Notas', icon: StickyNote },
                  ...(isAdmin ? [{ value: 'admin', label: 'Admin', icon: Fingerprint }] : [])
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <tab.icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="min-h-[400px] animate-in slide-in-from-bottom-2 fade-in duration-500">
              <TabsContent value="timeline" className="mt-0 outline-none">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm min-h-[750px]">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-1">Actividad Reciente</h3>
                    <p className="text-sm text-muted-foreground mb-6">Registro cronológico de movimientos y cambios.</p>
                    <ClientTimeline logs={logs as any[]} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fiscal" className="mt-0 outline-none">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm min-h-[750px] p-6">
                  <FiscalDataForm clientId={id} fiscalData={fiscalData} />
                </div>
              </TabsContent>

              <TabsContent value="legal" className="mt-0 outline-none">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm min-h-[750px] p-6">
                  <LegalDataForm clientId={id} legalData={legalData} />
                </div>
              </TabsContent>

              <TabsContent value="banking" className="mt-0 outline-none">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm min-h-[750px] p-6">
                  <BankingDataSection clientId={id} bankingData={bankingData || []} />
                </div>
              </TabsContent>

              <TabsContent value="accounting" className="mt-0 outline-none">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm min-h-[750px] p-6">
                  <AccountingDataForm clientId={id} accountingData={accountingData} />
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0 outline-none">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm min-h-[750px] p-6">
                  <NotesSection clientId={id} notes={notes || []} />
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin" className="mt-0 outline-none">
                  <div className="rounded-xl border bg-card text-card-foreground shadow-sm min-h-[750px] p-6">
                    <ClientAdminTools
                      clientId={client.id}
                      clientEmail={client.email || ''}
                      clientNit={client.nit}
                      userId={client.user_id || null}
                    />
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>

        </div>
      </div>

      {/* Documents Section - Full Width of Content */}
      <div className="pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <div className="flex items-center justify-between gap-4 mb-6 pt-6 border-t">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Gestión Documental</h2>
            <p className="text-sm text-muted-foreground">Repositorio centralizado de expedientes y archivos fiscales.</p>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm bg-card/50">
          <CardContent className="p-0">
            <DocumentsSection clientId={id} initialCounts={documentCounts} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
