import { createServerClient } from '@/lib/supabase/server'

interface UploadFileParams {
  bucket: string
  path: string
  file: File | Blob
  contentType?: string
  upsert?: boolean
}

interface UploadResult {
  path: string
  url: string
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile({
  bucket,
  path,
  file,
  contentType,
  upsert = false,
}: UploadFileParams): Promise<UploadResult> {
  const supabase = await createServerClient()

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert,
  })

  if (error) {
    console.error('Failed to upload file:', error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path)

  return {
    path: data.path,
    url: publicUrl,
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    console.error('Failed to delete file:', error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600 // 1 hour default
): Promise<string> {
  const supabase = await createServerClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('Failed to create signed URL:', error)
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * List files in a bucket/folder
 */
export async function listFiles(bucket: string, folder?: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase.storage.from(bucket).list(folder)

  if (error) {
    console.error('Failed to list files:', error)
    throw new Error(`Failed to list files: ${error.message}`)
  }

  return data
}
