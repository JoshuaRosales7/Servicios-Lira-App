'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getClientAuth(userId: string) {
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.getUserById(userId)
    if (error) return null
    return data.user
}
