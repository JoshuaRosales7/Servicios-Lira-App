'use server'

import { createClient } from '@/lib/supabase/server'
import { createFolder } from '@/app/actions/documents'

export async function ensureClientFolderStructure(clientId: string, year: number, monthName: string): Promise<string | null> {
    const supabase = await createClient()

    try {
        // 1. Check/Create Year Folder
        // Does it exist?
        const { data: yearFolders } = await supabase
            .from('documents')
            .select('id')
            .eq('client_id', clientId)
            .eq('is_folder', true)
            .eq('name', year.toString())
            .is('parent_id', null)
            .single()

        let yearFolderId = yearFolders?.id

        if (!yearFolderId) {
            // Create Year Folder
            // We need a user to attribute this to? We can grab current user session or just use system logic.
            // But createFolder usually expects a record. 
            // Let's use clean direct insertion if we can, or reuse createFolder if it adds value (logging).
            // Reusing createFolder is safer for consistency, but we need file inputs.
            // For now, let's just insert directly to avoid circular dependency if createFolder uses other things.

            const { data: newYearFolder, error: yearError } = await supabase
                .from('documents')
                .insert({
                    client_id: clientId,
                    name: year.toString(),
                    is_folder: true,
                    parent_id: null,
                    document_type: 'other',
                    file_size: 0,
                    file_path: `${clientId}/${year}`, // Placeholder path for folder
                    uploaded_by: (await supabase.auth.getUser()).data.user?.id
                })
                .select('id')
                .single()

            if (yearError) {
                // Concurrency check: maybe it was created by another parallel upload?
                // Try fetching again?
                console.error("Error creating year folder", yearError)
                return null
            }
            yearFolderId = newYearFolder.id
        }

        // 2. Check/Create Month Folder (inside Year Folder)
        const { data: monthFolders } = await supabase
            .from('documents')
            .select('id')
            .eq('client_id', clientId)
            .eq('is_folder', true)
            .eq('name', monthName)
            .eq('parent_id', yearFolderId)
            .single()

        let monthFolderId = monthFolders?.id

        if (!monthFolderId) {
            const { data: newMonthFolder, error: monthError } = await supabase
                .from('documents')
                .insert({
                    client_id: clientId,
                    name: monthName,
                    is_folder: true,
                    parent_id: yearFolderId,
                    document_type: 'other',
                    file_size: 0,
                    file_path: `${clientId}/${year}/${monthName}`, // Placeholder path for folder
                    uploaded_by: (await supabase.auth.getUser()).data.user?.id
                })
                .select('id')
                .single()

            if (monthError) {
                console.error("Error creating month folder:", monthError.message, monthError.details, monthError.hint)
                return null
            }
            monthFolderId = newMonthFolder.id
        }

        return monthFolderId

    } catch (error) {
        console.error("Ensure Folder Structure Error:", error)
        return null
    }
}
