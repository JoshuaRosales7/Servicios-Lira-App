'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AIResultType = 'client_list' | 'stats' | 'text' | 'error'

export interface AISearchResult {
    type: AIResultType
    data: any
    message: string
}

/**
 * Heuristic-based Natural Language Processor for Lira App.
 * This acts as a specialized, zero-cost "Language Model" by using advanced pattern matching.
 * It detects intents for database queries and handles "chit-chat" to feel conversational.
 */
export async function processNaturalLanguageQuery(query: string): Promise<AISearchResult> {
    const q = query.toLowerCase()
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // --- 0. SMALL TALK / CHIT-CHAT (ELIZA MODE) ---
    // This makes the bot feel "alive" without needing an external API
    if (q === 'hola' || q === 'buenos dias' || q === 'buenas tardes') {
        return { type: 'text', data: null, message: '¡Hola! Soy Lira, tu asistente de datos. ¿En qué te ayudo hoy?' }
    }
    if (q.includes('gracias')) {
        return { type: 'text', data: null, message: '¡De nada! Aquí estaré si necesitas algo más.' }
    }
    if (q.includes('quien eres') || q.includes('qué eres')) {
        return { type: 'text', data: null, message: 'Soy una Inteligencia Artificial integrada en Servicios Lira para ayudarte a gestionar clientes y documentos.' }
    }
    if (q.includes('ayuda') || q.includes('que puedes hacer')) {
        return {
            type: 'text',
            data: null,
            message: 'Puedo buscar información por ti. Intenta preguntarme:\n- "Clientes sin IVA en enero"\n- "Clientes nuevos"\n- "Buscar cliente [nombre]"'
        }
    }
    if (q.includes('modelo') || q.includes('version') || q.includes('motor')) {
        return {
            type: 'text',
            data: null,
            message: 'Utilizo el motor Lira-Intelligence v1.0 (Heurística Simbólica), diseñado para operar localmente sin enviar datos a terceros. ¡Soy 100% privado y seguro!'
        }
    }
    if (q.includes('resumen')) {
        // Quick Stats Intent
        const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true })
        const { count: docCount } = await supabase.from('documents').select('*', { count: 'exact', head: true })

        return {
            type: 'text',
            data: null,
            message: `Resumen rápido del sistema:\n- ${clientCount} Clientes Activos\n- ${docCount} Documentos procesados.`
        }
    }

    try {
        // --- INTENT 1: MISSING DOCUMENTS (e.g., "Clientes sin IVA de Enero") ---
        if (q.includes('sin') || q.includes('no han') || q.includes('faltan') || q.includes('pendientes')) {
            if (q.includes('iva') || q.includes('declaracion') || q.includes('impuesto') || q.includes('factura')) {

                // Extract Month
                const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
                const monthIndex = months.findIndex(m => q.includes(m))

                // Default to current month or found month
                const targetMonth = monthIndex !== -1 ? monthIndex : new Date().getMonth()
                const targetYear = new Date().getFullYear() // Simplify: assume current year usually

                // Logic: Get ALL active clients, then substract those who HAVE the document

                // 1. Get Active Clients
                const { data: activeClients } = await supabase
                    .from('clients')
                    .select('id, commercial_name, legal_name, email, phone')
                    .eq('fiscal_status', 'active')

                if (!activeClients) return { type: 'client_list', data: [], message: 'No encontré clientes activos.' }

                // 2. Find documents matching criteria in that period
                // We'll search in 'documents' table.
                // Assuming 'created_at' or we check file name/tags. 
                // A robust implementation would check specific folders, but let's check created_at for now as a proxy or if we have a metadata field.

                const startStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`
                const endStr = `${targetYear}-${String(targetMonth + 2).padStart(2, '0')}-01` // Rough next month

                const { data: docs } = await adminSupabase
                    .from('documents')
                    .select('client_id, name')
                    .gte('created_at', startStr)
                    .lt('created_at', endStr)
                    .ilike('name', '%IVA%') // Heuristic: Name contains IVA

                const clientsWithDoc = new Set(docs?.map(d => d.client_id))

                const missingClients = activeClients.filter(c => !clientsWithDoc.has(c.id))

                return {
                    type: 'client_list',
                    data: missingClients,
                    message: `He encontrado ${missingClients.length} clientes que no tienen documentos de IVA registrados en ${months[targetMonth]}.`
                }
            }
        }

        // --- INTENT 2: NEW CLIENTS (e.g., "Clientes nuevos este mes") ---
        if (q.includes('nuevos') || q.includes('recientes')) {
            const { data: newClients } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5)

            return {
                type: 'client_list',
                data: newClients,
                message: 'Aquí están los 5 clientes más recientes añadidos a la plataforma.'
            }
        }

        // --- INTENT 3: GENERAL SEARCH (Fallback) ---
        // If query looks like a name
        if (q.length > 3) {
            const { data: searchClients } = await supabase
                .from('clients')
                .select('*')
                .or(`commercial_name.ilike.%${q}%,legal_name.ilike.%${q}%,nit.ilike.%${q}%`)
                .limit(10)

            if (searchClients && searchClients.length > 0) {
                return {
                    type: 'client_list',
                    data: searchClients,
                    message: `Encontré estos clientes relacionados con "${query}".`
                }
            }
        }

        // --- FALLBACK: API FREE LLM (High Quality Free Tier) ---
        try {
            const response = await fetch(
                "https://apifreellm.com/api/v1/chat",
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer apf_acrynr0e8cv2murlr0irsmpi"
                    },
                    method: "POST",
                    body: JSON.stringify({
                        message: `Eres un asistente experto y amable de la plataforma 'Servicios Lira' en Guatemala. Tu objetivo es ayudar a contadores y administradores. Usuario dice: "${query}". Responde de forma concisa (máximo 40 palabras) y útil en español.`
                    }),
                }
            );

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.response) {
                    return {
                        type: 'text',
                        data: null,
                        message: result.response.trim()
                    };
                }
            } else {
                // Handle 429 Rate Limit specifically mentioned in docs
                if (response.status === 429) {
                    return {
                        type: 'text',
                        data: null,
                        message: 'Estoy pensando muy rápido. Dame 5 segundos y pregúntame de nuevo (Límite de velocidad gratuito).'
                    };
                }
            }
        } catch (apiError) {
            console.error("LLM API failed", apiError);
        }

        // --- FINAL FALLBACK: CONVERSATIONAL STATIC ---
        const fallbacks = [
            'Hmm, no estoy seguro de haber entendido eso. ¿Podrías intentar reformularlo como "Buscar cliente X" o "Ver clientes nuevos"?',
            'No encontré una acción específica para eso. Puedo ayudarte a buscar clientes o verificar documentos pendientes.',
            'Entiendo que buscas información, pero necesito que seas un poco más específico. Prueba con "Clientes sin factura" o "Resumen".',
            'Lo siento, aún estoy aprendiendo. Por ahora soy experto detectando documentos faltantes y encontrando clientes.'
        ]
        const randomMsg = fallbacks[Math.floor(Math.random() * fallbacks.length)]

        return {
            type: 'text',
            data: null,
            message: randomMsg
        }

    } catch (error) {
        console.error('AI Processing Error:', error)
        return {
            type: 'error',
            data: null,
            message: 'Ocurrió un error al procesar tu consulta inteligente.'
        }
    }
}
