import SwiftUI

@main
struct AuraApp: App {
    @StateObject private var authService = AuthService()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authService)
                .preferredColorScheme(.dark)
                .onOpenURL { url in
                    // Handle OAuth callback from Google sign-in
                    Task {
                        try? await SupabaseService.shared.client.auth.session(from: url)
                    }
                }
        }
    }
}
