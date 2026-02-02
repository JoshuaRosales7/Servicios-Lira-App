import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StickyNote, Pin, Clock, ArrowRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotesSearch } from '@/components/dashboard/notes-search'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/dashboard/export-button'

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const search = params.search || ''

  let query = supabase
    .from('notes')
    .select(`
      *,
      clients (id, commercial_name, legal_name)
    `)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  const { data: notes, error } = await query.limit(100)

  if (error) {
    console.error('Error fetching notes:', error)
  }

  const sortedNotes = notes ? [...notes].sort((a, b) => {
    const aPinned = a.is_pinned ? 1 : 0
    const bPinned = b.is_pinned ? 1 : 0
    if (aPinned !== bPinned) return bPinned - aPinned
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  }) : []

  const pinnedNotes = sortedNotes.filter((n) => n.is_pinned)
  const recentNotes = sortedNotes.filter((n) => !n.is_pinned).slice(0, 50)

  // Prepare Export Data
  const exportData = notes?.map(n => ({
    Cliente: n.clients?.commercial_name || n.clients?.legal_name || 'Desconocido',
    Titulo: n.title || 'Sin Título',
    Contenido: n.content || '',
    Fecha: new Date(n.updated_at).toLocaleDateString(),
    Prioridad: n.is_pinned ? 'Alta' : 'Normal'
  })) || []

  // Stats definition
  const stats = [
    {
      name: 'Total Notas',
      value: notes?.length || 0,
      icon: StickyNote,
      description: 'Entradas registradas',
    },
    {
      name: 'Fijadas',
      value: pinnedNotes.length,
      icon: Pin,
      description: 'Prioridad alta',
      color: 'text-amber-500'
    },
    {
      name: 'Actividad Reciente',
      value: (
        notes?.filter((n) => {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return new Date(n.updated_at) >= weekAgo
        }).length || 0
      ),
      icon: Clock,
      description: 'Últimos 7 días'
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header Section */}
      <div className="pb-8 border-b">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Bitácora & Notas
            </h1>
            <p className="text-muted-foreground font-medium">
              Seguimiento estratégico y cronología de observaciones por cliente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton
              data={exportData}
              filename="reporte-notas"
              label="Exportar"
            />
            <Link href="/dashboard/clients">
              <Button className="rounded-lg px-5 h-10 font-bold space-x-2">
                <Plus className="h-4 w-4" />
                <span>Nueva Nota</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className={cn("h-4 w-4 text-muted-foreground", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground pt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <NotesSearch />

      <div className="grid gap-8">
        {/* Pinned Notes Section (if any) */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Pin className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">Notas Prioritarias</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pinnedNotes.map((note) => (
                <Link key={note.id} href={`/dashboard/clients/${note.client_id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base line-clamp-1">{note.title || 'Informativo'}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {note.clients?.commercial_name || note.clients?.legal_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {note.content}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity List */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Listado Cronológico</CardTitle>
            <CardDescription>Bitácora completa de gestiones y observaciones técnicas.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentNotes && recentNotes.length > 0 ? (
              <div className="divide-y">
                {recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/dashboard/clients/${note.client_id}`}
                    className="flex flex-col sm:flex-row sm:items-start justify-between p-6 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground">
                          {note.clients?.commercial_name || note.clients?.legal_name || 'Individual'}
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.updated_at).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="font-medium text-base text-primary/90">
                        {note.title || 'Entrada de Seguimiento'}
                      </h4>
                      <p className="text-sm text-muted-foreground/80 line-clamp-2 max-w-3xl">
                        {note.content}
                      </p>
                    </div>

                    <div className="mt-4 sm:mt-0 flex items-center self-center sm:self-start">
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <StickyNote className="h-10 w-10 mb-2 opacity-20" />
                <p>No se encontraron notas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
