'use client'

import React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Note } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  StickyNote,
  Pin,
  Edit,
  Search,
  Calendar,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotesSectionProps {
  clientId: string
  notes: Note[]
}

const emptyFormData = {
  title: '',
  content: '',
  is_pinned: false,
}

import { createNote, updateNote, deleteNote, togglePinNote } from '@/app/actions/data-management'

export function NotesSection({ clientId, notes }: NotesSectionProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState(emptyFormData)

  const filteredNotes = notes.filter(note =>
    (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (!!a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && !!b.is_pinned) return 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title?.trim()) {
      setError('El título es obligatorio')
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Sesión expirada')
      setIsLoading(false)
      return
    }

    try {
      if (editingNote) {
        await updateNote(editingNote.id, clientId, formData.title, formData.content || '', formData.is_pinned)
      } else {
        await createNote(clientId, formData.title, formData.content || '', user.id)
      }

      setIsOpen(false)
      setFormData(emptyFormData)
      setEditingNote(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsLoading(true)

    try {
      await deleteNote(deleteId, clientId)
      setDeleteId(null)
      router.refresh()
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePin = async (note: Note) => {
    try {
      await togglePinNote(note.id, !note.is_pinned, clientId)
      router.refresh()
    } catch (e) {
      console.error(e)
    }
  }

  const openEdit = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title || '',
      content: note.content || '',
      is_pinned: !!note.is_pinned,
    })
    setIsOpen(true)
  }

  const openNew = () => {
    setEditingNote(null)
    setFormData(emptyFormData)
    setIsOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 pb-2 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-amber-500" />
          Bitácora de Notas
        </h3>
        <p className="text-sm text-muted-foreground">Registro de recordatorios y anotaciones importantes.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Nota
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingNote ? 'Editar Nota' : 'Nueva Nota'}
                </DialogTitle>
                <DialogDescription>
                  {editingNote ? 'Modifique los detalles de la nota seleccionada.' : 'Cree un nuevo recordatorio o nota para este perfil.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Asunto o tema principal..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenido</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Escriba la información aquí..."
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_pinned"
                    checked={formData.is_pinned}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked as boolean })}
                  />
                  <Label htmlFor="is_pinned" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Fijar nota al inicio
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <Card key={note.id} className={cn("group shadow-sm hover:shadow-md transition-all", note.is_pinned && "border-primary bg-primary/5")}>
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg leading-none">{note.title}</h4>
                      {note.is_pinned && (
                        <Pin className="h-3 w-3 text-primary rotate-45 fill-current" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePin(note)}>
                      <Pin className={cn("h-4 w-4", note.is_pinned ? "fill-current text-primary" : "text-muted-foreground")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(note)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {note.content && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed flex-1">
                    {note.content}
                  </p>
                )}

                <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border border-dashed rounded-lg bg-muted/10">
            <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-4">
              <StickyNote className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Bitácora vacía</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">No se han registrado anotaciones para este cliente.</p>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Nota
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
