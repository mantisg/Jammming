import '../styles/Track.css';

export default function Track({ track, onAction, actionLabel, isInPlaylist }) {
  const handleClick = () => {
    onAction(track);
  };

  return (
    <li className="Track">
      <div className="track-info">
        {track.albumImage && (
          <img src={track.albumImage} alt={track.album} className='album-art' />
        )}
        <div className="track-details">
          <p className="track-name">{track.name}</p>
          <p className="track-artist">{track.artist} | {track.album}</p>
        </div>
      </div>
      <button 
        className={`track-action ${isInPlaylist ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={isInPlaylist}
      >
        {isInPlaylist ? '✓' : actionLabel}
      </button>
    </li>
  );
}
