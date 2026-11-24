import { classNames, formatTime } from '../lib/utils.js';

export function TrackTable({ songs, currentSong, onPlay, onContextMenu, options = {} }) {
  if (!songs.length) {
    return <div className="empty">{options.empty || 'NO TRANSMISSIONS'}</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="hw-table">
        <thead>
          <tr>
            <th scope="col">ST</th>
            <th scope="col">IDX</th>
            <th scope="col">COMPOSITION / PERFORMER</th>
            <th scope="col">RELEASE</th>
            <th scope="col">SPEC</th>
            <th scope="col">DR</th>
            <th scope="col" style={{ textAlign: 'right' }}>DUR</th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song, index) => {
            const isCurrent = currentSong?.id === song.id;
            return (
              <tr
                key={song.id}
                className={classNames(isCurrent && 'playing')}
                data-song={song.id}
                data-i={index}
                tabIndex={0}
                aria-label={`Play ${song.title} by ${song.artist}`}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => onPlay(song)}
                onContextMenu={(event) => onContextMenu?.(song, event)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    onPlay(song);
                  }
                }}
              >
                <td className="st"><span className="st-dot" /></td>
                <td className="idx">{String(index + 1).padStart(2, '0')}</td>
                <td className="composition">
                  <div className="t1">{song.title}</div>
                  <div className="t2">{song.artist}</div>
                </td>
                <td className="release">{song.album} ({song.year}{options.master ? ' Master' : ''})</td>
                <td><span className={classNames('spec-badge', song.hires && 'hi')}>{song.spec}</span></td>
                <td className="dr">{song.dr}</td>
                <td className="dur">{formatTime(song.duration)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
