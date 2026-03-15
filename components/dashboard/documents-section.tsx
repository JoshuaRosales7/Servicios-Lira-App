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
const FOLDER_CONFIG: Record<string, { 
  label: string, 
  activeText: string, 
  activeBorder: string,
  badgeBg: string, 
  badgeText: string, 
  icon: any,
  cardGradient: string 
}> = {
  invoice: { 
    label: 'Facturas', 
    activeText: 'text-blue-600 dark:text-blue-400', 
    activeBorder: 'border-blue-200 dark:border-blue-800',
    badgeBg: 'bg-blue-100 dark:bg-blue-500/20', 
    badgeText: 'text-blue-700 dark:text-blue-300', 
    icon: FileText,
    cardGradient: 'from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 text-blue-600 dark:text-blue-400',
  },
  declaration: { 
    label: 'Declaraciones', 
    activeText: 'text-purple-600 dark:text-purple-400', 
    activeBorder: 'border-purple-200 dark:border-purple-800',
    badgeBg: 'bg-purple-100 dark:bg-purple-500/20', 
    badgeText: 'text-purple-700 dark:text-purple-300', 
    icon: FileText,
    cardGradient: 'from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/20 text-purple-600 dark:text-purple-400',
  },
  financial_statement: { 
    label: 'Estados Financieros', 
    activeText: 'text-emerald-600 dark:text-emerald-400', 
    activeBorder: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20', 
    badgeText: 'text-emerald-700 dark:text-emerald-300', 
    icon: FileSpreadsheet,
    cardGradient: 'from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  },
  contract: { 
    label: 'Contratos', 
    activeText: 'text-amber-600 dark:text-amber-400', 
    activeBorder: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-500/20', 
    badgeText: 'text-amber-700 dark:text-amber-300', 
    icon: FileText,
    cardGradient: 'from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 text-amber-600 dark:text-amber-400',
  },
  deed: { 
    label: 'Escrituras', 
    activeText: 'text-indigo-600 dark:text-indigo-400', 
    activeBorder: 'border-indigo-200 dark:border-indigo-800',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-500/20', 
    badgeText: 'text-indigo-700 dark:text-indigo-300', 
    icon: FileText,
    cardGradient: 'from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  },
  patent: { 
    label: 'Patentes', 
    activeText: 'text-rose-600 dark:text-rose-400', 
    activeBorder: 'border-rose-200 dark:border-rose-800',
    badgeBg: 'bg-rose-100 dark:bg-rose-500/20', 
    badgeText: 'text-rose-700 dark:text-rose-300', 
    icon: FileText,
    cardGradient: 'from-rose-100 to-rose-50 dark:from-rose-900/40 dark:to-rose-900/20 text-rose-600 dark:text-rose-400',
  },
  receipt: { 
    label: 'Recibos', 
    activeText: 'text-teal-600 dark:text-teal-400', 
    activeBorder: 'border-teal-200 dark:border-teal-800',
    badgeBg: 'bg-teal-100 dark:bg-teal-500/20', 
    badgeText: 'text-teal-700 dark:text-teal-300', 
    icon: FileText,
    cardGradient: 'from-teal-100 to-teal-50 dark:from-teal-900/40 dark:to-teal-900/20 text-teal-600 dark:text-teal-400',
  },
  other: { 
    label: 'Otros', 
    activeText: 'text-slate-600 dark:text-slate-400', 
    activeBorder: 'border-slate-200 dark:border-slate-800',
    badgeBg: 'bg-slate-100 dark:bg-slate-500/20', 
    badgeText: 'text-slate-700 dark:text-slate-300', 
    icon: Folder,
    cardGradient: 'from-slate-100 to-slate-50 dark:from-slate-800/40 dark:to-slate-800/20 text-slate-600 dark:text-slate-400',
  },
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return File
  if (fileType.includes('pdf')) return FileText
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv')) return FileSpreadsheet
  if (fileType.includes('image')) return FileImage
  return File
}

function getFileStyle(fileType: string | null) {
  if (!fileType) return 'from-stone-100 to-stone-50 dark:from-stone-800/40 dark:to-stone-800/20 text-stone-500 dark:text-stone-400';
  if (fileType.includes('pdf')) return 'from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20 text-red-500 dark:text-red-400';
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv')) return 'from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/20 text-green-500 dark:text-green-400';
  if (fileType.includes('image')) return 'from-cyan-100 to-cyan-50 dark:from-cyan-900/40 dark:to-cyan-900/20 text-cyan-500 dark:text-cyan-400';
  return 'from-stone-100 to-stone-50 dark:from-stone-800/40 dark:to-stone-800/20 text-stone-500 dark:text-stone-400';
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'image' | 'sheet'>('all')

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
  
  // Selection
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

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
  
  // Toggle selection
  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setSelectedDocIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedDocIds.length === filteredFiles.length) {
      setSelectedDocIds([])
    } else {
      setSelectedDocIds(filteredFiles.map(f => f.id))
    }
  }

  // Clear selections on folder navigation or category change
  useEffect(() => {
    setSelectedDocIds([])
  }, [currentCategory, currentFolderId, typeFilter])

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

  const handleBulkMoveSubmit = async () => {
    if (selectedDocIds.length === 0) return
    setLoadingAction(true)
    try {
      if (selectedDocIds.includes(targetFolderId || '')) {
        toast.error("No puedes mover una carpeta dentro de sí misma")
        setLoadingAction(false)
        return
      }

      await Promise.all(selectedDocIds.map(id => moveDocument(id, targetFolderId)))

      if (targetFolderId !== currentFolderId) {
        setFiles(prev => prev.filter(f => !selectedDocIds.includes(f.id)))
        setSelectedDocIds([])
      }

      toast.success(`${selectedDocIds.length} elementos movidos correctamente`)
      setIsBulkMoveOpen(false)
    } catch (e) {
      toast.error("Error al mover elementos")
    }
    setLoadingAction(false)
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

  const handleBulkDelete = async () => {
    if (selectedDocIds.length === 0) return
    setLoadingAction(true)
    const supabase = createClient()

    try {
      const filesToDelete = files.filter(f => selectedDocIds.includes(f.id))
      
      // Delete files from storage
      const storagePaths = filesToDelete.filter(f => !f.is_folder).map(f => f.file_path)
      if (storagePaths.length > 0) {
        await supabase.storage.from('documents').remove(storagePaths)
      }

      // Delete from DB
      await Promise.all(selectedDocIds.map(id => {
        const file = filesToDelete.find(f => f.id === id)
        return deleteDocument(id, file?.is_folder || false)
      }))

      setFiles(prev => prev.filter(f => !selectedDocIds.includes(f.id)))
      
      // Update count for non-folders
      const nonFolderCount = filesToDelete.filter(f => !f.is_folder).length
      if (nonFolderCount > 0) {
         setFileCounts(prev => ({ ...prev, [currentCategory]: Math.max(0, (prev[currentCategory] || 0) - nonFolderCount) }))
      }

      toast.success(`${selectedDocIds.length} elementos eliminados`)
      setSelectedDocIds([])
      setIsBulkDeleteOpen(false)
    } catch (error: any) {
      toast.error("Error al eliminar elementos: " + error.message)
    } finally {
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
      
      let matchesType = true
      if (typeFilter !== 'all' && !file.is_folder) {
        const mime = file.mime_type?.toLowerCase() || ''
        const name = file.name.toLowerCase()
        if (typeFilter === 'pdf') matchesType = mime.includes('pdf') || name.endsWith('.pdf')
        if (typeFilter === 'image') matchesType = mime.includes('image') || name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg')
        if (typeFilter === 'sheet') matchesType = mime.includes('sheet') || mime.includes('excel') || mime.includes('csv') || name.endsWith('.xlsx') || name.endsWith('.csv')
      }
      
      // Hide folders if filtering by a specific file type
      if (typeFilter !== 'all' && file.is_folder) return false;

      return matchesSearch && matchesYear && matchesType
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
          className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md border-2 border-primary border-dashed rounded-2xl flex flex-col items-center justify-center animate-in fade-in duration-200"
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div className="bg-primary/10 p-6 rounded-full shadow-2xl shadow-primary/20 animate-bounce mb-6">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mt-4 text-2xl font-bold text-primary">Suelta los archivos aquí</h3>
          <p className="text-muted-foreground font-medium">Se subirán a: {folderPath.length > 0 ? folderPath[folderPath.length - 1].name : FOLDER_CONFIG[currentCategory].label}</p>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col shrink-0" onDragOver={onDragOver}>
        <div className="p-5 border-b border-transparent">
          <h3 className="font-semibold flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
            <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />
            Explorador
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {Object.entries(FOLDER_CONFIG).map(([key, config]) => {
            const isActive = currentCategory === key
            return (
              <button
                key={key}
                onClick={() => setCurrentCategory(key)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left group",
                  isActive
                    ? `bg-white dark:bg-slate-800 font-medium shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border ${config.activeBorder} ${config.activeText}`
                    : "text-slate-500 dark:text-slate-400 font-normal hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <config.icon className={cn("h-4 w-4 transition-colors", isActive ? config.activeText : "text-slate-400 dark:text-slate-500")} />
                  <span className="truncate">{config.label}</span>
                </div>
                {fileCounts[key] > 0 && (
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors",
                    isActive 
                      ? `${config.badgeBg} ${config.badgeText}` 
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-300 dark:group-hover:bg-slate-700"
                  )}>
                    {fileCounts[key]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md space-y-4">
          <div className="space-y-2.5 px-1">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Almacenamiento Local</span>
              <span className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                {formatFileSize(files.reduce((acc, f) => acc + (f.file_size || 0), 0))}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
               <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (files.length / 50) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Capacidad calculada por vista actúal</p>
          </div>
          <Button onClick={() => setIsUploadOpen(true)} className="w-full gap-2 rounded-xl shadow-[0_8px_16px_-6px_rgba(59,130,246,0.5)] hover:shadow-[0_12px_20px_-8px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 transition-all bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-0 text-white font-medium" size="default">
            <Upload className="h-4 w-4" />
            Subir Archivo
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/10 relative z-0 min-w-0"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Toolbar */}
        <div className="h-[72px] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 gap-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
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

            <div className="flex items-center gap-2 mt-2">
              <div className="text-[10px] text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                {filteredFiles.length} elementos
              </div>
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {(['all', 'pdf', 'image', 'sheet'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      "text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all whitespace-nowrap",
                      typeFilter === type 
                        ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm" 
                        : "bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    {type === 'all' ? 'Todos' : type === 'pdf' ? 'PDFs' : type === 'image' ? 'Imágenes' : 'Tablas'}
                  </button>
                ))}
              </div>
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

            <div className="flex items-center bg-slate-100/80 dark:bg-slate-900/50 rounded-lg p-1 shadow-inner border border-slate-200/50 dark:border-slate-800">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 rounded-md shadow-none transition-all", viewMode === 'grid' && "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400")}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 rounded-md shadow-none transition-all", viewMode === 'list' && "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400")}
                onClick={() => setViewMode('list')}
              >
                <ListIcon className="h-3.5 w-3.5" />
              </Button>
              
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1.5" />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white"
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
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth relative">
          
          {/* Floating Bulk Action Bar */}
          {selectedDocIds.length > 0 && (
            <div className="sticky top-0 z-20 mb-6 w-full animate-in slide-in-from-top-4 fade-in duration-200">
               <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 px-6 flex items-center justify-between border border-slate-700/50 backdrop-blur-xl">
                 <div className="flex items-center gap-4">
                   <div className="bg-blue-500/20 text-blue-400 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
                     {selectedDocIds.length}
                   </div>
                   <span className="font-medium text-sm">Seleccionados</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <Button onClick={selectAll} variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 text-xs font-medium px-3">
                     {selectedDocIds.length === filteredFiles.length ? "Deseleccionar Todos" : "Seleccionar Todos"}
                   </Button>
                   <div className="w-px h-4 bg-slate-700 mx-1" />
                   <Button onClick={() => setIsBulkMoveOpen(true)} variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 text-xs font-medium px-3 gap-2">
                     <Move className="h-3.5 w-3.5" />
                     Mover
                   </Button>
                   <Button onClick={() => setIsBulkDeleteOpen(true)} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs font-medium px-3 gap-2">
                     <Trash2 className="h-3.5 w-3.5" />
                     Eliminar
                   </Button>
                   <Button onClick={() => setSelectedDocIds([])} variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 rounded-full ml-2">
                     <X className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
            </div>
          )}

          {loadingFiles ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-[20px] border border-slate-100 dark:border-slate-800 p-5 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex-1 flex items-center justify-center">
                      <Skeleton className="h-16 w-16 rounded-2xl bg-slate-200/50 dark:bg-slate-700/50" />
                    </div>
                    <div className="space-y-3 mt-4">
                      <Skeleton className="h-3 w-full bg-slate-200/50 dark:bg-slate-700/50" />
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-2 w-12 bg-slate-200/50 dark:bg-slate-700/50 rounded-full" />
                        <Skeleton className="h-2 w-8 bg-slate-200/50 dark:bg-slate-700/50 rounded-full" />
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
                      <TableHead className="w-[40px] px-4"></TableHead>
                      <TableHead className="pl-0">Nombre</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Año Fiscal</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="w-[40px] px-4"><Skeleton className="h-4 w-4 rounded-[4px]" /></TableCell>
                        <TableCell className="pl-0"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-4 w-32" /></div></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-4 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : filteredFiles.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20">
                  {filteredFiles.map((file) => {
                    const isFolder = file.is_folder
                    const activeCat = FOLDER_CONFIG[currentCategory]
                    const FileIcon = isFolder ? Folder : getFileIcon(file.mime_type)
                    const iconStyle = isFolder ? activeCat.cardGradient : getFileStyle(file.mime_type)

                    return (
                      <ContextMenuWrapper key={file.id} file={file}>
                        <div
                          onClick={() => isFolder ? handleOpenFolder(file) : setPreviewFile(file)}
                          onDoubleClick={() => isFolder && handleOpenFolder(file)}
                          className={cn(
                            "group relative flex flex-col p-5 rounded-[20px] border transition-all cursor-pointer aspect-square justify-between shadow-sm hover:shadow-lg hover:-translate-y-1",
                            selectedDocIds.includes(file.id) ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" :
                            isFolder 
                              ? `bg-slate-50/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-800/50 hover:${activeCat.activeBorder}` 
                              : "bg-white dark:bg-[#0f1115] hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          )}
                        >
                          <div 
                            className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => toggleSelection(e, file.id)}
                          >
                             <div className={cn(
                               "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                               selectedDocIds.includes(file.id) ? "bg-blue-500 border-blue-500 opacity-100" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-400"
                             )}>
                               {selectedDocIds.includes(file.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                             </div>
                          </div>

                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                              <DropdownActionMenu file={file} />
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col items-center justify-center gap-4">
                            <div className={cn(
                              "h-16 w-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-sm border border-black/5 dark:border-white/5 bg-gradient-to-br",
                              iconStyle
                            )}>
                              <FileIcon className={cn("h-7 w-7", isFolder && "fill-current/20")} strokeWidth={isFolder ? 1.5 : 2} />
                            </div>
                            <p className="font-semibold text-[13px] text-slate-700 dark:text-slate-200 text-center line-clamp-2 px-2 leading-tight break-words w-full select-none group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                              {file.name}
                            </p>
                          </div>

                          {!isFolder && (
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium w-full pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/50">
                              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{formatFileSize(file.file_size)}</span>
                              <span>{file.fiscal_year || '-'}</span>
                            </div>
                          )}
                        </div>
                      </ContextMenuWrapper>
                    )
                  })}
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-950 mb-20">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-900/50">
                      <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                        <TableHead className="w-[40px] px-4"></TableHead>
                        <TableHead className="w-[50%] text-slate-500 font-semibold h-10 pl-0">Nombre</TableHead>
                        <TableHead className="text-slate-500 font-semibold h-10">Fecha</TableHead>
                        <TableHead className="text-slate-500 font-semibold h-10">Año Fiscal</TableHead>
                        <TableHead className="text-right text-slate-500 font-semibold h-10">Tamaño</TableHead>
                        <TableHead className="w-[50px] h-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFiles.map((file) => {
                        const activeCat = FOLDER_CONFIG[currentCategory]
                        const isFolder = file.is_folder
                        const FileIcon = isFolder ? Folder : getFileIcon(file.mime_type)
                        const iconStyle = isFolder ? activeCat.cardGradient : getFileStyle(file.mime_type)

                        return (
                          <TableRow
                            key={file.id}
                            className={cn(
                              "group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 border-slate-100 dark:border-slate-800 transition-colors",
                              selectedDocIds.includes(file.id) && "bg-blue-50/50 dark:bg-blue-900/20"
                            )}
                            onClick={() => isFolder ? handleOpenFolder(file) : setPreviewFile(file)}
                          >
                            <TableCell className="w-[40px] px-4" onClick={(e) => toggleSelection(e, file.id)}>
                             <div className={cn(
                               "h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors cursor-pointer",
                               selectedDocIds.includes(file.id) ? "bg-blue-500 border-blue-500" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-blue-400"
                             )}>
                               {selectedDocIds.includes(file.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                             </div>
                            </TableCell>
                            <TableCell className="font-medium py-3 pl-0">
                              <ContextMenuWrapper file={file}>
                                <div className="flex items-center gap-3.5">
                                  <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center border border-black/5 dark:border-white/5 bg-gradient-to-br shrink-0",
                                    iconStyle
                                  )}>
                                    <FileIcon className={cn("h-5 w-5", isFolder && "fill-current/20")} strokeWidth={isFolder ? 1.5 : 2} />
                                  </div>
                                  <span className="truncate max-w-[200px] sm:max-w-[300px] text-slate-700 dark:text-slate-200 font-medium group-hover:text-foreground transition-colors">{file.name}</span>
                                </div>
                              </ContextMenuWrapper>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(file.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                              {file.fiscal_year || '-'}
                            </TableCell>
                            <TableCell className="text-right text-xs text-slate-500 dark:text-slate-500 font-mono">
                              {isFolder ? '-' : formatFileSize(file.file_size)}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()} className="pr-4">
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
              className="h-full flex flex-col items-center justify-center w-full px-4"
              onClick={() => setIsUploadOpen(true)}
            >
              <div className="max-w-md w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/20 dark:to-slate-950 p-12 flex flex-col items-center text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/10 dark:hover:bg-blue-900/10 transition-all group shadow-sm">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                  <div className="h-24 w-24 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-800 group-hover:-translate-y-2 transition-transform duration-500 relative z-10 rotate-3 group-hover:rotate-6">
                    <Upload className="h-10 w-10 text-blue-500" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 mb-2">Nada por aquí aún</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-[280px]">
                  {typeFilter !== 'all' 
                    ? `No hay archivos de tipo ${typeFilter === 'pdf' ? 'PDF' : typeFilter === 'image' ? 'Imagen' : 'Tabla'} en esta sección.`
                    : "Arrastra tus archivos y carpetas directamente a esta caja o haz clic para buscarlos en tu computadora."}
                </p>
                
                <Button className="rounded-xl px-8 shadow-md hover:shadow-lg bg-blue-600 hover:bg-blue-700 pointer-events-none">
                  Subir Archivos
                </Button>
              </div>
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
      {/* Bulk Delete Dialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedDocIds.length} elementos?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminarán permanentemente los archivos y/o carpetas seleccionados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingAction}>Cancelar</AlertDialogCancel>
            <Button onClick={handleBulkDelete} disabled={loadingAction} className="bg-red-500 hover:bg-red-600 text-white">
               {loadingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
               Eliminar Definitivamente
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Move Dialog */}
      <Dialog open={isBulkMoveOpen} onOpenChange={setIsBulkMoveOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Mover {selectedDocIds.length} elementos</DialogTitle>
            <DialogDescription>Selecciona la carpeta de destino</DialogDescription>
          </DialogHeader>

          <div className="h-[300px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 p-2">
            <div className="space-y-1">
              <button
                onClick={() => setTargetFolderId(null)}
                className={cn(
                  "w-full flex items-center gap-2 p-2.5 rounded-lg text-sm transition-colors cursor-pointer",
                  targetFolderId === null ? "bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                )}
              >
                <FolderOpen className="h-4 w-4" />
                Inicio ({FOLDER_CONFIG[currentCategory]?.label})
              </button>

              {getSubfoldersOf(null).map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setTargetFolderId(folder.id)}
                  disabled={selectedDocIds.includes(folder.id)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2.5 rounded-lg text-sm transition-colors pl-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                    targetFolderId === folder.id ? "bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                  )}
                >
                  <Folder className="h-4 w-4" />
                  {folder.name}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsBulkMoveOpen(false)} disabled={loadingAction}>Cancelar</Button>
            <Button onClick={handleBulkMoveSubmit} disabled={loadingAction || targetFolderId === currentFolderId} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Mover Aquí"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
