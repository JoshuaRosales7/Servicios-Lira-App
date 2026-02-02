-- Add folder support to documents table
ALTER TABLE documents 
ADD COLUMN is_folder BOOLEAN DEFAULT false,
ADD COLUMN parent_id UUID REFERENCES documents(id) ON DELETE CASCADE;

-- Create index for faster queries on parent_id
CREATE INDEX idx_documents_parent_id ON documents(parent_id);
CREATE INDEX idx_documents_is_folder ON documents(is_folder);
