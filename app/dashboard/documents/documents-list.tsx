import { getAllDocuments } from '@/app/actions/documents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    File,
    FileImage,
    FileSpreadsheet,
    FileText
} from 'lucide-react'
import Link from 'next/link'

const categoryNames: Record<string, string> = {
    fiscal: 'Fiscal',
    legal: 'Legal',
    accounting: 'Contabilidad',
    banking: 'Banca',
    other: 'Otro',
}

function getFileIcon(fileType: string | null) {
    if (!fileType) return File
    if (fileType.includes('pdf')) return FileText
    if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv')) return FileSpreadsheet
    if (fileType.includes('image')) return FileImage
    return File
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DocumentsListProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function DocumentsList({ searchParams }: DocumentsListProps) {
    const page = Number(searchParams?.page) || 1
    const limit = 10
    const offset = (page - 1) * limit
    const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
    const type = typeof searchParams?.type === 'string' ? searchParams.type : undefined
    const sort = typeof searchParams?.sort === 'string' ? searchParams.sort : undefined

    const { documents, count: filteredCount } = await getAllDocuments({
        limit,
        offset,
        search,
        type,
        sort
    })

    const totalPages = Math.ceil(filteredCount / limit)

    const createPageLink = (newPage: number) => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (type) params.set('type', type)
        if (sort) params.set('sort', sort)
        params.set('page', newPage.toString())
        return `?${params.toString()}`
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle>Explorador de Documentos</CardTitle>
                <CardDescription>
                    {filteredCount} resultados encontrados
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {documents && documents.length > 0 ? (
                    <div className="divide-y divide-border">
                        {documents.map((doc: any) => {
                            const DocIcon = getFileIcon(doc.mime_type || doc.file_path);

                            return (
                                <Link
                                    key={doc.id}
                                    href={`/dashboard/clients/${doc.client_id}`}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                                            <DocIcon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium truncate group-hover:text-primary transition-colors">{doc.name}</p>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <span className="font-medium text-foreground px-1.5 py-0.5 bg-muted rounded-md ">
                                                    {doc.clients?.commercial_name || doc.clients?.legal_name || 'Desconocido'}
                                                </span>
                                                <span>•</span>
                                                <span className="capitalize">{categoryNames[doc.document_type] || doc.document_type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 sm:mt-0 flex items-center gap-6 text-sm">
                                        <div className="text-right">
                                            <p className="font-medium">{formatFileSize(doc.file_size)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(doc.uploaded_at || doc.created_at).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-lg">Sin resultados</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                            No se encontraron documentos que coincidan con los filtros.
                        </p>
                    </div>
                )}

                {/* Pagination Footer */}
                {filteredCount > 0 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {offset + 1} a {Math.min(offset + limit, filteredCount)} de {filteredCount}
                        </div>
                        <div className="flex items-center gap-2">
                            {page > 1 ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={createPageLink(page - 1)}>
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        Anterior
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" disabled>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Anterior
                                </Button>
                            )}

                            {page < totalPages ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={createPageLink(page + 1)}>
                                        Siguiente
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" disabled>
                                    Siguiente
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
