'use server'

import { createClient } from '@/lib/supabase/server'
import { Document } from '@/lib/types'

import { logActivity, notifyAdmins, notifyUser } from '@/app/actions/system'

export async function getDocumentsByCategory(clientId: string, category: string, parentId: string | null = null): Promise<Document[]> {
    const supabase = await createClient()

    let query = supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)

    // For folders, we often group them under 'other' or specific types. 
    // If we are navigating the structure created by Mass Import (Year/Month), those folders are 'other'.
    // So if parentId is provided, we just want children in that folder regardless of type (or maybe filtered?)
    // If parentId is null (Root), we want documents of 'category' OR root folders (which are usually years)

    if (parentId) {
        // Inside a folder, we show everything? Or still filter by category? 
        // The Mass Import puts files into Month folders. Those files HAVE the category. 
        // The folders themselves (Year/Month) are 'other'.

        // If we are strictly filtering by 'category', we won't see the 'other' folders that contain our files.
        // Strategy: 
        // 1. If looking for files of 'invoice', we need to see the '2025' folder (type=other) 
        // to traverse into it.

        query = query.eq('parent_id', parentId)
        // If inside a folder, we likely want to see the files of the requested type, AND any subfolders?
        // But our structure is Year -> Month -> Files.

        // Simplified Logic: 
        // Always show all folders? 
        // Or filter documents by type, but allow ALL folders?
        query = query.or(`document_type.eq.${category},is_folder.eq.true`)

    } else {
        // Root Level
        query = query.is('parent_id', null)
        // Show files of specific category AND all top-level folders?
        // Or only folders that "might" contain this category?
        // For now, let's show all root folders to allow navigation.
        query = query.or(`document_type.eq.${category},is_folder.eq.true`)
    }

    query = query
        .order('is_folder', { ascending: false })
        .order('created_at', { ascending: false })
    // Logic handled above


    const { data, error } = await query

    if (error) {
        console.error('Error fetching documents:', error)
        return []
    }

    return data || []
}

export async function getDocumentCounts(clientId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('documents')
        .select('document_type')
        .eq('client_id', clientId)
        .eq('is_folder', false)

    if (error) {
        console.error('Error fetching document counts:', error)
        return {}
    }

    const counts: Record<string, number> = {}
    data?.forEach(doc => {
        const type = doc.document_type || 'other'
        counts[type] = (counts[type] || 0) + 1
    })

    return counts
}

export async function getAllFolders(clientId: string, category: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('documents')
        .select('id, name, parent_id')
        .eq('client_id', clientId)
        .eq('document_type', category)
        .eq('is_folder', true)
        .order('name')

    if (error) return []
    return data
}

export async function createDocumentRecord(docData: Partial<Document>) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('documents')
        .insert(docData)
        .select()
        .single()

    if (error) throw new Error(error.message)

    try {
        await logActivity(
            'UPLOAD_DOCUMENT',
            'document',
            data.id,
            { name: data.name, size: data.file_size, type: data.mime_type }
        )

        // Notify Admins
        const { data: client } = await supabase.from('clients').select('legal_name, commercial_name').eq('id', data.client_id).single()
        const clientName = client?.commercial_name || client?.legal_name || 'Un cliente'

        await notifyAdmins(
            'Nuevo Documento',
            `${clientName} ha subido el documento "${data.name}"`,
            'info',
            `/dashboard/clients/${data.client_id}`
        )
    } catch (e) {
        console.error('Error logging/notifying:', e)
    }

    return data
}

export async function createFolder(folderData: Partial<Document>) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('documents')
        .insert(folderData)
        .select()
        .single()

    if (error) throw new Error(error.message)

    // Log Activity only (no need to spam notifications for folders typically)
    await logActivity('CREATE_FOLDER', 'folder', data.id, { name: data.name })
    return data
}

export async function deleteDocument(documentId: string, isFolder: boolean) {
    const supabase = await createClient()

    // Get info before delete for logging
    const { data: doc } = await supabase.from('documents').select('name, client_id').eq('id', documentId).single()

    const { error } = await supabase.from('documents').delete().eq('id', documentId)
    if (error) throw new Error(error.message)

    if (doc) {
        await logActivity(
            isFolder ? 'DELETE_FOLDER' : 'DELETE_DOCUMENT',
            'document',
            documentId,
            { name: doc.name }
        )
    }

    return true
}

export async function renameDocument(documentId: string, newName: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('documents')
        .update({ name: newName })
        .eq('id', documentId)

    if (error) throw new Error(error.message)

    await logActivity('RENAME_DOCUMENT', 'document', documentId, { new_name: newName })
    return true
}

export async function moveDocument(documentId: string, newParentId: string | null) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('documents')
        .update({ parent_id: newParentId })
        .eq('id', documentId)

    if (error) throw new Error(error.message)

    await logActivity('MOVE_DOCUMENT', 'document', documentId, { target_folder: newParentId })
    return true
}

export interface FetchDocumentsParams {
    limit?: number
    offset?: number
    search?: string
    type?: string
    sort?: string
}

export async function getAllDocuments({
    limit = 20,
    offset = 0,
    search,
    type,
    sort = 'recent'
}: FetchDocumentsParams = {}) {
    const supabase = await createClient()

    let query = supabase
        .from('documents')
        .select(`
            *,
            clients (id, legal_name, commercial_name)
        `, { count: 'exact' })

    // Apply sorting
    switch (sort) {
        case 'oldest':
            query = query.order('created_at', { ascending: true })
            break
        case 'az':
            query = query.order('name', { ascending: true })
            break
        case 'za':
            query = query.order('name', { ascending: false })
            break
        case 'size_desc':
            query = query.order('file_size', { ascending: false })
            break
        case 'size_asc':
            query = query.order('file_size', { ascending: true })
            break
        case 'recent':
        default:
            query = query.order('created_at', { ascending: false })
            break
    }

    // Apply pagination range AFTER sorting to ensure correct window
    query = query.range(offset, offset + limit - 1)

    // Filter by type/category
    if (type && type !== 'all') {
        query = query.eq('document_type', type)
    }

    // Filter by search term
    if (search) {
        query = query.ilike('name', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching global documents:', error)
        return { documents: [], count: 0 }
    }

    return { documents: data || [], count: count || 0 }
}
