# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aura is a TikTok-style mobile web application built with React. It features vertical swipe navigation for browsing media content (images and videos) with smooth transitions and touch gestures.

## Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Deploy to GitHub Pages
npm run deploy
```

The app is deployed to GitHub Pages at: https://ayush29feb.github.io/aura

## Architecture

### Component Hierarchy

The application follows a simple three-component structure:

1. **App.js** - Root component that:
   - Fetches media data from `public/media.json` using `process.env.PUBLIC_URL` prefix (required for GitHub Pages deployment)
   - Manages loading state
   - Renders the Feed component with media data

2. **Feed.js** - Main container that handles:
   - Touch gesture detection and swipe navigation (up/down)
   - Current media index state
   - Real-time touch offset calculation for drag feedback
   - Transition animations between media items
   - Video preloading for adjacent items (currentIndex ± 1)
   - Renders only adjacent items (currentIndex - 1, currentIndex, currentIndex + 1) for performance

3. **MediaItem.js** - Individual media renderer that:
   - Conditionally renders video or image based on `item.type`
   - Manages video autoplay/pause based on `isActive` prop
   - Handles play/pause toggle on video tap
   - Resets video to start when not active

### State Management

The app uses React hooks for state management:
- **App.js**: `media` array and `loading` state
- **Feed.js**: `currentIndex`, touch gesture state (`touchStart`, `touchEnd`, `touchOffset`), and `transitioning` flag
- **MediaItem.js**: `isPaused` state for video controls

### Media Data Format

Media content is defined in `public/media.json` with the following structure:

```json
{
  "id": 1,
  "type": "image" | "video",
  "url": "https://...",
  "thumbnail": "https://..." (optional, for videos)
}
```

### Swipe Navigation

The swipe system in Feed.js works as follows:
- Minimum swipe distance: 50px (configurable via `minSwipeDistance`)
- Swipe up: advances to next item
- Swipe down: returns to previous item
- Real-time drag feedback during touch move
- Transition animation: 300ms ease-out
- Prevents navigation during active transitions

### Video Behavior

Videos in MediaItem.js are configured with:
- `loop`: videos replay automatically
- `playsInline`: prevents fullscreen on iOS
- `muted`: allows autoplay without user interaction
- Autoplay when `isActive` prop is true
- Pause and reset to start when inactive
- Click/tap toggles play/pause state

## GitHub Pages Deployment

The app is configured for GitHub Pages deployment:
- Homepage URL set in package.json: `"homepage": "https://ayush29feb.github.io/aura"`
- Media loading uses `process.env.PUBLIC_URL` prefix for proper path resolution
- Deploy workflow: `npm run predeploy` builds, then `npm run deploy` publishes to gh-pages branch
