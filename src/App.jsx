import { useState, useEffect } from 'react'
import './App.css'
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import Playlist from './components/Playlist';
import SpotifyService from './services/spotifyService';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playlistName, setPlaylistName] = useState('New Playlist');
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // Check if user is logged in on mount
  useEffect(() => {
    setIsLoggedIn(SpotifyService.isLoggedIn());
  }, []);

  // Handle Spotify callback (when redirected back from Spotify login)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const callbackHandled = sessionStorage.getItem('spotify_code_callback_handled');

    if (!code || callbackHandled) {
      return;
    }

    sessionStorage.setItem('spotify_code_callback_handled', 'true');

    SpotifyService.handleCallback(code)
      .then((success) => {
        const loggedIn = SpotifyService.isLoggedIn();
        setIsLoggedIn(loggedIn);
        window.history.replaceState({}, document.title, window.location.pathname);

        if (!success || !loggedIn) {
          setError('Spotify login failed. Make sure you are using the exact registered redirect URI and open the app at 127.0.0.1:5173.');
          console.error('Spotify login failed: callback did not return an access token.');
          return;
        }

        console.log('Spotify login success, isLoggedIn:', loggedIn);
      })
      .catch(err => {
        setError('Failed to log in');
        console.error(err);
      });
  }, []);

  const handleLoginClick = async () => {
    sessionStorage.removeItem('spotify_code_callback_handled');
    sessionStorage.removeItem('spotify_granted_scope');
    try {
      await SpotifyService.redirectToSpotifyLogin();
    } catch (err) {
      setError('Failed to initiate login');
      console.error(err);
    }
  };

  const handleLogout = () => {
    SpotifyService.logout();
    sessionStorage.removeItem('spotify_code_callback_handled');
    sessionStorage.removeItem('spotify_granted_scope');
    setIsLoggedIn(false);
    setPlaylistTracks([]);
    setSearchResults([]);
    setPlaylistName('New Playlist');
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError('');
    try {
      const results = await SpotifyService.searchTracks(query);
      setSearchResults(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search';
      setError(`Failed to search: ${message}`);
      console.error(err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addTrackToPlaylist = (track) => {
    // Check if track is already in playlist
    if (playlistTracks.some(t => t.id === track.id)) {
      setError('Track is already in the playlist');
      return;
    }
    setPlaylistTracks([...playlistTracks, track]);
  };

  const removeTrackFromPlaylist = (track) => {
    setPlaylistTracks(playlistTracks.filter(t => t.id !== track.id));
  };

  const handleSavePlaylist = async () => {
    if (!playlistName.trim()) {
      setError('Please enter a playlist name');
      return;
    }

    if (playlistTracks.length === 0) {
      setError('Please add at least one track to the playlist');
      return;
    }

    try {
      setError('');
      const trackUris = playlistTracks.map(track => track.uri);
      const result = await SpotifyService.createPlaylist(playlistName, trackUris);
      
      setError('');
      alert(`✅ Playlist "${playlistName}" saved to Spotify!`);
      
      // Reset playlist
      setPlaylistTracks([]);
      setPlaylistName('New Playlist');
    } catch (err) {
      setError(`Failed to save playlist: ${err.message}`);
      console.error(err);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>🎵 Jammming</h1>
        <div className="auth-section">
          {isLoggedIn ? (
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button className="login-btn" onClick={handleLoginClick}>
              Connect with Spotify
            </button>
          )}
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {isLoggedIn ? (
        <main className="main-content">
          <div className="search-section">
            <SearchBar onSearch={handleSearch} isSearching={isSearching} />
          
            <SearchResults 
              searchResults={searchResults} 
              onAddTrack={addTrackToPlaylist}
              playlistTracks={playlistTracks}
              className="search-results"
            />
          </div>
          <div className="playlist-section">
            <Playlist 
              playlistName={playlistName}
              onPlaylistNameChange={setPlaylistName}
              playlistTracks={playlistTracks}
              onRemoveTrack={removeTrackFromPlaylist}
              onSave={handleSavePlaylist}
            />
          </div>
        </main>
      ) : (
        <div className="login-prompt">
          <p>Connect your Spotify account to get started!</p>
        </div>
      )}
    </div>
  )
}

export default App
