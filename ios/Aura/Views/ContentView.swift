import SwiftUI

struct ContentView: View {
    @EnvironmentObject var auth: AuthService
    @State private var feedMode: FeedMode = .afProducts
    @State private var media: [MediaItem] = []
    @State private var isLoadingMedia = true

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if auth.isLoading || isLoadingMedia {
                ProgressView()
                    .tint(.white)
                    .scaleEffect(1.5)
            } else if feedMode == .myPhotos && auth.user == nil {
                loginPrompt
            } else {
                FeedView(media: media)
            }

            // Overlay controls always on top
            if !auth.isLoading {
                overlayControls
            }
        }
        .task(id: feedMode) { await loadMedia() }
        .task(id: auth.user?.id) { await loadMedia() }
    }

    // MARK: - Subviews

    private var overlayControls: some View {
        VStack {
            HStack(alignment: .center) {
                // Feed toggle pills
                HStack(spacing: 6) {
                    toggleButton("A&F", mode: .afProducts)
                    toggleButton("My Photos", mode: .myPhotos)
                }

                Spacer()

                // Auth + Upload buttons
                HStack(spacing: 8) {
                    if auth.user != nil && feedMode == .myPhotos {
                        UploadButtonView { await loadMedia() }
                    }
                    AuthButtonView()
                }
            }
            .padding(.horizontal, 12)
            .padding(.top, 8)

            Spacer()
        }
    }

    private func toggleButton(_ label: String, mode: FeedMode) -> some View {
        Button(label) { feedMode = mode }
            .font(.system(size: 14, weight: .semibold))
            .foregroundStyle(feedMode == mode ? .white : .white.opacity(0.6))
            .padding(.horizontal, 14)
            .padding(.vertical, 7)
            .background(feedMode == mode ? Color.white.opacity(0.25) : Color.black.opacity(0.4))
            .clipShape(Capsule())
    }

    private var loginPrompt: some View {
        VStack(spacing: 12) {
            Text("Sign in to view your photos")
                .font(.title2).bold()
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
            Text("Sign in to upload and view your personal photo collection")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.6))
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 32)
    }

    // MARK: - Data Loading

    private func loadMedia() async {
        isLoadingMedia = true
        defer { isLoadingMedia = false }

        do {
            var data: [MediaItem]
            if feedMode == .afProducts {
                data = try await MediaService.shared.fetchProducts()
                data = data.filter { $0.images?.model1 != nil }
            } else {
                guard let userId = auth.user?.id.uuidString else {
                    media = []
                    return
                }
                data = try await MediaService.shared.fetchUserMedia(userId: userId)
            }
            media = data.shuffled()
        } catch {
            print("Error loading media:", error)
        }
    }
}
