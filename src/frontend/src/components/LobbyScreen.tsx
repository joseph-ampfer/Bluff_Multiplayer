import { useState } from 'react';

interface LobbyScreenProps {
  onCreate: (roomName: string) => void;
  onJoin: (roomName: string) => void;
}

export function LobbyScreen({ onCreate, onJoin }: LobbyScreenProps) {
  const [code, setCode] = useState('');
  const trimmed = code.trim();
  const canSubmit = trimmed.length > 0;

  const create = () => {
    if (canSubmit) onCreate(trimmed);
  };
  const join = () => {
    if (canSubmit) onJoin(trimmed);
  };

  return (
    <div className="screen">
      <div className="panel">
        <h1 className="lobby__title">Liar&apos;s Deck</h1>
        <div className="lobby__subtitle">Bluff. Call. Survive.</div>
        <div className="panel__divider" />

        <input
          className="input"
          type="text"
          placeholder="Room code"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') create();
          }}
          maxLength={32}
          autoFocus
        />

        <div className="lobby__buttons">
          <button
            className="btn btn--primary"
            disabled={!canSubmit}
            onClick={create}
          >
            Create Room
          </button>
          <button className="btn" disabled={!canSubmit} onClick={join}>
            Join Room
          </button>
        </div>

        <div className="lobby__footer">Best on desktop</div>
      </div>
    </div>
  );
}
