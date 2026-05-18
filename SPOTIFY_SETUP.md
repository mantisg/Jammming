# Spotify API Integration Guide for Jammming

## Architecture Overview

This is a **frontend-only** React application that communicates directly with Spotify using the **Authorization Code Flow with PKCE** (Proof Key for Code Exchange).

```
[User Browser (React)] ↔ [Spotify API]
```

PKCE is specifically designed for single-page applications and securely handles authentication without needing a backend server.

## Setup Steps

### 1. Environment Variables

Create a `.env.local` file in your project root (copy from `.env.local.example`):

```env
VITE_SPOTIFY_CLIENT_ID=your_actual_client_id
VITE_REDIRECT_URI=http://localhost:5173/callback
```

### 2. Spotify Dashboard Configuration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your application
3. Click "Edit Settings"
4. Under "Redirect URIs", add: `http://localhost:5173/callback`
   - For local development, HTTP/localhost is fine
   - For production deployment, replace with your HTTPS URL
5. Save

### 3. Authorization Flow Explanation

**How PKCE Works:**

1. User clicks "Connect with Spotify"
2. App generates random `code_verifier` and `code_challenge`
3. Browser redirects to Spotify with the code_challenge
4. User logs in and approves permissions
5. Spotify redirects back with an authorization code
6. App exchanges the code + code_verifier for an access token
7. Access token is stored in sessionStorage (cleared when tab closes)
8. App uses access token to search, create playlists, etc.

**Why PKCE is Secure:**
- App secret/credentials are NOT transmitted
- Only the code_verifier (which Spotify already knows about) is used to get the token
- No backend required

## Scopes

Your app requests these Spotify permissions:
- `playlist-modify-public` - Create public playlists
- `playlist-modify-private` - Create private playlists

## API Endpoints Used

- `GET /search` - Search for tracks
- `GET /me` - Get current user's profile
- `POST /users/{user_id}/playlists` - Create playlist
- `POST /playlists/{playlist_id}/tracks` - Add tracks to playlist

## Security Best Practices

✅ **DO:**
- Store Client ID in environment variables (it's public)
- Use sessionStorage (not localStorage) for tokens
- Keep tokens short-lived
- Clear tokens when user logs out

❌ **DON'T:**
- Store Client Secret anywhere (you don't need it for PKCE)
- Hardcode Client ID in code
- Commit `.env.local` to git

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and click "Connect with Spotify"

## Deployment Considerations

When deploying to production:
1. Configure environment variables in your hosting provider for the build step (these are read at build-time by Vite):

   - `VITE_SPOTIFY_CLIENT_ID` = your Spotify app Client ID
   - `VITE_REDIRECT_URI` = https://joshjammming.netlify.app/callback (or your production callback URL)

   Example (Netlify): Site Settings → Build & deploy → Environment → Add variables

2. In the Spotify Dashboard, edit your app settings and add the exact redirect URI you will use, for example:

   `https://joshjammming.netlify.app/callback`

3. Run the build (`npm run build`) and deploy the generated `dist/` folder. Re-deploy after changing environment variables so the new values are baked into the build.

