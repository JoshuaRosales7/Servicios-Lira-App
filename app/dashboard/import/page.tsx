import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MassUploader } from '@/components/dashboard/mass-uploader'
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react'

export default async function ImportPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role === 'client') {
        redirect('/dashboard')
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Header Section */}
            <div className="pb-8 border-b">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Centro de Importación
                        </h1>
                        <p className="text-muted-foreground font-medium">
                            Procesamiento inteligente y archivo automatizado de documentos masivos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Information Section */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card className="border shadow-sm bg-primary/5 md:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Guía de Importación Inteligente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">Detección Automática</h4>
                            <p>Patrones identificados en el nombre del archivo:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li><span className="font-mono text-primary font-medium">NIT-123456</span> &rarr; Cliente</li>
                                <li><span className="font-mono text-primary font-medium">enero 2025</span> &rarr; Periodo</li>
                                <li><span className="font-medium">IVA, ISR, Factura</span> &rarr; Tipo</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">Control Total</h4>
                            <p>Herramientas de validación manual:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>Selector de clientes con búsqueda integrada.</li>
                                <li>Corrección de periodo fiscal al instante.</li>
                                <li>Validación de estado antes de la carga.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Archivos Soportados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {['PDF', 'XML', 'JPG', 'PNG', 'XLSX', 'DOCX'].map(ext => (
                                <span key={ext} className="px-2.5 py-1 rounded-md bg-muted text-xs font-bold text-muted-foreground border">
                                    {ext}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content: Uploader (Full Width) */}
            <Card className="border shadow-md h-full">
                <CardHeader className="bg-muted/30 border-b py-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <UploadCloud className="h-5 w-5 text-primary" />
                                Zona de Carga y Edición
                            </CardTitle>
                            <CardDescription>
                                Arrastra tus archivos para comenzar. La tabla de edición aparecerá automáticamente.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6">
                        <MassUploader />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
