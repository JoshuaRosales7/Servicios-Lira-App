'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { createDocumentRecord } from '@/app/actions/documents'
import { ensureClientFolderStructure } from '@/app/actions/folder-structure'
import { getAllClientsLight, ClientIdentity } from '@/app/actions/import-helpers'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
    Upload, FileText, CheckCircle, AlertCircle, X, Loader2, FileUp, Filter, Edit2, Check
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Helpers
const MONTHS_ES: Record<string, number> = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
    'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
}

const DOCUMENT_TYPES: Record<string, string> = {
    'factura': 'invoice',
    'iva': 'declaration',
    'isr': 'declaration',
    'iso': 'declaration',
    'declaracion': 'declaration',
    'recibo': 'receipt',
    'constancia': 'receipt',
    'estado': 'financial_statement',
    'contrato': 'contract',
    'escritura': 'deed',
    'patente': 'patent'
}

type FileStatus = 'pending' | 'ready' | 'uploading' | 'success' | 'error'

interface ImportItem {
    id: string
    file: File
    status: FileStatus
    errorMsg?: string

    // Extracted & Editable
    extractedNit: string
    clientId: string | null // null if not matched

    fiscalYear: number
    month: number | null
    docType: string // internal type key
}

export function MassUploader() {
    const [items, setItems] = useState<ImportItem[]>([])
    const [isUploadProcessing, setIsUploadProcessing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Client Cache
    const [allClients, setAllClients] = useState<ClientIdentity[]>([])
    const [loadingClients, setLoadingClients] = useState(true)

    useEffect(() => {
        async function load() {
            setLoadingClients(true)
            const clients = await getAllClientsLight()
            setAllClients(clients)
            setLoadingClients(false)
        }
        load()
    }, [])

    const findClientByNit = useCallback((nit: string) => {
        if (!nit) return null
        const cleanNit = nit.replace(/[^0-9a-zA-Z]/g, '') // remove hyphens for fuzzy check if needed?
        return allClients.find(c =>
            c.nit === nit ||
            c.nit.replace(/-/g, '') === cleanNit ||
            c.nit === cleanNit // Handle various stored formats
        ) || null
    }, [allClients])

    // Parsing Logic
    const parseFile = useCallback((file: File): ImportItem => {
        const name = file.name

        // 1. NIT Extraction
        // Try to match "NIT" followed by numbers/hyphens until a delimiter or end
        // Regex: NIT-?([0-9A-Z-]+)(?:-PER|-COD|$) or simply robust capture
        let nit = ''
        // Strategy: Match "NIT-" followed by chars until a separator like "-PER", "-COD", "-NO", or end of string.
        const nitMatch = name.match(/NIT-?([0-9A-Z-]+?)(?=-PER|-COD|-NO|\s|$|\.[a-zA-Z]{3,4}$)/i)
            || name.match(/NIT-?([0-9A-Z-]+)/i) // Fallback

        if (nitMatch) {
            nit = nitMatch[1].replace(/-$/, '') // Trim trailing dash
        }

        // 2. Date Extraction
        // 2. Date Extraction
        // Support for "enero - diciembre de 2024" or just "2024" or "enero 2024"
        let fiscalYear = new Date().getFullYear()
        let month: number | null = null

        // Try to find a year like 202X or 203X
        const yearMatch = name.match(/\b(20\d{2})\b/)
        if (yearMatch) {
            fiscalYear = parseInt(yearMatch[1])
        }

        // Try to find a month name
        // "enero - diciembre" might match 'enero' first, which is fine, or we can look for the LAST month if it's a range?
        // Usually file date refers to the END of the period or the main month.
        // In "enero - diciembre de 2024", if we pick 'enero', it's Jan 2024. If 'diciembre', Dec 2024.
        // For annual reports 'Anual' might be better, or just pick the last month found?
        // Let's stick to the first found month for now, or refine if it's a range.
        const monthMatch = name.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i)

        if (monthMatch) {
            const mStr = monthMatch[1].toLowerCase()
            month = MONTHS_ES[mStr]
        } else if (name.toLowerCase().includes('annual') || name.toLowerCase().includes('anual')) {
            // If annual, maybe default to December or leave Month as null (Folder 'General')? 
            // Let's set it to null so it goes to 'General' or similar? 
            // Or user prefers explicit month? Use December for Annual?
            // Leaving null means it goes to 'general' folder which is safer for annual docs.
            month = null
        }

        // 3. Type Extraction
        let docType = 'other'
        const lowerName = name.toLowerCase()
        if (lowerName.includes('constancia')) docType = 'receipt' // Or 'other'? Usually Constancia ~ Certificate/Receipt
        else {
            for (const [key, type] of Object.entries(DOCUMENT_TYPES)) {
                if (lowerName.includes(key)) {
                    docType = type
                    break
                }
            }
        }

        // Try to match client immediately
        const client = findClientByNit(nit)

        return {
            id: Math.random().toString(36).substring(7),
            file,
            status: client ? 'ready' : 'error',
            errorMsg: client ? undefined : (nit ? 'Cliente no encontrado' : 'NIT falta'),
            extractedNit: nit || '',
            clientId: client?.id || null, // No client ID yet
            fiscalYear,
            month,
            docType
        }
    }, [findClientByNit])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (loadingClients) {
            toast.error("Cargando lista de clientes, intente en un momento...")
            return
        }

        const newItems = acceptedFiles.map(parseFile)
        setItems(prev => [...prev, ...newItems])
    }, [parseFile, loadingClients])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    const handleRemove = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id))
    }

    // Updaters
    const updateItem = (id: string, updates: Partial<ImportItem>) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item
            const newItem = { ...item, ...updates }

            // Re-validate status if vital fields change
            if (updates.clientId !== undefined || updates.extractedNit !== undefined) {
                // If we have a clientId, we are good?
                if (newItem.clientId) {
                    newItem.status = 'ready'
                    newItem.errorMsg = undefined
                } else {
                    // Try to re-lookup if NIT changed but no client selected manually
                    if (updates.extractedNit && !updates.clientId) {
                        const match = findClientByNit(updates.extractedNit)
                        if (match) {
                            newItem.clientId = match.id
                            newItem.status = 'ready'
                            newItem.errorMsg = undefined
                        } else {
                            newItem.status = 'error'
                            newItem.errorMsg = 'Cliente no encontrado'
                        }
                    } else if (!newItem.clientId) {
                        newItem.status = 'error'
                        newItem.errorMsg = 'Seleccione Cliente'
                    }
                }
            }
            return newItem
        }))
    }

    const handleUploadAll = async () => {
        const readyItems = items.filter(i => i.status === 'ready')
        if (readyItems.length === 0) return

        setIsUploading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error("Sesión no válida")
            setIsUploading(false)
            return
        }

        for (const item of readyItems) {
            if (!item.clientId) continue // Should be filtered out by 'ready' but type safety

            setItems(current => current.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i))

            try {
                const monthName = Object.entries(MONTHS_ES).find(([k, v]) => v === item.month)?.[0] || 'general'

                // 1. Ensure Folder Structure Exists
                const targetFolderId = await ensureClientFolderStructure(item.clientId, item.fiscalYear, monthName)

                if (!targetFolderId) {
                    throw new Error("Fallo al crear carpetas")
                }

                // 2. Upload to Storage
                const filePath = `${item.clientId}/${item.fiscalYear}/${monthName}/${Date.now()}-${item.file.name}`

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, item.file)

                if (uploadError) throw new Error(uploadError.message)

                // 3. Create DB Record
                await createDocumentRecord({
                    client_id: item.clientId,
                    uploaded_by: user.id,
                    name: item.file.name,
                    file_path: filePath,
                    mime_type: item.file.type,
                    file_size: item.file.size,
                    document_type: item.docType as any,
                    fiscal_year: item.fiscalYear,
                    is_folder: false,
                    parent_id: targetFolderId,
                    version: 1,
                    // TODO: Could store 'Month' metadata? Current schema uses created_at or fiscal_year.
                })

                setItems(current => current.map(i => i.id === item.id ? { ...i, status: 'success' } : i))

            } catch (e: any) {
                console.error(e)
                setItems(current => current.map(i => i.id === item.id ? { ...i, status: 'error', errorMsg: e.message } : i))
            }
        }

        setIsUploading(false)
        toast.success("Proceso de carga completado")
    }

    const pendingCount = items.filter(i => i.status === 'ready').length

    return (
        <div className="space-y-6">
            <div
                {...getRootProps()}
                className={cn(
                    "relative group border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ease-in-out",
                    isDragActive
                        ? "border-primary bg-primary/5 scale-[1.01] shadow-lg"
                        : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30 hover:shadow-md bg-gradient-to-br from-background to-muted/20"
                )}
            >
                <input {...getInputProps()} />

                <div className={cn(
                    "p-5 rounded-full shadow-sm mb-6 transition-all duration-300",
                    isDragActive ? "bg-primary text-primary-foreground" : "bg-card text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground"
                )}>
                    <FileUp className="h-10 w-10" />
                </div>

                <h3 className="text-xl font-bold tracking-tight mb-2">
                    {loadingClients ? 'Iniciando sistema...' : 'Arrastra tus documentos aquí'}
                </h3>

                <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
                    O haz clic para explorar. Puedes subir múltiples archivos a la vez. <br />
                    <span className="opacity-70">El sistema procesará automáticamente los metadatos.</span>
                </p>

                <div className="flex gap-4">
                    <div className="px-3 py-1 bg-background/50 border rounded text-[10px] font-mono text-muted-foreground shadow-sm">
                        NIT-123456...
                    </div>
                    <div className="px-3 py-1 bg-background/50 border rounded text-[10px] font-mono text-muted-foreground shadow-sm">
                        enero 2025...
                    </div>
                </div>
            </div>

            {items.length > 0 && (
                <div className="border rounded-xl bg-card shadow-sm overflow-hidden text-sm">
                    <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Archivos en Cola ({items.length})</h3>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setItems([])}>Limpiar</Button>
                            <Button
                                size="sm"
                                onClick={handleUploadAll}
                                disabled={isUploading || pendingCount === 0}
                                className="font-bold min-w-[140px]"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Subir {pendingCount}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Archivo</TableHead>
                                    <TableHead className="w-[120px]">NIT (Detectado)</TableHead>
                                    <TableHead className="w-[250px]">Cliente Asignado</TableHead>
                                    <TableHead className="w-[120px]">Periodo</TableHead>
                                    <TableHead className="w-[140px]">Tipo</TableHead>
                                    <TableHead className="text-right w-[100px]">Estado</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium align-top">
                                            <div className="flex flex-col gap-1">
                                                <span className="truncate max-w-[180px] text-xs font-semibold" title={item.file.name}>{item.file.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{(item.file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        </TableCell>

                                        {/* Editable NIT */}
                                        <TableCell className="align-top">
                                            <Input
                                                value={item.extractedNit}
                                                onChange={(e) => updateItem(item.id, { extractedNit: e.target.value })}
                                                className="h-8 text-xs font-mono w-full"
                                                placeholder="NIT..."
                                            />
                                        </TableCell>

                                        {/* Client Selector */}
                                        <TableCell className="align-top">
                                            <Select
                                                value={item.clientId || "none"}
                                                onValueChange={(val) => updateItem(item.id, { clientId: val === "none" ? null : val })}
                                            >
                                                <SelectTrigger className={cn("h-8 text-xs w-full text-left truncate", !item.clientId && "text-destructive border-destructive")}>
                                                    <SelectValue placeholder="Seleccionar Cliente" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    <SelectItem value="none" className="text-muted-foreground text-xs">-- Sin Asignar --</SelectItem>
                                                    {allClients.map(c => (
                                                        <SelectItem key={c.id} value={c.id} className="text-xs">
                                                            <span className="font-bold">{c.nit}</span> - {c.commercial_name || c.legal_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {!item.clientId && (
                                                <div className="mt-1 flex items-center text-[10px] text-destructive gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    <span>Requerido</span>
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Period (Month/Year) */}
                                        <TableCell className="align-top">
                                            <div className="flex gap-1">
                                                <Select
                                                    value={item.month?.toString() || "0"}
                                                    onValueChange={(val) => updateItem(item.id, { month: val === "0" ? null : parseInt(val) })}
                                                >
                                                    <SelectTrigger className="h-8 text-xs w-[75px]">
                                                        <SelectValue placeholder="Mes" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0" className="text-xs">--</SelectItem>
                                                        {Object.entries(MONTHS_ES).map(([k, v]) => (
                                                            <SelectItem key={v} value={v.toString()} className="capitalize text-xs">{k}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Input
                                                    value={item.fiscalYear}
                                                    onChange={(e) => updateItem(item.id, { fiscalYear: parseInt(e.target.value) || new Date().getFullYear() })}
                                                    className="h-8 text-xs w-[70px]"
                                                    type="number"
                                                />
                                            </div>
                                        </TableCell>

                                        {/* Doc Type */}
                                        <TableCell className="align-top">
                                            <Select
                                                value={item.docType}
                                                onValueChange={(val) => updateItem(item.id, { docType: val })}
                                            >
                                                <SelectTrigger className="h-8 text-xs w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries({
                                                        invoice: 'Factura',
                                                        declaration: 'Declaración',
                                                        receipt: 'Recibo',
                                                        financial_statement: 'Est. Financiero',
                                                        contract: 'Contrato',
                                                        deed: 'Escritura',
                                                        patent: 'Patente',
                                                        other: 'Otro'
                                                    }).map(([k, label]) => (
                                                        <SelectItem key={k} value={k} className="text-xs">{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        <TableCell className="text-right align-top pt-2">
                                            {item.status === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500 ml-auto" />}
                                            {item.status === 'error' && <AlertCircle className="h-5 w-5 text-destructive ml-auto" />}
                                            {item.status === 'ready' && <div className="h-2 w-2 rounded-full bg-primary ml-auto mt-1.5" title="Listo para subir" />}
                                            {item.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />}
                                        </TableCell>

                                        <TableCell className="align-top">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(item.id)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    )
}
