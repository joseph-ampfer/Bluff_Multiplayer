import { useState } from 'react';
import { Avatar } from './Avatar';
import type { Player } from '../../../shared/types';

interface RoomScreenProps {
  myName: string;
  players: Player[];
  currentRoom: string;
  canReadyUp: boolean;
  onSetUsername: (name: string) => void;
  onReady: () => void;
  onLeave: () => void;
}

export function RoomScreen({
  myName,
  players,
  currentRoom,
  canReadyUp,
  onSetUsername,
  onReady,
  onLeave,
}: RoomScreenProps) {
  const [username, setUsername] = useState('');
  const [copied, setCopied] = useState(false);

  const me = players.find(p => p.name === myName);
  const iAmReady = me?.ready ?? false;
  const usernameValue = username.trim();
  const canSubmitUsername = usernameValue.length > 0;

  const submitUsername = () => {
    if (!canSubmitUsername) return;
    onSetUsername(usernameValue);
    setUsername('');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentRoom);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard may be unavailable in insecure contexts; fail silently
    }
  };

  return (
    <div className="screen">
      <div className="panel">
        <div className="room__header">
          <div>
            <div className="room__code-label">Room Code</div>
            <div className="room__code">
              <span>{currentRoom}</span>
              <button className="btn btn--ghost room__copy" onClick={copyCode}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <button className="btn btn--ghost" onClick={onLeave}>
            Leave
          </button>
        </div>

        <div className="panel__divider" />

        <div>
          <div className="room__section-label">Players ({players.length})</div>
          <div className="room__player-list" style={{ marginTop: 10 }}>
            {players.length === 0 ? (
              <div
                style={{
                  color: 'var(--text-dim)',
                  fontSize: 12,
                  padding: '12px 0',
                  textAlign: 'center',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                Waiting for players...
              </div>
            ) : (
              players.map(p => (
                <div key={p.playerId} className="player-row">
                  <Avatar name={p.name} ready={p.ready} eliminated={!p.isAlive} />
                  <div
                    className={`player-row__name ${p.name === myName ? '--me' : ''}`}
                  >
                    {p.name}
                  </div>
                  <div
                    className={`player-row__status ${
                      p.ready ? '--ready' : '--waiting'
                    }`}
                  >
                    {p.ready ? 'Ready' : 'Waiting'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel__divider" />

        {!myName ? (
          <div className="room__field">
            <input
              className="input"
              type="text"
              placeholder="Your name"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') submitUsername();
              }}
              maxLength={20}
              autoFocus
            />
            <button
              className="btn btn--primary"
              disabled={!canSubmitUsername}
              onClick={submitUsername}
            >
              Set Name
            </button>
          </div>
        ) : (
          <button
            className={`btn ${iAmReady ? '' : 'btn--primary'} room__ready`}
            disabled={!canReadyUp || iAmReady}
            onClick={onReady}
          >
            {iAmReady ? 'Waiting for others...' : 'Ready Up'}
          </button>
        )}
      </div>
    </div>
  );
}
