import Tracklist from './Tracklist';

export default function Playlist({ 
  playlistName, 
  onPlaylistNameChange, 
  playlistTracks, 
  onRemoveTrack,
  onSave 
}) {
  const handleNameChange = (e) => {
    onPlaylistNameChange(e.target.value);
  };

  return (
    <div className="Playlist">
      <input
        className="playlist-name-input"
        type="text"
        value={playlistName}
        onChange={handleNameChange}
        placeholder="My Playlist"
      />
      <Tracklist 
        tracks={playlistTracks}
        onRemoveTrack={onRemoveTrack}
      />
      <button 
        className="save-playlist-btn"
        onClick={onSave}
        disabled={playlistTracks.length === 0}
      >
        Save Playlist to Spotify
      </button>
    </div>
  );
}
