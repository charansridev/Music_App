import { EmptyState } from './EmptyState.jsx';
import { SignalBadge } from './EditorialGraphics.jsx';
import { classNames, formatTime } from '../lib/utils.js';

const BADGE_TONES = ['yellow', 'pink', 'paper', 'orange', 'green'];

export function TrackTable({ songs, currentSong, onPlay, onContextMenu, options = {} }) {
  if (!songs.length) {
    return (
      <EmptyState
        compact
        variant={options.master ? 'hires' : 'disc'}
        eyebrow={options.master ? 'HI-RES VAULT' : 'ARCHIVE'}
        title={options.empty || 'No tracks found'}
        description={options.emptyDesc || 'Adjust your filter or mount a local music folder.'}
      />
    );
  }

  return (
    <div className="hw-table-wrap">
      <table className="hw-table">
        <thead>
          <tr>
            <th scope="col" className="col-st">NO.</th>
            <th scope="col">TITLE / PERFORMER</th>
            <th scope="col" className="col-release">RELEASE</th>
            <th scope="col">FORMAT</th>
            <th scope="col" className="col-stream">RATE</th>
            <th scope="col" className="col-dur" style={{ textAlign: 'right' }}>TIME</th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song, index) => {
            const isCurrent = currentSong?.id === song.id;
            const tone = BADGE_TONES[index % BADGE_TONES.length];
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
                <td className="idx">
                  {isCurrent ? (
                    <span className="row-eq-badge" aria-hidden="true">
                      <span className="row-eq"><i /><i /><i /></span>
                    </span>
                  ) : (
                    <SignalBadge
                      label={String(index + 1)}
                      tone={tone}
                      size="sm"
                    />
                  )}
                </td>
                <td className="composition">
                  <div className="comp-wrap">
                    <div
                      className="comp-art"
                      style={song.art ? { backgroundImage: `url('${song.art}')` } : undefined}
                    />
                    <div className="comp-text">
                      <div className="t1">{song.title}</div>
                      <div className="t2">{song.artist}</div>
                    </div>
                  </div>
                </td>
                <td className="release col-release">{song.album}{song.year ? ` · ${song.year}` : ''}</td>
                <td><span className={classNames('spec-badge mono', song.hires && 'hi')}>{song.spec}</span></td>
                <td className="dr mono col-stream">{song.dr}</td>
                <td className="dur mono">{formatTime(song.duration)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
