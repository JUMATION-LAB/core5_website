import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** null when the environment variables are missing: the site then runs in offline preview mode. */
export const sb: SupabaseClient | null = url && key ? createClient(url, key) : null;

export type Bucket = 'public-media' | 'research-docs';

/** Public URL for a file stored in a public bucket, or '' when there is no file. */
export const fileUrl = (bucket: Bucket, path?: string | null): string =>
  sb && path ? sb.storage.from(bucket).getPublicUrl(path).data.publicUrl : '';
