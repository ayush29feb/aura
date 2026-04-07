import Foundation

struct MediaItem: Decodable, Identifiable {
    let id: Int
    let type: MediaType
    let url: String
    let thumbnail: String?
    let name: String?
    let price: String?
    let images: ProductImages?

    enum MediaType: String, Decodable {
        case image, video
    }

    struct ProductImages: Decodable {
        let model1: String?
    }

    /// Best URL to show as the primary still image
    var displayImageURL: URL? {
        let raw = images?.model1 ?? (type == .image ? url : thumbnail) ?? url
        return URL(string: raw)
    }
}

enum FeedMode: Equatable {
    case afProducts
    case myPhotos
}
