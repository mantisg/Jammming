import Track from './Track';

export default function Tracklist({ tracks, onRemoveTrack }) {
  return (
    <div className="Tracklist">
      {tracks.length === 0 ? (
        <p className="empty-message">Add tracks to your playlist!</p>
      ) : (
        <ul className="track-list">
          {tracks.map(track => (
            <Track
              key={track.id}
              track={track}
              onAction={onRemoveTrack}
              actionLabel="-"
              isInPlaylist={false}
            />
          ))}
        </ul>
      )}
    </div>
  );
}