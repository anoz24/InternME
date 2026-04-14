import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Initialize without failing immediately if environment variables are empty,
// so that the offline fallback continues to work
const supabaseClient =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const BUCKET = process.env.SUPABASE_BUCKET_NAME || 'internme-cvs';

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (!supabaseClient) throw new Error('Supabase is not configured.');

  const { data, error } = await supabaseClient.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return key; // return key so DB stores key, and download endpoint will generate fresh signed urls
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  if (!supabaseClient) throw new Error('Supabase is not configured.');

  const { data, error } = await supabaseClient.storage
    .from(BUCKET)
    .createSignedUrl(key, 3600);

  if (error || !data) throw error || new Error('Failed to generate signed url');
  return data.signedUrl;
}
