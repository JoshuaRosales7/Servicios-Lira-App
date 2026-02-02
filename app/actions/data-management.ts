'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity, notifyAdmins, notifyUser } from '@/app/actions/system'

// Helper to notify both admins and the client user involved
async function notifyParties(clientId: string, title: string, message: string, link: string) {
    const supabase = await createClient()

    // Get client's user_id
    const { data: client } = await supabase.from('clients').select('user_id').eq('id', clientId).single()

    // Notify Admins
    await notifyAdmins(title, message, 'info', link)

    // Notify Client User if exists
    if (client?.user_id) {
        await notifyUser(client.user_id, title, message, 'info', link)
    }
}

// --- Fiscal Data ---

export async function updateFiscalData(clientId: string, data: any) {
    const supabase = await createClient()

    // Check if exists
    const { data: existing } = await supabase.from('fiscal_data').select('id').eq('client_id', clientId).maybeSingle()

    let result
    if (existing) {
        result = await supabase.from('fiscal_data').update(data).eq('client_id', clientId).select().single()
    } else {
        result = await supabase.from('fiscal_data').insert({ ...data, client_id: clientId }).select().single()
    }

    if (result.error) {
        console.error('Error updating fiscal data:', result.error)
        throw new Error(result.error.message)
    }

    await logActivity(
        existing ? 'UPDATE_FISCAL_DATA' : 'CREATE_FISCAL_DATA',
        'fiscal_data',
        result.data.id,
        { client_id: clientId }
    )

    await notifyParties(
        clientId,
        'Datos Fiscales Actualizados',
        `Se han actualizado los datos fiscales.`,
        `/dashboard/clients/${clientId}`
    )

    revalidatePath(`/dashboard/clients/${clientId}`)
    return result.data
}

// --- Legal Data ---

export async function updateLegalData(clientId: string, data: any) {
    const supabase = await createClient()

    const { data: existing } = await supabase.from('legal_data').select('id').eq('client_id', clientId).maybeSingle()

    let result
    if (existing) {
        result = await supabase.from('legal_data').update(data).eq('client_id', clientId).select().single()
    } else {
        result = await supabase.from('legal_data').insert({ ...data, client_id: clientId }).select().single()
    }

    if (result.error) {
        throw new Error(result.error.message)
    }

    await logActivity(
        existing ? 'UPDATE_LEGAL_DATA' : 'CREATE_LEGAL_DATA',
        'legal_data',
        result.data.id,
        { client_id: clientId, representative: data.legal_representative }
    )

    await notifyParties(
        clientId,
        'Datos Legales Actualizados',
        `Se han actualizado los datos legales.`,
        `/dashboard/clients/${clientId}`
    )

    revalidatePath(`/dashboard/clients/${clientId}`)
    return result.data
}

// --- Accounting Data ---

export async function updateAccountingData(clientId: string, data: any) {
    const supabase = await createClient()

    const { data: existing } = await supabase.from('accounting_data').select('id').eq('client_id', clientId).maybeSingle()

    let result
    if (existing) {
        result = await supabase.from('accounting_data').update(data).eq('client_id', clientId).select().single()
    } else {
        result = await supabase.from('accounting_data').insert({ ...data, client_id: clientId }).select().single()
    }

    if (result.error) {
        throw new Error(result.error.message)
    }

    await logActivity(
        existing ? 'UPDATE_ACCOUNTING_DATA' : 'CREATE_ACCOUNTING_DATA',
        'accounting_data',
        result.data.id,
        { client_id: clientId }
    )

    await notifyParties(
        clientId,
        'Contabilidad Actualizada',
        `Se han actualizado los datos contables.`,
        `/dashboard/clients/${clientId}`
    )

    revalidatePath(`/dashboard/clients/${clientId}`)
    return result.data
}

// --- Banking Data ---

export async function updateBankAccount(id: string, clientId: string, data: any) {
    const supabase = await createClient()

    const { data: bank, error } = await supabase.from('banking_data').update(data).eq('id', id).select().single()

    if (error) throw new Error(error.message)

    await logActivity('UPDATE_BANK_ACCOUNT', 'banking_data', id, { bank: bank.bank })

    await notifyParties(clientId, 'Cuenta Bancaria Actualizada', `Cuenta de ${bank.bank} modificada.`, `/dashboard/clients/${clientId}`)

    revalidatePath(`/dashboard/clients/${clientId}`)
    return bank
}

export async function createBankAccount(clientId: string, data: any) {
    const supabase = await createClient()

    const { data: bank, error } = await supabase.from('banking_data').insert({ ...data, client_id: clientId }).select().single()

    if (error) throw new Error(error.message)

    await logActivity('ADD_BANK_ACCOUNT', 'banking_data', bank.id, { bank: bank.bank, last4: bank.account_number?.slice(-4) })

    await notifyParties(clientId, 'Cuenta Bancaria Agregada', `Nueva cuenta de ${bank.bank} agregada.`, `/dashboard/clients/${clientId}`)

    revalidatePath(`/dashboard/clients/${clientId}`)
    return bank
}

export async function deleteBankAccount(id: string, clientId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('banking_data').delete().eq('id', id)

    if (error) throw new Error(error.message)

    await logActivity('DELETE_BANK_ACCOUNT', 'banking_data', id, { client_id: clientId })

    await notifyParties(clientId, 'Cuenta Bancaria Eliminada', `Se ha eliminado una cuenta bancaria.`, `/dashboard/clients/${clientId}`)

    revalidatePath(`/dashboard/clients/${clientId}`)
    return true
}

// --- Notes ---

export async function createNote(clientId: string, title: string, content: string, userId: string) {
    const supabase = await createClient()

    const { data: note, error } = await supabase.from('notes').insert({
        client_id: clientId,
        user_id: userId,
        title,
        content
    }).select().single()

    if (error) throw new Error(error.message)

    await logActivity('CREATE_NOTE', 'note', note.id, { title })

    await notifyParties(clientId, 'Nueva Nota', `Nota creada: "${title}"`, `/dashboard/clients/${clientId}`)

    revalidatePath(`/dashboard/clients/${clientId}`)
    return note
}

export async function deleteNote(id: string, clientId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) throw new Error(error.message)

    await logActivity('DELETE_NOTE', 'note', id, { client_id: clientId })

    await notifyParties(clientId, 'Nota Eliminada', `Se ha eliminado una nota.`, `/dashboard/clients/${clientId}`)

    revalidatePath(`/dashboard/clients/${clientId}`)
    return true
}

export async function updateNote(id: string, clientId: string, title: string, content: string, isPinned: boolean) {
    const supabase = await createClient()

    const { data: note, error } = await supabase.from('notes').update({
        title,
        content,
        is_pinned: isPinned
    }).eq('id', id).select().single()

    if (error) throw new Error(error.message)

    await logActivity('UPDATE_NOTE', 'note', id, { title })

    await notifyParties(clientId, 'Nota Actualizada', `La nota "${title}" ha sido editada.`, `/dashboard/clients/${clientId}`)

    revalidatePath(`/dashboard/clients/${clientId}`)
    return note
}

export async function togglePinNote(id: string, isPinned: boolean, clientId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('notes').update({ is_pinned: isPinned }).eq('id', id)
    if (error) throw new Error(error.message)

    // Low priority, no need to spam notifs for pin toggle
    // await logActivity('TOGGLE_PIN_NOTE', 'note', id, { isPinned })

    revalidatePath(`/dashboard/clients/${clientId}`)
    return true
}
