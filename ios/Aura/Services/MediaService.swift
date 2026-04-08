import Foundation
import PhotosUI
import SwiftUI
import Supabase

final class MediaService {
    static let shared = MediaService()
    private let supabase = SupabaseService.shared.client

    private init() {}

    // MARK: - Fetch

    func fetchProducts() async throws -> [MediaItem] {
        try await supabase
            .from("products")
            .select()
            .order("id", ascending: true)
            .execute()
            .value
    }

    func fetchUserMedia(userId: String) async throws -> [MediaItem] {
        try await supabase
            .from("user_media")
            .select()
            .eq("user_id", value: userId)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    // MARK: - Upload

    /// Uploads a photo selected from PhotosPicker and inserts metadata into user_media.
    func uploadPhoto(item: PhotosPickerItem, userId: String) async throws -> String {
        guard let data = try await item.loadTransferable(type: Data.self) else {
            throw UploadError.dataLoadFailed
        }

        guard data.count <= 5 * 1024 * 1024 else {
            throw UploadError.fileTooLarge
        }

        let fileName = "\(Int(Date().timeIntervalSince1970)).jpg"
        let filePath = "\(userId)/\(fileName)"

        _ = try await supabase.storage
            .from("user-images")
            .upload(filePath, data: data, options: FileOptions(contentType: "image/jpeg"))

        let publicURL = try supabase.storage
            .from("user-images")
            .getPublicURL(path: filePath)

        struct UserMediaInsert: Encodable {
            let user_id: String
            let url: String
            let type: String
        }

        try await supabase
            .from("user_media")
            .insert(UserMediaInsert(user_id: userId, url: publicURL.absoluteString, type: "image"))
            .execute()

        return publicURL.absoluteString
    }

    // MARK: - Authenticated Image URL

    /// Returns a 1-hour signed URL for authenticated Supabase Storage images.
    func signedURL(for url: String) async throws -> URL {
        guard let filePath = url.components(separatedBy: "/user-images/").last else {
            throw UploadError.invalidURL
        }
        return try await supabase.storage
            .from("user-images")
            .createSignedURL(path: filePath, expiresIn: 3600)
    }

    // MARK: - Errors

    enum UploadError: LocalizedError {
        case dataLoadFailed
        case fileTooLarge
        case invalidURL

        var errorDescription: String? {
            switch self {
            case .dataLoadFailed: return "Could not load image data."
            case .fileTooLarge: return "Image must be smaller than 5 MB."
            case .invalidURL: return "Invalid storage URL."
            }
        }
    }
}
