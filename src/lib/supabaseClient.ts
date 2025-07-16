// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ybdxetdcmlxkmtneuneb.supabase.co'
const supabaseKey = 'sb_publishable_d9n5nle_yV8j7_z9PuA-cA_ZvmgEmwW'

export const supabase = createClient(supabaseUrl, supabaseKey)
