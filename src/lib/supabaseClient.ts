// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kjeassimvftwhqjtfetl.supabase.co'

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZWFzc2ltdmZ0d2hxanRmZXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTcyNjcsImV4cCI6MjA2ODY5MzI2N30.XGzmifrZLay4sCk6ePXCCBmyPgXgJj7x2fD0jAA_0hU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
