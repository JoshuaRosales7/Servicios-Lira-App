'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/lib/types'
import { getDocumentsByCategory, getAllFolders, moveDocument, createDocumentRecord, createFolder, deleteDocument, renameDocument } from '@/app/actions/documents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Upload,
  Search,
  Eye,
  Loader2,
  Trash2,
  Calendar,
  Filter,
  ArrowUpDown,
  X,
  Plus,
  ArrowLeft,
  ChevronRight,
  FolderPlus,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  Pencil,
  FileIcon,
  Move,
  Share2,
  Link as LinkIcon,
  FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface DocumentsSectionProps {
  clientId: string
  initialCounts?: Record<string, number>
}

// Folder Configuration
const FOLDER_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  invoice: { label: 'Facturas', color: 'text-blue-500 bg-blue-50', icon: FileText },
  declaration: { label: 'Declaraciones', color: 'text-purple-500 bg-purple-50', icon: FileText },
  financial_statement: { label: 'Estados Financieros', color: 'text-emerald-500 bg-emerald-50', icon: FileSpreadsheet },
  contract: { label: 'Contratos', color: 'text-amber-500 bg-amber-50', icon: FileText },
  deed: { label: 'Escrituras', color: 'text-indigo-500 bg-indigo-50', icon: FileText },
  patent: { label: 'Patentes', color: 'text-pink-500 bg-pink-50', icon: FileText },
  receipt: { label: 'Recibos', color: 'text-cyan-500 bg-cyan-50', icon: FileText },
  other: { label: 'Otros', color: 'text-gray-500 bg-gray-50', icon: Folder },
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return File
  if (fileType.includes('pdf')) return FileText
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv')) return FileSpreadsheet
  if (fileType.includes('image')) return FileImage
  return File
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '---'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsSection({ clientId, initialCounts = {} }: DocumentsSectionProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [currentCategory, setCurrentCategory] = useState<string>('invoice')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<{ id: string, name: string }[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [files, setFiles] = useState<Document[]>([])
  const [fileCounts, setFileCounts] = useState<Record<string, number>>(initialCounts)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // Modals & Sheets
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isMoveOpen, setIsMoveOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)

  // Action State
  const [actionError, setActionError] = useState<string | null>(null)
  const [foldersList, setFoldersList] = useState<{ id: string, name: string, parent_id: string | null }[]>([])

  // Data for Actions
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    fiscal_year: new Date().getFullYear().toString(),
  })
  const [renameData, setRenameData] = useState({ id: '', name: '', is_folder: false })
  const [moveData, setMoveData] = useState({ id: '', name: '' })
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null) // null for root

  const [newFolderName, setNewFolderName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Preview
  const [previewFile, setPreviewFile] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // -- Effects --

  useEffect(() => {
    async function loadFiles() {
      setLoadingFiles(true)
      try {
        const fetchedFiles = await getDocumentsByCategory(clientId, currentCategory, currentFolderId)
        setFiles(fetchedFiles)
      } catch (err) {
        console.error("Failed to load files", err)
        toast.error("Error al cargar contenido")
      } finally {
        setLoadingFiles(false)
      }
    }
    loadFiles()
  }, [currentCategory, currentFolderId, clientId])

  useEffect(() => {
    setFolderPath([])
    setCurrentFolderId(null)
  }, [currentCategory])

  useEffect(() => {
    if (previewFile && !previewFile.is_folder) {
      const generateUrl = async () => {
        const supabase = createClient()
        const { data } = await supabase.storage.from('documents').createSignedUrl(previewFile.file_path, 3600)
        if (data?.signedUrl) setPreviewUrl(data.signedUrl)
      }
      generateUrl()
    } else {
      setPreviewUrl(null)
    }
  }, [previewFile])

  // -- Navigation --

  const handleOpenFolder = (folder: Document) => {
    if (!folder.is_folder) return
    setCurrentFolderId(folder.id)
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }])
  }

  const handleNavigateUp = (index?: number) => {
    if (index === undefined) {
      setCurrentFolderId(null)
      setFolderPath([])
    } else {
      const newPath = folderPath.slice(0, index + 1)
      setFolderPath(newPath)
      setCurrentFolderId(newPath[newPath.length - 1].id)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      if (filesArray.length > 50) {
        toast.error("Máximo 50 archivos a la vez")
        return
      }
      setSelectedFiles(filesArray)
      // Only preset name if single file
      if (filesArray.length === 1 && !uploadFormData.name) {
        setUploadFormData(prev => ({ ...prev, name: filesArray[0].name }))
      } else if (filesArray.length > 1) {
        setUploadFormData(prev => ({ ...prev, name: '' })) // Clear name for bulk
      }
    }
  }

  // -- Actions --

  const handleShare = async (file: Document) => {
    // Create a temporary signed URL and copy to clipboard
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(file.file_path, 3600 * 24) // 24 hours

    if (data?.signedUrl) {
      navigator.clipboard.writeText(data.signedUrl)
      toast.success("Enlace copiado al portapapeles (Válido por 24h)")
    } else {
      toast.error("No se pudo generar el enlace")
    }
  }

  const handleMoveInit = async (documentId: string, name: string) => {
    setMoveData({ id: documentId, name })
    setTargetFolderId(null) // Default to root
    setIsMoveOpen(true)

    // Fetch available folders
    try {
      const folders = await getAllFolders(clientId, currentCategory)
      setFoldersList(Array.isArray(folders) ? folders : [])
    } catch (e) {
      console.error(e)
      setFoldersList([])
    }
  }

  const handleMoveSubmit = async () => {
    if (!moveData.id) return
    setLoadingAction(true)
    try {
      // If moving a folder into itself or its children -> prevent cycle (basic check: target != self)
      // Simple check: client-side for now
      if (moveData.id === targetFolderId) {
        toast.error("No puedes mover una carpeta dentro de sí misma")
        setLoadingAction(false)
        return
      }

      await moveDocument(moveData.id, targetFolderId)

      // Remove from current view if we moved it out (unless we moved it to SAME folder, which makes no sense)
      // If targetFolderId != currentFolderId -> Remove
      if (targetFolderId !== currentFolderId) {
        setFiles(prev => prev.filter(f => f.id !== moveData.id))
      }

      toast.success("Elemento movido correctamente")
      setIsMoveOpen(false)
    } catch (e) {
      toast.error("Error al mover elemento")
    }
    setLoadingAction(false)
  }

  const handleRename = async () => {
    if (!renameData.name.trim()) return

    setLoadingAction(true)
    try {
      await renameDocument(renameData.id, renameData.name)
      setFiles(prev => prev.map(f => f.id === renameData.id ? { ...f, name: renameData.name } : f))
      toast.success("Renombrado correctamente")
      setIsRenameOpen(false)
    } catch (error: any) {
      toast.error("Error al renombrar: " + error.message)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    setLoadingAction(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const newFolder = await createFolder({
        client_id: clientId,
        uploaded_by: user.id,
        name: newFolderName,
        document_type: currentCategory as any,
        is_folder: true,
        parent_id: currentFolderId,
        file_path: `folder-${Date.now()}`,
        mime_type: 'application/vnd.folder',
        file_size: 0,
        version: 1
      })

      setFiles(prev => [newFolder, ...prev])
      setIsNewFolderOpen(false)
      setNewFolderName('')
      toast.success("Carpeta creada")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoadingAction(false)
    }
  }

  const performUpload = async (file: File, name?: string, year?: string) => {
    // 10MB Limit
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`El archivo ${file.name} excede el límite de 10MB`)
      return
    }

    setLoadingAction(true)
    setActionError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const filePath = `${clientId}/${currentCategory}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: storageError } = await supabase.storage.from('documents').upload(filePath, file)
    if (storageError) {
      toast.error(`Error subiendo ${file.name}: ${storageError.message}`)
      setLoadingAction(false)
      return
    }

    try {
      const insertedDoc = await createDocumentRecord({
        client_id: clientId,
        uploaded_by: user.id,
        name: name || file.name,
        file_path: filePath,
        mime_type: file.type,
        file_size: file.size,
        document_type: currentCategory as any,
        fiscal_year: year ? parseInt(year) : new Date().getFullYear(),
        parent_id: currentFolderId,
        is_folder: false,
        version: 1,
      })

      setFiles(prev => [insertedDoc, ...prev])
      setFileCounts(prev => ({ ...prev, [currentCategory]: (prev[currentCategory] || 0) + 1 }))
      toast.success(`Archivo ${file.name} subido`)
    } catch (e: any) {
      toast.error(`Error guardando referencia: ${e.message}`)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFiles.length === 0) return

    // If single file, use the custom name if provided
    if (selectedFiles.length === 1) {
      await performUpload(selectedFiles[0], uploadFormData.name, uploadFormData.fiscal_year)
    } else {
      // Bulk upload - ignore custom name, use original filenames
      setLoadingAction(true)
      for (const file of selectedFiles) {
        await performUpload(file, undefined, uploadFormData.fiscal_year)
      }
    }

    setIsUploadOpen(false)
    setSelectedFiles([])
    setUploadFormData({ name: '', fiscal_year: new Date().getFullYear().toString() })
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const fileToDelete = files.find(f => f.id === deleteId)
    if (!fileToDelete) return

    setLoadingAction(true)
    const supabase = createClient()

    if (!fileToDelete.is_folder) {
      await supabase.storage.from('documents').remove([fileToDelete.file_path])
    }

    try {
      await deleteDocument(deleteId, fileToDelete.is_folder)
      setFiles(prev => prev.filter(f => f.id !== deleteId))
      if (!fileToDelete.is_folder) {
        setFileCounts(prev => ({ ...prev, [currentCategory]: Math.max(0, (prev[currentCategory] || 0) - 1) }))
      }

      toast.success("Eliminado correctamente")
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message)
    } finally {
      setDeleteId(null)
      setLoadingAction(false)
    }
  }

  // move helpers
  const getSubfoldersOf = (parentId: string | null) => {
    return foldersList.filter(f => f.id !== moveData.id)
  }

  // -- Drag & Drop --

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length === 0) return

    if (droppedFiles.length > 50) {
      toast.error("Solo puedes subir un máximo de 50 archivos a la vez.")
      return
    }

    toast.info(`Subiendo ${droppedFiles.length} archivos...`)

    for (const file of droppedFiles) {
      await performUpload(file)
    }
  }, [currentCategory, currentFolderId, clientId])

  // -- Render Helpers --

  const filteredFiles = files
    .filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesYear = yearFilter ? (file.fiscal_year?.toString() === yearFilter) : true
      return matchesSearch && matchesYear
    })
    .sort((a, b) => {
      if (a.is_folder && !b.is_folder) return -1
      if (!a.is_folder && b.is_folder) return 1
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

  const ContextMenuWrapper = ({ children, file }: { children: React.ReactNode, file: Document }) => (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={() => file.is_folder ? handleOpenFolder(file) : setPreviewFile(file)}>
          <Eye className="mr-2 h-4 w-4" />
          {file.is_folder ? "Abrir Carpeta" : "Vista Previa"}
        </ContextMenuItem>

        <ContextMenuItem onClick={() => handleMoveInit(file.id, file.name)}>
          <Move className="mr-2 h-4 w-4" />
          Mover a...
        </ContextMenuItem>

        <ContextMenuItem onClick={() => {
          setRenameData({ id: file.id, name: file.name, is_folder: file.is_folder })
          setIsRenameOpen(true)
        }}>
          <Pencil className="mr-2 h-4 w-4" />
          Renombrar
        </ContextMenuItem>

        {!file.is_folder && (
          <>
            <ContextMenuItem onClick={() => handleShare(file)}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartir Enlace
            </ContextMenuItem>
            <ContextMenuItem onClick={async () => {
              const supabase = createClient()
              const { data } = await supabase.storage.from('documents').createSignedUrl(file.file_path, 60)
              if (data?.signedUrl) window.open(data.signedUrl, '_blank')
            }}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(file.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )

  const DropdownActionMenu = ({ file }: { file: Document }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => file.is_folder ? handleOpenFolder(file) : setPreviewFile(file)}>
          <Eye className="mr-2 h-4 w-4" />
          {file.is_folder ? "Abrir" : "Ver"}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleMoveInit(file.id, file.name)}>
          <Move className="mr-2 h-4 w-4" />
          Mover
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => {
          setRenameData({ id: file.id, name: file.name, is_folder: file.is_folder })
          setIsRenameOpen(true)
        }}>
          <Pencil className="mr-2 h-4 w-4" />
          Renombrar
        </DropdownMenuItem>

        {!file.is_folder && (
          <DropdownMenuItem onClick={() => handleShare(file)}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartir
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(file.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex h-[750px] border rounded-2xl overflow-hidden bg-background shadow-sm relative">

      {/* Drag Overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-2 border-primary border-dashed rounded-2xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200"
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div className="bg-background p-6 rounded-full shadow-xl animate-bounce">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mt-4 text-2xl font-bold text-primary">Suelta los archivos aquí</h3>
          <p className="text-muted-foreground font-medium">Se subirán a: {folderPath.length > 0 ? folderPath[folderPath.length - 1].name : FOLDER_CONFIG[currentCategory].label}</p>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10 flex flex-col shrink-0" onDragOver={onDragOver}>
        <div className="p-4 border-b bg-background/50 backdrop-blur-sm">
          <h3 className="font-semibold flex items-center gap-2 text-sm text-foreground/80">
            <Folder className="h-4 w-4 fill-primary/20 text-primary" />
            Biblioteca
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {Object.entries(FOLDER_CONFIG).map(([key, config]) => {
            const isActive = currentCategory === key
            return (
              <button
                key={key}
                onClick={() => setCurrentCategory(key)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left group",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <config.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground/70")} />
                  <span className="truncate">{config.label}</span>
                </div>
                {fileCounts[key] > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                  )}>
                    {fileCounts[key]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t bg-background/50 space-y-2">
          <Button onClick={() => setIsUploadOpen(true)} className="w-full gap-2 font-bold shadow-sm mb-2" size="sm">
            <Upload className="h-3.5 w-3.5" />
            Subir Archivo
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col bg-background relative z-0 min-w-0"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Toolbar */}
        <div className="h-16 border-b flex items-center justify-between px-6 gap-4 bg-background/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center text-sm font-medium overflow-hidden whitespace-nowrap mask-linear-fade">
              <button
                onClick={() => handleNavigateUp()}
                className={cn("hover:underline decoration-primary underline-offset-4 transition-all", folderPath.length === 0 ? "font-bold text-foreground" : "text-muted-foreground")}
              >
                {FOLDER_CONFIG[currentCategory].label}
              </button>
              {folderPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/40 shrink-0" />
                  <button
                    onClick={() => handleNavigateUp(index)}
                    className={cn("hover:underline decoration-primary underline-offset-4 transition-all truncate max-w-[150px]", index === folderPath.length - 1 ? "font-bold text-foreground" : "text-muted-foreground")}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="text-[10px] text-muted-foreground flex items-center gap-2">
              <span>{filteredFiles.length} elementos</span>
              {yearFilter && <span>• Filtrado por {yearFilter}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative hidden lg:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-48 pl-8 text-xs bg-muted/30 border-transparent hover:border-border focus:bg-background transition-all rounded-lg"
              />
            </div>

            <div className="flex items-center border rounded-lg p-1 bg-muted/30 gap-1">
              <div className="flex gap-0.5">
                <Button
                  variant={viewMode === 'grid' ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={() => setViewMode('list')}
                >
                  <ListIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="w-px h-4 bg-border/50 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md p-0 hover:bg-background shadow-none"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                title="Ordenar por fecha"
              >
                <ArrowUpDown className={cn("h-3.5 w-3.5 transition-transform", sortOrder === 'asc' && "rotate-180")} />
              </Button>
            </div>

            <Button onClick={() => setIsNewFolderOpen(true)} variant="outline" size="sm" className="h-9 w-9 p-0 rounded-lg shadow-sm border-dashed">
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {loadingFiles ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-[1/1] rounded-xl border p-4 flex flex-col justify-between">
                    <div className="flex-1 flex items-center justify-center">
                      <Skeleton className="h-14 w-14 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <div className="flex justify-between">
                        <Skeleton className="h-2 w-10" />
                        <Skeleton className="h-2 w-10" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Año</TableHead>
                      <TableHead>Tamaño</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-4 w-32" /></div></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : filteredFiles.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                  {filteredFiles.map((file) => {
                    const isFolder = file.is_folder
                    const FileIcon = isFolder ? Folder : getFileIcon(file.mime_type)

                    return (
                      <ContextMenuWrapper key={file.id} file={file}>
                        <div
                          onClick={() => isFolder ? handleOpenFolder(file) : setPreviewFile(file)}
                          onDoubleClick={() => isFolder && handleOpenFolder(file)}
                          className={cn(
                            "group relative flex flex-col p-4 rounded-xl border bg-card/50 transition-all cursor-pointer aspect-[1/1] justify-between",
                            isFolder ? "hover:bg-primary/5 hover:border-primary/20" : "hover:shadow-md hover:border-border hover:bg-card"
                          )}
                        >
                          <div className="flex-1 flex flex-col items-center justify-center gap-3">
                            <div className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm",
                              isFolder ? "bg-amber-100 text-amber-500" : "bg-muted text-muted-foreground"
                            )}>
                              <FileIcon className={cn("h-7 w-7", isFolder && "fill-current")} />
                            </div>
                            <p className="font-semibold text-xs text-center line-clamp-2 px-1 leading-relaxed break-words w-full select-none">
                              {file.name}
                            </p>
                          </div>

                          {!isFolder && (
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium w-full pt-2 border-t border-border/50">
                              <span>{formatFileSize(file.file_size)}</span>
                              <span>{file.fiscal_year || '-'}</span>
                            </div>
                          )}
                        </div>
                      </ContextMenuWrapper>
                    )
                  })}
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden shadow-sm bg-card mb-20">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-[50%]">Nombre</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Año Fiscal</TableHead>
                        <TableHead className="text-right">Tamaño</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFiles.map((file) => {
                        const isFolder = file.is_folder
                        const FileIcon = isFolder ? Folder : getFileIcon(file.mime_type)
                        return (
                          <TableRow
                            key={file.id}
                            className="group cursor-pointer hover:bg-muted/50"
                            onClick={() => isFolder ? handleOpenFolder(file) : setPreviewFile(file)}
                          >
                            <TableCell className="font-medium">
                              <ContextMenuWrapper file={file}>
                                <div className="flex items-center gap-3">
                                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isFolder ? "bg-amber-100/50 text-amber-600" : "bg-muted text-muted-foreground")}>
                                    <FileIcon className="h-4 w-4" />
                                  </div>
                                  <span className="truncate max-w-[200px] sm:max-w-[300px]">{file.name}</span>
                                </div>
                              </ContextMenuWrapper>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(file.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-xs">
                              {file.fiscal_year || '-'}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground font-mono">
                              {isFolder ? '-' : formatFileSize(file.file_size)}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownActionMenu file={file} />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          ) : (
            <div
              className="h-full flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed rounded-xl border-muted-foreground/10 bg-muted/5 cursor-pointer hover:bg-muted/10 transition-colors"
              onClick={() => setIsUploadOpen(true)}
            >
              <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mb-4 ring-8 ring-muted/10">
                <Upload className="h-8 w-8 opacity-20" />
              </div>
              <p className="font-semibold text-sm">Carpeta vacía</p>
              <p className="text-xs mt-1">Arrastra archivos aquí o haz click</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Sheet */}
      <Sheet open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <SheetContent className="sm:max-w-3xl w-full p-0 flex flex-col gap-0 border-l shadow-2xl z-50">
          {previewFile && (
            <>
              <SheetHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur z-10 flex flex-row items-center justify-between space-y-0">
                <div className="flex-1 min-w-0 pr-4">
                  <SheetTitle className="text-base truncate leading-tight">{previewFile.name}</SheetTitle>
                  <SheetDescription className="flex items-center gap-3 text-xs mt-1">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-foreground font-medium">{formatFileSize(previewFile.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(previewFile.created_at).toLocaleDateString()}</span>
                  </SheetDescription>
                </div>
                <div className="flex items-center gap-1">
                  <DropdownActionMenu file={previewFile} />
                  <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </SheetHeader>

              <div className="flex-1 bg-muted/10 relative overflow-hidden flex items-center justify-center p-0">
                {previewUrl ? (
                  (() => {
                    const mime = previewFile.mime_type || ''
                    const ext = previewFile.name.split('.').pop()?.toLowerCase() || ''

                    // Image
                    if (mime.startsWith('image/')) {
                      return <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-sm bg-checkerboard" />
                    }

                    // PDF
                    if (mime === 'application/pdf') {
                      return <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full bg-white" title="PDF Preview" />
                    }

                    // Audio
                    if (mime.startsWith('audio/')) {
                      return (
                        <div className="w-full max-w-md p-6 bg-card rounded-xl shadow-sm border text-center space-y-4">
                          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <FileText className="h-8 w-8 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{previewFile.name}</p>
                            <p className="text-xs text-muted-foreground">Audio Clip</p>
                          </div>
                          <audio controls className="w-full" src={previewUrl} />
                        </div>
                      )
                    }

                    // Video
                    if (mime.startsWith('video/')) {
                      return <video controls className="max-w-full max-h-full rounded-lg shadow-lg" src={previewUrl} />
                    }

                    // Office Documents (Word, Excel, PowerPoint)
                    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
                      const encodedUrl = encodeURIComponent(previewUrl);
                      return (
                        <div className="w-full h-full flex flex-col">
                          <iframe
                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`}
                            className="w-full h-full bg-white"
                            title="Office Preview"
                            onError={(e) => toast.error("No se pudo cargar la vista previa de Office")}
                          />
                          <div className="p-2 bg-muted/20 text-xs text-center text-muted-foreground">
                            Vista previa proporcionada por Microsoft Office Online
                          </div>
                        </div>
                      )
                    }

                    // Fallback
                    return (
                      <div className="text-center space-y-6 max-w-sm p-8 bg-background/50 backdrop-blur-sm rounded-2xl border shadow-sm">
                        <div className="h-24 w-24 bg-muted rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                          <File className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-bold">Vista previa no disponible</p>
                          <p className="text-sm text-muted-foreground">
                            Este tipo de archivo ({ext.toUpperCase()}) no se puede visualizar directamente en el navegador.
                          </p>
                        </div>
                        <Button onClick={() => window.open(previewUrl, '_blank')} className="w-full gap-2">
                          <Download className="h-4 w-4" />
                          Descargar Archivo
                        </Button>
                      </div>
                    )
                  })()
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Generando vista segura...</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Folder Dialog */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="sm:max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">Nueva Carpeta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFolder} className="space-y-4 py-2">
            <div className="flex justify-center my-2">
              <div className="h-16 w-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-500">
                <FolderPlus className="h-8 w-8" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="sr-only">Nombre</Label>
              <Input
                placeholder="Nombre de la carpeta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="text-center font-medium"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loadingAction} className="w-full">
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Carpeta"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">Renombrar</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="sr-only">Nombre</Label>
              <Input
                value={renameData.name}
                onChange={(e) => setRenameData(prev => ({ ...prev, name: e.target.value }))}
                className="text-center font-medium"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loadingAction} className="w-full">
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Mover "{moveData.name}"</DialogTitle>
            <DialogDescription>Selecciona la carpeta de destino</DialogDescription>
          </DialogHeader>

          <div className="h-[300px] overflow-y-auto border rounded-lg bg-muted/10 p-2">
            <div className="space-y-1">
              <button
                onClick={() => setTargetFolderId(null)}
                className={cn(
                  "w-full flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted",
                  targetFolderId === null ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <FolderOpen className="h-4 w-4" />
                Inicio ({FOLDER_CONFIG[currentCategory]?.label})
              </button>

              {getSubfoldersOf(null).map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setTargetFolderId(folder.id)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted pl-6", // Indent just one level for simple MVP
                    targetFolderId === folder.id ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                >
                  <Folder className="h-4 w-4" />
                  {folder.name}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsMoveOpen(false)}>Cancelar</Button>
            <Button onClick={handleMoveSubmit} disabled={loadingAction}>
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mover Aquí"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={handleUploadSubmit}>
            <DialogHeader>
              <DialogTitle>Subir Archivos</DialogTitle>
              <DialogDescription>
                Se guardarán en: <span className="font-bold text-foreground">{folderPath.length > 0 ? folderPath[folderPath.length - 1].name : FOLDER_CONFIG[currentCategory].label}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-full h-32 border-dashed border-2 rounded-xl flex flex-col items-center justify-center gap-3 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group hover:border-primary/50",
                    selectedFiles.length > 0 ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
                  {selectedFiles.length > 0 ? (
                    <>
                      <div className="h-10 w-10 bg-background rounded-lg shadow-sm flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-center px-4">
                        {selectedFiles.length === 1 ? (
                          <>
                            <p className="text-sm font-bold truncate max-w-[200px]">{selectedFiles[0].name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFiles[0].size)}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-bold">{selectedFiles.length} archivos seleccionados</p>
                            <p className="text-xs text-muted-foreground">Listos para subir</p>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Click para seleccionar</p>
                        <p className="text-xs text-muted-foreground">Soporta múltiples archivos (Max 50)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="file_name" className="text-xs font-bold uppercase text-muted-foreground">Nombre (Opcional)</Label>
                  <Input
                    id="file_name"
                    placeholder={selectedFiles.length > 1 ? "(Múltiples archivos)" : selectedFiles[0]?.name}
                    value={uploadFormData.name}
                    onChange={e => setUploadFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="font-medium"
                    disabled={selectedFiles.length > 1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-xs font-bold uppercase text-muted-foreground">Año Fiscal</Label>
                  <Input id="year" type="number" value={uploadFormData.fiscal_year} onChange={e => setUploadFormData(prev => ({ ...prev, fiscal_year: e.target.value }))} className="font-mono" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loadingAction || selectedFiles.length === 0} className="gap-2 font-bold">
                {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subir Ahora"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar elemento?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Si eliminas una carpeta, se borrará todo su contenido.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar Definitivamente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
