'use server'

import { createClient } from '@/lib/supabase/server'

export type ClientIdentity = {
    id: string
    legal_name: string
    commercial_name: string | null
    nit: string
}

export async function getAllClientsLight(): Promise<ClientIdentity[]> {
    const supabase = await createClient()

    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, legal_name, commercial_name, nit')
        .order('legal_name')

    if (error) {
        console.error('Error fetching all clients:', error)
        return []
    }

    return clients || []
}

export async function getClientsByNits(nits: string[]): Promise<Record<string, ClientIdentity>> {
    const supabase = await createClient()
    if (nits.length === 0) return {}

    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, legal_name, commercial_name, nit')
        .in('nit', nits)

    // Fallback search with 'ilike' for each if no exact matches? 
    // Doing strict match first for efficiency.

    if (error) {
        console.error('Error fetching clients by NIT:', error)
        return {}
    }

    const map: Record<string, ClientIdentity> = {}
    clients?.forEach(client => {
        map[client.nit] = {
            id: client.id,
            legal_name: client.legal_name,
            commercial_name: client.commercial_name,
            nit: client.nit
        }
    })

    return map
}
