import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Prioritize EAS Secrets (loaded during eas build)
// Fallback to EXPO_PUBLIC_ variables from .env (loaded during npx expo start)
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl) {
  console.error(
    'Supabase URL is not set. Check environment variables (SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL).'
  );
}
if (!supabaseAnonKey) {
  console.error(
    'Supabase Anon Key is not set. Check environment variables (SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
