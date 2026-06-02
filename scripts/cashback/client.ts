import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charge .env.local en priorité (override), puis .env
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) {
  throw new Error('SUPABASE_URL (ou VITE_SUPABASE_URL) manquant dans .env / .env.local')
}
if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant dans .env / .env.local')
}

/** Compte pour lequel on scrape (v1 : un seul compte). */
export const SCRAPE_USER_ID = process.env.SCRAPE_USER_ID
if (!SCRAPE_USER_ID) {
  throw new Error('SCRAPE_USER_ID manquant dans .env / .env.local')
}

/** Client service_role : contourne la RLS, à usage local uniquement. */
export const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
