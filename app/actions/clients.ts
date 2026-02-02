'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import { logActivity, notifyAdmins, notifyUser } from '@/app/actions/system'

export async function createClientWithAccess(formData: any) {
    const supabaseAdmin = createAdminClient()
    const supabase = await createClient()

    const {
        legal_name,
        commercial_name,
        nit,
        dpi,
        email,
        phone,
        fiscal_address,
        municipality,
        department,
        person_type,
        fiscal_status,
        create_access,
        password
    } = formData

    try {
        let user_id = null

        if (create_access && email && password) {
            // 1. Create the user in Supabase Auth
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: legal_name || commercial_name }
            })

            if (authError) throw authError
            user_id = authUser.user.id

            // 2. Profile role
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ role: 'client', full_name: legal_name || commercial_name })
                .eq('id', user_id)

            if (profileError) throw profileError
        }

        // 3. Create the client record
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert({
                legal_name,
                commercial_name,
                nit,
                dpi,
                email,
                phone,
                fiscal_address,
                municipality,
                department,
                person_type,
                fiscal_status,
                user_id // Link
            })
            .select()
            .single()

        if (clientError) throw clientError

        // Log and Notify
        await logActivity(
            'CREATE_CLIENT',
            'client',
            client.id,
            { name: client.commercial_name || client.legal_name, has_access: !!user_id }
        )

        await notifyAdmins(
            'Nuevo Cliente Registrado',
            `Se ha registrado el cliente ${client.commercial_name || client.legal_name} con éxito.`,
            'success',
            `/dashboard/clients/${client.id}`
        )

        if (user_id) {
            await notifyUser(
                user_id,
                'Bienvenido a Servicios Lira',
                'Su cuenta ha sido creada exitosamente. Puede completar su perfil en la sección de Configuración.',
                'success'
            )
        }

        revalidatePath('/dashboard/clients')
        return { success: true, clientId: client.id }

    } catch (error: any) {
        console.error('Error in createClientWithAccess:', error)
        return { success: false, error: error.message }
    }
}

export async function sendPasswordReset(email: string) {
    const supabaseAdmin = createAdminClient()

    try {
        const { error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/reset-password` }
        })

        if (error) throw error

        await logActivity('RESET_PASSWORD_REQUEST', 'auth', null, { email })

        return { success: true }
    } catch (error: any) {
        console.error('Error sending reset email:', error)
        return { success: false, error: error.message }
    }
}

export async function revokeClientAccess(clientId: string, userId: string) {
    const supabaseAdmin = createAdminClient()

    try {
        const { error: clientError } = await supabaseAdmin
            .from('clients')
            .update({ user_id: null })
            .eq('id', clientId)

        if (clientError) throw clientError

        await logActivity('REVOKE_ACCESS', 'client', clientId, { user_id: userId })

        // Notify admin is sufficient as user can't login anymore
        await notifyAdmins('Acceso Revocado', `Se ha revocado el acceso al sistema para el cliente ${clientId}`, 'warning')

        revalidatePath(`/dashboard/clients/${clientId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Error revoking access:', error)
        return { success: false, error: error.message }
    }
}
