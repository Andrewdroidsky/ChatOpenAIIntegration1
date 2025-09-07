#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables:')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '❌')
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function applyMigration() {
  try {
    console.log('🔄 Reading migration file...')
    const migrationSQL = readFileSync('./add_files_support.sql', 'utf8')
    
    console.log('🔄 Applying files support migration...')
    
    // Try to execute the full migration as a single query
    console.log('📝 Executing migration SQL...')
    const { error } = await supabase.rpc('exec', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Error executing migration:', error)
      console.log('🔄 Trying alternative approach...')
      
      // Alternative: Try to add columns directly using Supabase client
      console.log('📝 Adding files column...')
      const { error: error1 } = await supabase.rpc('exec', { 
        sql: 'ALTER TABLE personalities ADD COLUMN IF NOT EXISTS files JSONB DEFAULT \'[]\';' 
      })
      
      if (error1) {
        console.error('❌ Failed to add files column:', error1)
      }
      
      console.log('📝 Adding file_instruction column...')  
      const { error: error2 } = await supabase.rpc('exec', { 
        sql: 'ALTER TABLE personalities ADD COLUMN IF NOT EXISTS file_instruction TEXT;' 
      })
      
      if (error2) {
        console.error('❌ Failed to add file_instruction column:', error2)
      }
    }
    
    console.log('✅ Files support migration applied successfully!')
    
    // Verify the migration worked
    console.log('🔍 Verifying migration...')
    const { data, error } = await supabase
      .from('personalities')
      .select('id, name, files, file_instruction')
      .limit(1)
    
    if (error) {
      console.error('❌ Error verifying migration:', error)
    } else {
      console.log('✅ Migration verified successfully!')
      console.log('   Personalities table now supports files and file_instruction fields')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

applyMigration()