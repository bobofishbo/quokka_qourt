import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate URL format
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl);

if (!hasValidCredentials) {
  console.warn('⚠️ Missing or invalid Supabase environment variables.');
  console.warn('Please create frontend/.env with:');
  console.warn('  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.warn('  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.warn('Current values:', { 
    supabaseUrl: supabaseUrl || 'undefined', 
    hasKey: !!supabaseAnonKey,
    isValid: supabaseUrl ? isValidUrl(supabaseUrl) : false
  });
}

// Create Supabase client
let supabase: ReturnType<typeof createClient>;

if (!hasValidCredentials) {
  // Don't create a client if credentials are missing - it will cause network errors
  // Instead, we'll create a minimal mock that prevents crashes
  console.warn('⚠️ Running without Supabase - authentication will not work');
  
  // Create a client with a valid-looking URL to prevent immediate errors
  // But auth operations will fail gracefully
  try {
    supabase = createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder', {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: false, // Disable to prevent network calls
        persistSession: false,   // Disable to prevent storage operations
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.error('Error creating placeholder Supabase client:', error);
    throw error;
  }
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    throw error;
  }
}

export { supabase };
