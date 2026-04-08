import SwiftUI

struct MediaItemView: View {
    let item: MediaItem
    let isActive: Bool

    var body: some View {
        switch item.type {
        case .video:
            VideoItemView(item: item, isActive: isActive)
        case .image:
            ImageItemView(item: item)
        }
    }
}
