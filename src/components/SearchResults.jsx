import Track from './Track';

export default function SearchResults({ searchResults, onAddTrack, playlistTracks }) {
  return (
    <div className="SearchResults">
      <h2>Search Results</h2>
      {searchResults.length === 0 ? (
        <p className="empty-message">Search for a song, artist, or album to get started!</p>
      ) : (
        <ul className="track-list">
          {searchResults.map(track => (
            <Track
              key={track.id}
              track={track}
              onAction={onAddTrack}
              actionLabel="+"
              isInPlaylist={playlistTracks.some(t => t.id === track.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}