-- МИГРАЦИЯ ДЛЯ ДОБАВЛЕНИЯ КОЛОНОК В ТАБЛИЦУ PERSONALITIES
-- Выполните этот скрипт в Supabase Dashboard -> SQL Editor

-- 1. Добавить колонку openai_assistant_id
ALTER TABLE personalities 
ADD COLUMN IF NOT EXISTS openai_assistant_id TEXT;

-- 2. Добавить колонку files как JSONB массив
ALTER TABLE personalities 
ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;

-- 3. Добавить колонку file_instruction
ALTER TABLE personalities 
ADD COLUMN IF NOT EXISTS file_instruction TEXT;

-- 4. Создать индекс для assistant_id для быстрого поиска
CREATE INDEX IF NOT EXISTS personalities_assistant_id_idx 
ON personalities(openai_assistant_id);

-- 5. Создать GIN индекс для JSONB queries на files
CREATE INDEX IF NOT EXISTS personalities_files_gin_idx 
ON personalities USING GIN (files);

-- 6. Добавить constraint на максимум 20 файлов
ALTER TABLE personalities 
ADD CONSTRAINT IF NOT EXISTS personalities_files_limit 
CHECK (jsonb_array_length(files) <= 20);

-- 7. Обновить существующие записи, установив files как пустой массив
UPDATE personalities 
SET files = '[]'::jsonb 
WHERE files IS NULL;

-- Проверить результат
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'personalities' 
AND column_name IN ('openai_assistant_id', 'files', 'file_instruction')
ORDER BY column_name;