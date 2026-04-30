import { Avatar } from './Avatar';

interface GameOverScreenProps {
  winnerName: string;
  onReady: () => void;
  onLeave: () => void;
}

export function GameOverScreen({ winnerName, onReady, onLeave }: GameOverScreenProps) {
  return (
    <div className="screen">
      <div className="panel">
        <div className="gameover__subtitle">The game is over</div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            margin: '6px 0',
          }}
        >
          <Avatar name={winnerName} size={72} ready />
          <div className="gameover__headline">{winnerName} wins</div>
        </div>

        <div className="panel__divider" />

        <button className="btn btn--primary room__ready" onClick={onReady}>
          Ready Up
        </button>
        <button className="btn btn--ghost" onClick={onLeave}>
          Leave Room
        </button>
      </div>
    </div>
  );
}
