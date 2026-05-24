import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://lioxymswiqefmgiuhaat.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpb3h5bXN3aXFlZm1naXVoYWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTM5OTcsImV4cCI6MjA5NTE4OTk5N30.pAn8x2ZKisYqDW_Uf8TCIOlsh8ZmaEVjmKC3MoNqJ84';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
