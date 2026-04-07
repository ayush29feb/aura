import SwiftUI

struct ImageItemView: View {
    let item: MediaItem
    @State private var resolvedURL: URL?
    @State private var isLoading = true

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color.black

                if let url = resolvedURL {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                                .frame(width: geo.size.width, height: geo.size.height)
                                .clipped()
                        case .failure:
                            Image(systemName: "photo")
                                .foregroundStyle(.white.opacity(0.3))
                                .font(.system(size: 48))
                        case .empty:
                            ProgressView().tint(.white)
                        @unknown default:
                            EmptyView()
                        }
                    }
                } else if isLoading {
                    ProgressView().tint(.white)
                }
            }
        }
        .task(id: item.url) {
            await resolveURL()
        }
    }

    private func resolveURL() async {
        isLoading = true
        if item.url.contains("supabase.co/storage") {
            resolvedURL = try? await MediaService.shared.signedURL(for: item.url)
        } else {
            resolvedURL = item.displayImageURL
        }
        isLoading = false
    }
}
