import SwiftUI
import AVKit

struct VideoItemView: View {
    let item: MediaItem
    let isActive: Bool

    @State private var player: AVPlayer?
    @State private var isPaused = false

    var body: some View {
        ZStack {
            Color.black

            if let player {
                VideoPlayer(player: player)
                    .disabled(true)           // We handle taps ourselves below
                    .ignoresSafeArea()

                // Custom tap to play/pause
                Color.clear
                    .contentShape(Rectangle())
                    .onTapGesture { togglePlayback() }

                if isPaused {
                    Image(systemName: "pause.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.white.opacity(0.8))
                        .allowsHitTesting(false)
                }
            }
        }
        .onAppear { setupPlayer() }
        .onDisappear { teardownPlayer() }
        .onChange(of: isActive) { _, active in
            if active {
                player?.seek(to: .zero)
                player?.play()
                isPaused = false
            } else {
                player?.pause()
                player?.seek(to: .zero)
                isPaused = false
            }
        }
    }

    private func setupPlayer() {
        guard let url = URL(string: item.url) else { return }
        let avPlayer = AVPlayer(url: url)
        avPlayer.isMuted = true

        // Loop video
        NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: avPlayer.currentItem,
            queue: .main
        ) { _ in
            avPlayer.seek(to: .zero)
            avPlayer.play()
        }

        player = avPlayer
        if isActive {
            avPlayer.play()
        }
    }

    private func teardownPlayer() {
        player?.pause()
        player = nil
    }

    private func togglePlayback() {
        guard let player else { return }
        if isPaused {
            player.play()
        } else {
            player.pause()
        }
        isPaused.toggle()
    }
}
