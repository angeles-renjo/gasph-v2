import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Directly use EXPO_PUBLIC_ variables intended for client-side runtime access
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Runtime checks specifically for the required EXPO_PUBLIC_ variables
if (!supabaseUrl) {
  const errorMessage =
    'Supabase URL is not set. Check EXPO_PUBLIC_SUPABASE_URL in .env and EAS Secrets.';
  console.error(errorMessage);
  // Throwing an error makes the crash reason clearer in logs
  throw new Error(errorMessage);
}
if (!supabaseAnonKey) {
  const errorMessage =
    'Supabase Anon Key is not set. Check EXPO_PUBLIC_SUPABASE_ANON_KEY in .env and EAS Secrets.';
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Simplified logging
console.log('--- Supabase Client Init ---');
console.log('Using URL (EXPO_PUBLIC_):', supabaseUrl ? '******' : 'NOT FOUND'); // Mask URL
console.log(
  'Using Anon Key (EXPO_PUBLIC_):',
  supabaseAnonKey ? '******' : 'NOT FOUND'
);
console.log('----------------------------');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
