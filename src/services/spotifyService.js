/**
 * Spotify API Service - Frontend Only
 * Uses Axios to make direct calls to Spotify API
 */

function getClientId() {
  return sessionStorage.getItem('spotify_client_id') || import.meta.env.VITE_SPOTIFY_CLIENT_ID;
}

const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/callback';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// Generate random string for PKCE
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.-~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Create SHA256 hash for PKCE
async function createHash(input) {
  const msgBuffer = new TextEncoder().encode(input);
  return await crypto.subtle.digest('SHA-256', msgBuffer);
}

// Base64 URL encode raw bytes
function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

class SpotifyService {
  /**
   * Generate code verifier for PKCE
   */
  static generateCodeVerifier() {
    return generateRandomString(128);
  }

  /**
   * Generate code challenge from verifier
   */
  static async generateCodeChallenge(verifier) {
    const hash = await createHash(verifier);
    return base64UrlEncode(hash);
  }

  /**
   * Initiates Spotify login flow using PKCE
   */
  static async redirectToSpotifyLogin() {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store code verifier in session storage (needed for token exchange)
    sessionStorage.setItem('spotify_code_verifier', codeVerifier);

    const scopes = [
      'playlist-modify-public',
      'playlist-modify-private',
    ];

    const clientId = getClientId();
    if (!clientId) {
      throw new Error('Spotify Client ID is not configured. Provide a client ID in env or enter one when prompted.');
    }

    const authUrl = `${SPOTIFY_AUTH_URL}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}&code_challenge_method=S256&code_challenge=${codeChallenge}&show_dialog=true`;

    window.location.href = authUrl;
  }

  /**
   * Exchanges authorization code for access token using PKCE
   */
  static async handleCallback(code) {
    try {
      const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
      if (!codeVerifier) {
        console.error('Missing PKCE code verifier in sessionStorage. Check that the app was opened from the same origin as the Spotify redirect URI.');
      }

      const clientId = getClientId();
      if (!clientId) {
        throw new Error('Spotify Client ID is not configured. Provide a client ID in env or enter one when prompted.');
      }

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier || '',
        }).toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Spotify token endpoint returned error:', response.status, data);
        return false;
      }

      console.log('Spotify token response scope:', data.scope);
      if (data.access_token) {
        sessionStorage.setItem('spotify_access_token', data.access_token);
        if (data.scope) {
          sessionStorage.setItem('spotify_granted_scope', data.scope);
        }
        sessionStorage.removeItem('spotify_code_verifier');
        return true;
      }

      console.error('Spotify token response did not include access_token:', data);
      return false;
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw error;
    }
  }

  /**
   * Gets current access token
   */
  static getAccessToken() {
    return sessionStorage.getItem('spotify_access_token');
  }

  /**
   * Gets granted scopes from the access token response
   */
  static getGrantedScope() {
    return sessionStorage.getItem('spotify_granted_scope') || '';
  }

  /**
   * Returns true when the requested scope is granted
   */
  static hasScope(scope) {
    return this.getGrantedScope().split(' ').includes(scope);
  }

  /**
   * Searches for tracks on Spotify
   * @param {string} query - Search query (song title, artist, etc.)
   * @returns {Promise<Array>} Array of track objects
   */
  static async searchTracks(query) {
    const token = this.getAccessToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(
        `${SPOTIFY_API_URL}/search?type=track&limit=10&q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Spotify search error body:', errorBody);
        let parsedError = '';
        try {
          const jsonError = JSON.parse(errorBody);
          parsedError = jsonError.error?.message || jsonError.error_description || JSON.stringify(jsonError);
        } catch {
          parsedError = errorBody;
        }
        throw new Error(`Search failed: ${response.status} ${response.statusText} ${parsedError}`);
      }

      const data = await response.json();

      // Transform Spotify response to match app needs
      return data.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown',
        album: track.album?.name || 'Unknown',
        albumImage: track.album?.images[0]?.url || '',
        uri: track.uri,
      }));
    } catch (error) {
      console.error('Failed to search tracks:', error);
      throw error;
    }
  }

  /**
   * Gets current user's profile
   */
  static async getCurrentUser() {
    const token = this.getAccessToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${SPOTIFY_API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const body = await response.text();
        console.error('Spotify /me error body:', body);
        let message = 'Failed to get user profile';
        try {
          const json = JSON.parse(body);
          message = json.error?.message || json.error_description || message;
        } catch {}
        throw new Error(message);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  /**
   * Creates a new playlist and adds tracks to it
   * @param {string} playlistName - Name of the playlist
   * @param {Array<string>} trackUris - Spotify URIs of tracks to add
   * @returns {Promise<Object>} Playlist creation response
   */
  static async createPlaylist(playlistName, trackUris) {
    const token = this.getAccessToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      // Create playlist for current user
      const playlistResponse = await fetch(
        `${SPOTIFY_API_URL}/me/playlists`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: playlistName,
            public: true,
            collaborative: false,
            description: 'Playlist created with Jammming',
          }),
        }
      );

      if (!playlistResponse.ok) {
        const body = await playlistResponse.text();
        console.error('Spotify create playlist error body:', body);
        let message = 'Failed to create playlist';
        try {
          const json = JSON.parse(body);
          message = json.error?.message || json.error_description || message;
        } catch {}
        throw new Error(message);
      }

      const playlist = await playlistResponse.json();
      const playlistId = playlist.id;
      console.log('Created playlist', {
        playlistId,
        owner: playlist.owner?.id,
        playlistName: playlist.name,
        playlistPublic: playlist.public,
        trackUris,
        grantedScope: this.getGrantedScope(),
      });

      const currentUser = await this.getCurrentUser();
      console.log('Current user:', currentUser.id, 'Playlist owner:', playlist.owner?.id);

      // Add tracks to playlist if provided
      if (trackUris && trackUris.length > 0) {
        const requiredScope = playlist.public ? 'playlist-modify-public' : 'playlist-modify-private';
        if (!this.hasScope(requiredScope)) {
          throw new Error(`The current Spotify token does not include the required scope: ${requiredScope}. Please reconnect and approve the playlist permissions.`);
        }

        console.log('Adding tracks to playlist with query params', playlistId, { trackUris });
        const urisParam = trackUris.join(',');
        const addTracksResponse = await fetch(
          `${SPOTIFY_API_URL}/playlists/${playlistId}/items?uris=${encodeURIComponent(urisParam)}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!addTracksResponse.ok) {
          const body = await addTracksResponse.text();
          console.error('Spotify add tracks error body:', body);
          let message = 'Failed to add tracks to playlist';
          try {
            const json = JSON.parse(body);
            message = json.error?.message || json.error_description || message;
          } catch {}
          throw new Error(message);
        }
      }

      return {
        success: true,
        playlistId,
        playlistUrl: playlist.external_urls.spotify,
      };
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw error;
    }
  }

  /**
   * Logs out the current user
   */
  static logout() {
    sessionStorage.removeItem('spotify_access_token');
    sessionStorage.removeItem('spotify_code_verifier');
    sessionStorage.removeItem('spotify_granted_scope');
  }

  /**
   * Checks if user is logged in
   */
  static isLoggedIn() {
    return !!this.getAccessToken();
  }
}

export default SpotifyService;
