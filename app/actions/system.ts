'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Log an activity in the system for audit purposes.
 */
export async function logActivity(
    action: string,
    resourceType: string,
    resourceId: string | null,
    details: any = {}
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Use Admin Client to bypass RLS for logging
    const adminClient = createAdminClient()

    try {
        const { error } = await adminClient.from('activity_logs').insert({
            actor_id: user.id,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details
        })

        if (error) {
            console.error('Error logging activity:', error)
        }
    } catch (error) {
        console.error('Failed to log activity:', error)
    }
}

/**
 * Send a notification to a specific user.
 */
export async function notifyUser(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    link: string | null = null,
    actorId?: string | null
) {
    const adminClient = createAdminClient()
    let finalActorId = actorId

    if (!finalActorId) {
        // Try to identify current user if not provided
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) finalActorId = user.id
    }

    try {
        const { error } = await adminClient.from('notifications').insert({
            user_id: userId,
            actor_id: finalActorId,
            title,
            message,
            type,
            link
        })

        if (error) {
            console.error('Error creating notification:', error)
        }
    } catch (error) {
        console.error('Failed to notify user:', error)
    }
}

/**
 * Send a notification to all administrators.
 * Useful for when a client performs an action.
 */
export async function notifyAdmins(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    link: string | null = null,
    actorId?: string | null
) {
    const adminClient = createAdminClient()
    let finalActorId = actorId

    if (!finalActorId) {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) finalActorId = user.id
    }

    try {
        // 1. Get all admin IDs (Bypass RLS to ensure we find them all)
        const { data: admins, error: fetchError } = await adminClient
            .from('profiles')
            .select('id')
            .eq('role', 'admin')

        if (fetchError || !admins || admins.length === 0) return

        // 2. Create notification objects for each admin
        const notifications = admins.map(admin => ({
            user_id: admin.id,
            actor_id: finalActorId,
            title,
            message,
            type,
            link
        }))

        // 3. Bulk insert
        const { error: insertError } = await adminClient
            .from('notifications')
            .insert(notifications)

        if (insertError) {
            console.error('Error notifying admins:', insertError)
        }
    } catch (error) {
        console.error('Failed to notify admins:', error)
    }
}

/**
 * Get the current user's unread notifications count.
 */
export async function getUnreadNotificationCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

    return count || 0
}

/**
 * Get current user's notifications.
 */
export async function getNotifications(limit = 20) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Map the profile join alias if needed, 
    // but supabase-js usually returns joins nested if we ask for it.
    // We need to fetch actor details.
    // RLS on profiles should allow reading public parts or basic info.
    // Assuming profiles are readable by authenticated users (common pattern).
    const { data, error } = await supabase
        .from('notifications')
        .select(`
            *,
            actor_profile:profiles!actor_id (
                full_name,
                role
            )
        `)
        .eq('user_id', user.id)
        .eq('is_read', false) // Only fetch unread notifications per user request
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error("Error fetching notifications", error)
        return []
    }

    return data || []
}

/**
 * Mark a notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

    revalidatePath('/dashboard')
}

/**
 * Mark all notifications as read for current user.
 */
export async function markAllNotificationsAsRead() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

    revalidatePath('/dashboard')
}
/**
 * Fetch activity logs for the admin dashboard.
 */
export interface FetchLogsParams {
    limit?: number
    offset?: number
    search?: string
    action?: string
    resourceType?: string
}

/**
 * Fetch activity logs for the admin dashboard.
 */
export async function getActivityLogs({
    limit = 50,
    offset = 0,
    search,
    action,
    resourceType
}: FetchLogsParams = {}) {
    const supabase = await createAdminClient()

    let query = supabase
        .from('activity_logs')
        .select(`
            *,
            profiles:actor_id (
                full_name,
                role
            )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (action && action !== 'all') {
        query = query.eq('action', action)
    }

    if (resourceType && resourceType !== 'all') {
        query = query.eq('resource_type', resourceType)
    }

    // Basic textual search on details if provided
    if (search) {
        // cast details to text for searching
        query = query.textSearch('details', search, {
            type: 'websearch',
            config: 'english'
        })
    }

    const { data, error, count } = await query

    if (error) {
        console.error("Error fetching activity logs:", error)
        return { logs: [], count: 0 }
    }

    return { logs: data || [], count: count || 0 }
}

/**
 * Fetch activity logs specifically for a client context.
 * This filters logs where the resource is the client itself, or related resources (docs, notes)
 * that belong to the client (checking details->client_id).
 */
export async function getClientActivityLogs(clientId: string, limit = 20) {
    const supabase = await createAdminClient()

    // Query for:
    // 1. Direct actions on the client (resource_type='client' AND resource_id=id)
    // 2. Actions where details->client_id matches (e.g. document uploads)

    // Note: detailed OR logic with filters can be complex in Supabase JS SDK without raw SQL.
    // For now, we'll try a flexible filter on details or resource_id.
    // Since 'or' syntax requires fully specified filters.

    // Constructing the OR string:
    // resource_id.eq.clientId, details->>client_id.eq.clientId

    const { data, error } = await supabase
        .from('activity_logs')
        .select(`
            *,
            profiles:actor_id (
                full_name,
                role
            )
        `)
        .or(`resource_id.eq.${clientId},details->>client_id.eq.${clientId}`)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error("Error fetching client activity logs:", error)
        return []
    }

    return data || []
}
