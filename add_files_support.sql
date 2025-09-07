-- Add files support to personalities table
-- This migration adds JSONB fields for multiple files and file instructions

-- Add files as JSONB array and file_instruction field
ALTER TABLE personalities 
ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS file_instruction TEXT;

-- Create GIN index for JSONB queries on files
CREATE INDEX IF NOT EXISTS personalities_files_gin_idx ON personalities USING GIN (files);

-- Add constraint to limit maximum 20 files per personality
ALTER TABLE personalities 
ADD CONSTRAINT IF NOT EXISTS personalities_files_limit 
CHECK (jsonb_array_length(files) <= 20);

-- Update any existing personalities to have empty files array if NULL
UPDATE personalities 
SET files = '[]' 
WHERE files IS NULL;