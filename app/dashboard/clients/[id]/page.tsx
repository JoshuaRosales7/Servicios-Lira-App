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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{client.commercial_name || client.legal_name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                {client.person_type === 'juridica' ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                {client.person_type === 'juridica' ? 'Jurídica' : 'Individual'}
              </span>
              <span>•</span>
              <span className="font-mono">NIT: {client.nit}</span>
              <span className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-xs font-medium",
                client.fiscal_status === 'active'
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              )}>
                {client.fiscal_status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/clients/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Summary Stats Bar - Full Width Top */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Expedientes', value: Object.values(documentCounts).reduce((a: any, b: any) => a + b, 0), icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: 'Notas', value: notes?.length || 0, icon: StickyNote, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: 'Cuentas', value: bankingData?.length || 0, icon: Landmark, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: 'Estado Fiscal', value: fiscalData ? 'Completo' : 'Pendiente', icon: Receipt, color: fiscalData ? "text-indigo-500" : "text-slate-400", bg: fiscalData ? "bg-indigo-500/10" : "bg-slate-100 dark:bg-slate-800" },
          ].map((item, i) => (
            <Card key={i} className="border shadow-none bg-card hover:bg-accent/20 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div>
                  <div className="text-xl font-bold leading-none">{item.value}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">{item.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Profile Sidebar Info - Sticky */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
            <Card className="border shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900" />
              <CardHeader className="-mt-12 relative flex pb-2">
                <div className="h-20 w-20 rounded-2xl bg-background shadow-sm border-2 border-background flex items-center justify-center overflow-hidden">
                  {client.person_type === 'juridica' ? (
                    <Building2 className="h-10 w-10 text-muted-foreground/50" />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground/50" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div>
                  <h3 className="font-bold text-lg">{client.commercial_name || client.legal_name}</h3>
                  <p className="text-sm text-muted-foreground">{client.person_type === 'juridica' ? 'Persona Jurídica' : 'Persona Individual'}</p>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  {client.email && (
                    <div className="flex items-center gap-3 group">
                      <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <a href={`mailto:${client.email}`} className="text-sm font-medium hover:underline truncate">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3 group">
                      <div className="h-8 w-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                        <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-sm font-medium">{client.phone}</div>
                    </div>
                  )}
                  {(client.fiscal_address || client.municipality || client.department) && (
                    <div className="flex items-start gap-3 group">
                      <div className="h-8 w-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors mt-0.5">
                        <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="text-sm text-muted-foreground leading-snug">
                        {client.fiscal_address}
                        <div className="mt-0.5 text-xs opacity-80">
                          {[client.municipality, client.department].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">DPI</p>
                    <p className="text-xs font-mono font-medium">{client.dpi || 'No registrado'}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Registro</p>
                    <p className="text-xs font-medium">{new Date(client.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Estado del Perfil</span>
                  <span className="text-emerald-500 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">100% Completo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full rounded-full shadow-[0_0_10px_theme(colors.emerald.400)]" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Toda la documentación requerida ha sido cargada exitosamente.</p>
              </CardContent>
            </Card>


          </div>

          {/* Main Content Sections */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tabbed Detailed Sections */}
            <Tabs defaultValue="timeline" className="space-y-6">
              <div className="bg-accent/40 backdrop-blur-md p-1.5 rounded-2xl border border-border/40 inline-flex flex-wrap shadow-inner w-full overflow-x-auto">
                <TabsList className="bg-transparent h-12 flex-1 gap-1">
                  <TabsTrigger value="timeline" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-card data-[state=active]:shadow-xl transition-all px-4">
                    <Activity className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:inline">Historia</span>
                  </TabsTrigger>
                  <TabsTrigger value="fiscal" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-card data-[state=active]:shadow-xl transition-all px-4">
                    <Receipt className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:inline">Fiscal</span>
                  </TabsTrigger>
                  <TabsTrigger value="legal" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-card data-[state=active]:shadow-xl transition-all px-4">
                    <Scale className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:inline">Legal</span>
                  </TabsTrigger>
                  <TabsTrigger value="banking" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-card data-[state=active]:shadow-xl transition-all px-4">
                    <Landmark className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:inline">Banca</span>
                  </TabsTrigger>
                  <TabsTrigger value="accounting" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-card data-[state=active]:shadow-xl transition-all px-4">
                    <Receipt className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:inline">Contab.</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-card data-[state=active]:shadow-xl transition-all px-4">
                    <StickyNote className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:inline">Notas</span>
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger value="admin" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-card data-[state=active]:shadow-xl transition-all px-4">
                      <Fingerprint className="h-4 w-4 shrink-0" />
                      <span className="hidden lg:inline">Admin</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="animate-in fade-in zoom-in-95 duration-500">
                <TabsContent value="timeline" className="outline-none">
                  <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Línea de Tiempo</h3>
                        <p className="text-sm text-muted-foreground">Actividad reciente e hitos importantes del cliente.</p>
                      </div>
                    </div>
                    <ClientTimeline logs={logs as any[]} />
                  </div>
                </TabsContent>

                <TabsContent value="fiscal" className="outline-none">
                  <FiscalDataForm clientId={id} fiscalData={fiscalData} />
                </TabsContent>

                <TabsContent value="legal" className="outline-none">
                  <LegalDataForm clientId={id} legalData={legalData} />
                </TabsContent>

                <TabsContent value="banking" className="outline-none">
                  <BankingDataSection clientId={id} bankingData={bankingData || []} />
                </TabsContent>

                <TabsContent value="accounting" className="outline-none">
                  <AccountingDataForm clientId={id} accountingData={accountingData} />
                </TabsContent>

                <TabsContent value="notes" className="outline-none">
                  <NotesSection clientId={id} notes={notes || []} />
                </TabsContent>

                {isAdmin && (
                  <TabsContent value="admin" className="outline-none">
                    <ClientAdminTools
                      clientId={client.id}
                      clientEmail={client.email || ''}
                      clientNit={client.nit}
                      userId={client.user_id || null}
                    />
                  </TabsContent>
                )}
              </div>
            </Tabs>

          </div>
        </div>

        {/* Documents Section - Full Width */}
        <div className="space-y-6 pt-6 border-t animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground/90">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              Gestor de Documentos
            </h2>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Administra, organiza y comparte todos los archivos de este cliente.
            </p>
          </div>
          <DocumentsSection clientId={id} initialCounts={documentCounts} />
        </div>
      </div>
    </div>
  )
}
