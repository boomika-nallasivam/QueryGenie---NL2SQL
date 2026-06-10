import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://akbseyaqihxxgcwhidgf.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYnNleWFxaWh4eGdjd2hpZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTg5OTMsImV4cCI6MjA5MjQzNDk5M30.nJxOi_mCC_85b8Lt8-3katYsTfV2CunMrbMxdgevogw"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)