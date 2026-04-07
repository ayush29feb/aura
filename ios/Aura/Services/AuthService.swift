import Foundation
import AuthenticationServices
import UIKit
import Supabase

@MainActor
final class AuthService: NSObject, ObservableObject {
    @Published var user: User?
    @Published var isLoading = true

    private let supabase = SupabaseService.shared.client
    private var authWebSession: ASWebAuthenticationSession?

    override init() {
        super.init()
        Task { await observeAuthChanges() }
    }

    // MARK: - Auth State

    private func observeAuthChanges() async {
        for await (_, session) in supabase.auth.authStateChanges {
            user = session?.user
            isLoading = false
            if let user = session?.user {
                await ensureUserProfile(user: user)
            }
        }
    }

    // MARK: - Sign In

    /// Opens Google OAuth in an in-app browser (ASWebAuthenticationSession).
    /// The callback URL is handled in AuraApp via .onOpenURL.
    func signInWithGoogle() async throws {
        let redirectURL = URL(string: "aura://auth/callback")!

        let oauthURL = try await supabase.auth.signInWithOAuth(
            provider: .google,
            redirectTo: redirectURL
        )

        let callbackURL: URL = try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: oauthURL,
                callbackURLScheme: "aura"
            ) { url, error in
                if let error {
                    continuation.resume(throwing: error)
                } else if let url {
                    continuation.resume(returning: url)
                } else {
                    continuation.resume(throwing: URLError(.badURL))
                }
            }
            session.prefersEphemeralWebBrowserSession = false
            session.presentationContextProvider = self
            self.authWebSession = session
            session.start()
        }

        try await supabase.auth.session(from: callbackURL)
    }

    // MARK: - Sign Out

    func signOut() async throws {
        try await supabase.auth.signOut()
    }

    // MARK: - User Profile

    private func ensureUserProfile(user: User) async {
        struct UserProfile: Encodable {
            let id: String
            let username: String
            let avatar_url: String?
        }

        let name = user.userMetadata["name"]?.stringValue
            ?? user.email?.components(separatedBy: "@").first
            ?? "User"
        let avatarURL = user.userMetadata["avatar_url"]?.stringValue
            ?? user.userMetadata["picture"]?.stringValue

        let profile = UserProfile(id: user.id.uuidString, username: name, avatar_url: avatarURL)

        do {
            try await supabase
                .from("users")
                .upsert(profile)
                .execute()
        } catch {
            print("Failed to upsert user profile:", error)
        }
    }
}

// MARK: - ASWebAuthenticationPresentationContextProviding

extension AuthService: ASWebAuthenticationPresentationContextProviding {
    nonisolated func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        DispatchQueue.main.sync {
            UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow } ?? ASPresentationAnchor()
        }
    }
}

