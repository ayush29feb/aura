import SwiftUI

struct AuthButtonView: View {
    @EnvironmentObject var auth: AuthService
    @State private var showMenu = false
    @State private var errorMessage: String?

    private var avatarURL: URL? {
        guard let raw = auth.user?.userMetadata["avatar_url"]?.stringValue
                ?? auth.user?.userMetadata["picture"]?.stringValue
        else { return nil }
        return URL(string: raw)
    }

    var body: some View {
        Button { showMenu = true } label: {
            if auth.user != nil {
                avatarView
            } else {
                Text("Sign In")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(.white.opacity(0.2))
                    .clipShape(Capsule())
            }
        }
        .confirmationDialog("Account", isPresented: $showMenu) {
            if auth.user != nil {
                Button("Sign Out", role: .destructive) {
                    Task { try? await auth.signOut() }
                }
            } else {
                Button("Sign in with Google") {
                    Task {
                        do { try await auth.signInWithGoogle() }
                        catch { errorMessage = error.localizedDescription }
                    }
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            if let email = auth.user?.email {
                Text(email)
            }
        }
        .alert("Sign-in Error", isPresented: .present($errorMessage), actions: {
            Button("OK") { errorMessage = nil }
        }, message: {
            Text(errorMessage ?? "")
        })
    }

    @ViewBuilder
    private var avatarView: some View {
        if let url = avatarURL {
            AsyncImage(url: url) { phase in
                if case .success(let img) = phase {
                    img.resizable().scaledToFill()
                } else {
                    placeholderAvatar
                }
            }
            .frame(width: 36, height: 36)
            .clipShape(Circle())
        } else {
            placeholderAvatar
        }
    }

    private var placeholderAvatar: some View {
        ZStack {
            Circle().fill(Color.gray.opacity(0.6))
            Text(auth.user?.email?.prefix(1).uppercased() ?? "U")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
        }
        .frame(width: 36, height: 36)
    }
}

