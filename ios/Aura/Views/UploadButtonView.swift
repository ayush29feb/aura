import SwiftUI
import PhotosUI

struct UploadButtonView: View {
    @EnvironmentObject var auth: AuthService
    let onComplete: () async -> Void

    @State private var selectedItem: PhotosPickerItem?
    @State private var isUploading = false
    @State private var errorMessage: String?

    var body: some View {
        PhotosPicker(selection: $selectedItem, matching: .images) {
            ZStack {
                Circle()
                    .fill(.white.opacity(0.2))
                    .frame(width: 40, height: 40)

                if isUploading {
                    ProgressView()
                        .tint(.white)
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(.white)
                }
            }
        }
        .disabled(isUploading)
        .onChange(of: selectedItem) { _, item in
            guard let item else { return }
            Task { await upload(item: item) }
        }
        .alert("Upload Error", isPresented: .present($errorMessage)) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
    }

    private func upload(item: PhotosPickerItem) async {
        guard let userId = auth.user?.id.uuidString else { return }
        isUploading = true
        defer {
            isUploading = false
            selectedItem = nil
        }

        do {
            _ = try await MediaService.shared.uploadPhoto(item: item, userId: userId)
            await onComplete()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
