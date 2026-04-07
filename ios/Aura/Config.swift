import Foundation

/// Fill in your Supabase project credentials.
/// Get these from your Supabase dashboard → Project Settings → API
enum Config {
    /// e.g. "https://xxxxxxxxxxxx.supabase.co"
    static let supabaseURL = "YOUR_SUPABASE_URL"

    /// The public anon key — safe to include in the app
    static let supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"
}
