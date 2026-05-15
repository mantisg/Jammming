import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Spotify Configuration
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5173/callback';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// Store tokens in memory (in production, use database/session storage)
let accessToken = null;
let refreshToken = null;

/**
 * GET /auth/login
 * Redirects user to Spotify authorization page
 */
app.get('/auth/login', (req, res) => {
  const scopes = [
    'playlist-modify-public',
    'playlist-modify-private',
  ].join('%20');

  const authUrl = `${SPOTIFY_AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}`;
  
  res.json({ authUrl });
});

/**
 * GET /auth/callback
 * Handles Spotify's redirect with authorization code
 * Exchanges code for access token
 */
app.get('/auth/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.json({ error: 'Authorization failed' });
  }

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    // Exchange authorization code for access token
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;

    // Redirect back to your app with success
    // Note: You might want to send a message back instead
    res.redirect(`http://localhost:5173?access_token=${accessToken}`);
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

/**
 * GET /auth/token
 * Returns current access token (with refresh if needed)
 */
app.get('/auth/token', async (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // TODO: Check if token is expired and refresh if needed
  res.json({ accessToken });
});

/**
 * POST /search
 * Searches Spotify for tracks
 */
app.post('/search', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }

  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get(
      `${SPOTIFY_API_URL}/search`,
      {
        params: {
          q: query,
          type: 'track',
          limit: 20,
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    // Transform Spotify response to match your app's needs
    const tracks = response.data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown',
      album: track.album?.name || 'Unknown',
      albumImage: track.album?.images[0]?.url || '',
      uri: track.uri,
    }));

    res.json({ tracks });
  } catch (error) {
    console.error('Search error:', error.response?.status, error.response?.data);
    res.status(error.response?.status || 500).json({ 
      error: 'Search failed',
      details: error.response?.data
    });
  }
});

/**
 * POST /playlist/create
 * Creates a new playlist on user's Spotify account
 */
app.post('/playlist/create', async (req, res) => {
  const { playlistName, trackUris } = req.body;

  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // First, get current user's ID
    const userResponse = await axios.get(
      `${SPOTIFY_API_URL}/me`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const userId = userResponse.data.id;

    // Create playlist
    const playlistResponse = await axios.post(
      `${SPOTIFY_API_URL}/users/${userId}/playlists`,
      {
        name: playlistName,
        public: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const playlistId = playlistResponse.data.id;

    // Add tracks to playlist
    if (trackUris && trackUris.length > 0) {
      await axios.post(
        `${SPOTIFY_API_URL}/playlists/${playlistId}/tracks`,
        {
          uris: trackUris,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    res.json({
      success: true,
      playlistId,
      playlistUrl: playlistResponse.data.external_urls.spotify,
    });
  } catch (error) {
    console.error('Playlist creation error:', error.response?.data);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to create playlist'
    });
  }
});

/**
 * POST /auth/logout
 * Clears tokens
 */
app.post('/auth/logout', (req, res) => {
  accessToken = null;
  refreshToken = null;
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`🎵 Spotify API server initialized`);
});
