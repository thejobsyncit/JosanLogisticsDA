import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://xewecflkzxgnczukaana.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld2VjZmxrenhnbmN6dWthYW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzAwNzcsImV4cCI6MjEwNTY0NjA3N30.iiZ1AyfZwbZ971n5i7539OpJwkpeXeG0rJom1vJ14F0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
