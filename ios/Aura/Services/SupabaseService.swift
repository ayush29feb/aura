import Foundation
import Supabase

final class SupabaseService {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        guard let url = URL(string: Config.supabaseURL) else {
            fatalError("Invalid Supabase URL in Config.swift")
        }
        client = SupabaseClient(supabaseURL: url, supabaseKey: Config.supabaseAnonKey)
    }
}
