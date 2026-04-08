import SwiftUI

struct FeedView: View {
    let media: [MediaItem]
    @State private var currentID: Int?

    var body: some View {
        GeometryReader { geo in
            ScrollView(.vertical, showsIndicators: false) {
                LazyVStack(spacing: 0) {
                    ForEach(media) { item in
                        MediaItemView(item: item, isActive: item.id == currentID)
                            .frame(width: geo.size.width, height: geo.size.height)
                            .containerRelativeFrame(.vertical)
                            .id(item.id)
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.paging)
            .scrollPosition(id: $currentID)
            .ignoresSafeArea()
            .overlay(alignment: .bottom) {
                if let current = media.first(where: { $0.id == currentID }),
                   let name = current.name, let price = current.price {
                    productLink(name: name, price: price, item: current)
                }
            }
        }
        .onAppear {
            currentID = media.first?.id
        }
        .onChange(of: media) { _, newMedia in
            currentID = newMedia.first?.id
        }
    }

    private func productLink(name: String, price: String, item: MediaItem) -> some View {
        Button {
            let query = "Abercrombie and Fitch \(name)"
                .addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
            if let url = URL(string: "https://www.google.com/search?q=\(query)") {
                UIApplication.shared.open(url)
            }
        } label: {
            HStack(spacing: 10) {
                Text(price)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                Text(name)
                    .font(.system(size: 14))
                    .foregroundStyle(.white.opacity(0.85))
                    .lineLimit(1)
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.black.opacity(0.55), in: RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 16)
            .padding(.bottom, 48)
        }
        .buttonStyle(.plain)
    }
}
