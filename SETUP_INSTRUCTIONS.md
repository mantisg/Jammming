# Jammming - Frontend Setup Instructions

## Quick Start (5 minutes)

### 1. Configure Environment Variables

Create `.env.local` in your project root:

```env
VITE_SPOTIFY_CLIENT_ID=your_actual_client_id_from_spotify_dashboard
VITE_REDIRECT_URI=http://localhost:5173/callback
```

**To find your Client ID:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. You'll see "Client ID" in the app info

### 2. Register Redirect URI in Spotify Dashboard

1. In your app settings, find "Redirect URIs"
2. Add: `http://localhost:5173/callback`
3. Click "Save"

### 3. Start the Development Server

```bash
npm install  # if you haven't already
npm run dev
```

Visit `http://localhost:5173`

### 4. Test the App

1. Click "Connect with Spotify"
2. Log in with your Spotify account
3. You'll be redirected back to the app
4. Search for songs and add them to your playlist!

## How It Works

```
┌─────────────────────────────────┐
│  1. User clicks "Connect"       │
│     ↓                           │
│  2. Redirected to Spotify login │
│     ↓                           │
│  3. User authorizes app         │
│     ↓                           │
│  4. Redirected back to app      │
│     with authorization code     │
│     ↓                           │
│  5. App exchanges code for      │
│     access token                │
│     ↓                           │
│  6. App can now search,         │
│     create playlists, etc.      │
└─────────────────────────────────┘
```

## Features Implemented

- ✅ Search Spotify for songs/artists/albums
- ✅ View search results with album art
- ✅ Add tracks to custom playlist
- ✅ Remove tracks from playlist
- ✅ Name your playlist
- ✅ Save playlist to Spotify account
- ✅ Login/Logout with Spotify

## Component Structure

```
App.jsx (main state & logic)
├── SearchBar.jsx (search input)
├── SearchResults.jsx (displays search results)
│   └── Track.jsx (individual track)
└── Playlist.jsx (playlist management)
    └── Tracklist.jsx (list of playlist tracks)
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SPOTIFY_CLIENT_ID` | Your app's public client ID | `abc123...` |
| `VITE_REDIRECT_URI` | Where Spotify redirects after login | `http://localhost:5173/callback` |

## Common Issues

### **"Redirect URI mismatch"**
Make sure the URI in your `.env.local` **exactly** matches what's in Spotify Dashboard (including protocol and port).

### **"App not authorized"**
Make sure you've saved the redirect URI in Spotify Dashboard settings.

### **"Search not working"**
Make sure you've logged in first (click "Connect with Spotify").

### **Blank page after logging in**
Check browser console for errors. Make sure your Client ID is correct in `.env.local`.

## Deployment

### Before deploying:
1. Get a production URL (Vercel, Netlify, GitHub Pages, etc.)
2. Update Spotify Dashboard with your production redirect URI
3. Build: `npm run build`
4. The `dist/` folder contains your production app

### Update for production:
Create `.env.production.local` or use production environment variables in your host:
```env
VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_REDIRECT_URI=your_callback_uri
```

> Note: Vite also loads `.env.local` in production builds, but `.env.production.local` is the preferred place for production-specific values. If you already use `.env.local`, it will still be read and can override `.env` values.

### Netlify specific

If you're deploying the frontend to Netlify, set the environment variables in Netlify's Site settings (these are used during the build):

- `VITE_SPOTIFY_CLIENT_ID` = your Spotify Client ID
- `VITE_REDIRECT_URI` = your_callback_uri

After setting these, trigger a new deploy so Vite bakes the variables into the production bundle.

Spotify strictly requires HTTPS for production deployments.

## Useful Links

- [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api)
- [Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization/)
- [Spotify Dashboard](https://developer.spotify.com/dashboard)

