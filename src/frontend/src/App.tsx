import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import tableBackground from './assets/table-background.png';
import './App.css'
import { socket } from './socket';
import type { Player, GameState, LiarCard } from '../../shared/types';
import { PlayingCard } from './components/PlayingCard';
import { PlayerHand } from './components/PlayerHand';
import { LobbyScreen } from './components/LobbyScreen';
import { RoomScreen } from './components/RoomScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { CardGhost } from './components/CardGhost';
import { RouletteOverlay } from './components/RouletteOverlay';
import { AudioControls } from './components/AudioControls';
import { AboutModal } from './components/AboutModal';
import { Toasts } from './components/Toasts';
import { DeclaredRankBanner } from './components/DeclaredRankBanner';
import {
  computeLandingTargets,
  rectFromDOMRect,
  STAGGER_MS,
  type FlightRect,
  type FlightTarget,
} from './utils/animation';
import { playSfx, primeAudio } from './utils/audio';
import { clearAllToasts, pushToast } from './utils/toasts';

type Screen = 'lobby' | 'room' | 'playing' | 'gameOver';

interface GhostSpec {
  key: string;
  card: LiarCard;
  src: FlightRect;
  dst: FlightTarget;
  delayMs: number;
  faceUpStart: boolean;
  faceUpEnd: boolean;
}

interface TableCard {
  id: number;
  rotateDeg: number;
  offsetX: number;
}

interface RouletteState {
  playerId: string;
  name: string;
  isShot: boolean;
  seatRect: { left: number; top: number; width: number; height: number };
}

function App() {
  const [myName, setMyName] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>({} as GameState); // hidden, for everyone
  const [myHand, setMyHand] = useState<LiarCard[]>([]);        // real, just for you
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [justPlayed, setJustPlayed] = useState<{ name: string, numCards: number } | null>(null);
  const [topDeck, setTopDeck] = useState<LiarCard[]>([]);
  const [gameEnded, setGameEnded] = useState<{ gameEnded: boolean, winnerName: string } | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [canReadyUp, setCanReadyUp] = useState<boolean>(false);
  const [tableCards, setTableCards] = useState<TableCard[]>([]);
  const [leavingCardIds, setLeavingCardIds] = useState<Set<number>>(() => new Set());
  const [ghosts, setGhosts] = useState<GhostSpec[]>([]);
  const [roulette, setRoulette] = useState<RouletteState | null>(null);
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);

  const myNameRef = useRef('');
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const playAreaRef = useRef<HTMLDivElement | null>(null);
  const ghostKeyRef = useRef(0);
  const selectedCardsRef = useRef<number[]>([]);
  const playersRef = useRef<Player[]>([]);
  const myHandRef = useRef<LiarCard[]>([]);
  const cylinderRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rouletteResolveRef = useRef<(() => void) | null>(null);
  const callLiarPipelineRef = useRef<Promise<void> | null>(null);
  const gameStateRef = useRef<GameState>({} as GameState);
  const lastTurnNameRef = useRef<string | null>(null);

  const registerCardRef = useCallback(
    (id: number) => (el: HTMLButtonElement | null) => {
      if (el) cardRefs.current.set(id, el);
      else cardRefs.current.delete(id);
    },
    []
  );

  const registerCylinderRef = useCallback(
    (playerId: string) => (el: HTMLDivElement | null) => {
      if (el) cylinderRefs.current.set(playerId, el);
      else cylinderRefs.current.delete(playerId);
    },
    []
  );

  const onRouletteComplete = useCallback(() => {
    setRoulette(null);
    rouletteResolveRef.current?.();
    rouletteResolveRef.current = null;
  }, []);

  // Keep ref in sync whenever state updates
  useEffect(() => {
    myNameRef.current = myName;
  }, [myName]);

  useEffect(() => {
    selectedCardsRef.current = selectedCards;
  }, [selectedCards]);

  useEffect(() => {
    playersRef.current = gameState?.players ?? [];
  }, [gameState?.players]);

  useEffect(() => {
    myHandRef.current = myHand;
  }, [myHand]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Toast + bell when it becomes your turn.
  useEffect(() => {
    const turnName = gameState?.whosTurn?.name ?? null;
    if (!turnName) return;
    if (lastTurnNameRef.current === turnName) return;
    lastTurnNameRef.current = turnName;
    if (turnName === myNameRef.current && gameState?.gameStarted) {
      pushToast('info', 'Your turn');
      playSfx('turnBell');
    }
  }, [gameState?.whosTurn?.name, gameState?.gameStarted]);


  useEffect(() => {
    function onJoinEvent(value: GameState) {
      console.log('join event received', value);
      setGameState(value);
    }

    function onGameStateEvent(value: GameState) {
      console.log('game state event received', value);
      setGameState(value);
    }

    function onGetHandEvent(value: GameState) {
      console.log('get hand event received', value);
      const me = value.players.find(p => p.name === myNameRef.current);
      const nextHand = me?.hand ?? [];
      setMyHand(nextHand);
      if (nextHand.length > 0) {
        playSfx('cardDeal');
      }
      console.log('value', JSON.stringify(value, null, 2));
    }

    function onErrorEvent(value: string) {
      console.log('error event received', value);
      pushToast('error', value);
    }

    function onPlayCardsEvent(name: string, numCards: number) {
      console.log('play cards event received', name, numCards);

      const isMine = name === myNameRef.current;
      const players = playersRef.current;
      const playerIdx = players.findIndex(p => p.name === name);
      const player = playerIdx >= 0 ? players[playerIdx] : null;

      // Determine which card IDs to fly. For me: my selected cards (real
      // ranks). For opponents: the last `numCards` of their visible '?'
      // hand — they're identical face-down so order is decorative.
      let sourceCards: LiarCard[] = [];
      if (isMine) {
        const selected = selectedCardsRef.current;
        const mine = myHandRef.current;
        sourceCards = selected
          .map(id => mine.find(c => c.id === id))
          .filter((c): c is LiarCard => Boolean(c));
      } else if (player?.hand?.length) {
        const slice = player.hand.slice(-numCards);
        sourceCards = slice;
      }

      const playArea = playAreaRef.current;
      if (sourceCards.length > 0 && playArea) {
        const playRect = rectFromDOMRect(playArea.getBoundingClientRect());
        const targets = computeLandingTargets(playRect, sourceCards.length);

        const newGhosts: GhostSpec[] = [];
        sourceCards.forEach((card, i) => {
          const el = cardRefs.current.get(card.id);
          if (!el) return;
          const src = rectFromDOMRect(el.getBoundingClientRect());
          newGhosts.push({
            key: `ghost-${++ghostKeyRef.current}`,
            card,
            src,
            dst: targets[i],
            delayMs: i * STAGGER_MS,
            faceUpStart: isMine && card.rank !== '?',
            faceUpEnd: false,
          });
          // Match the visual stagger with one cardFlick per ghost.
          window.setTimeout(() => playSfx('cardFlick'), i * STAGGER_MS);
        });

        if (newGhosts.length > 0) {
          setGhosts(prev => [...prev, ...newGhosts]);
        }

        if (isMine) {
          const idsToHide = sourceCards.map(c => c.id);
          setLeavingCardIds(prev => {
            const next = new Set(prev);
            for (const id of idsToHide) next.add(id);
            return next;
          });
        }
      }

      setJustPlayed({ name, numCards });
      setSelectedCards([]);

      const declared = gameStateRef.current?.declaredRank;
      const rankWord = declared
        ? `${declared}${numCards === 1 ? '' : 's'}`
        : 'cards';
      pushToast('info', `${name} played ${numCards} ${rankWord}`);
    }

    function onResetGameEvent() {
      console.log('reset game event received');
      setJustPlayed(null);
      setSelectedCards([]);
      setGameState({} as GameState);
      setJustPlayed(null);
      setSelectedCards([]);
      clearAllToasts();
      setTopDeck([]);
      setGameEnded(null);
      setTableCards([]);
      setLeavingCardIds(new Set());
      setGhosts([]);
      setRoulette(null);
      rouletteResolveRef.current?.();
      rouletteResolveRef.current = null;
      callLiarPipelineRef.current = null;
      lastTurnNameRef.current = null;
    }

    function onCallLiarEvent(result: string, name: string, playedCards: LiarCard[], isShot: boolean) {
      console.log('call liar event received:');
      console.log('result:', result);
      console.log('name:', name);
      console.log('playedCards:', playedCards);
      console.log('isShot:', isShot);
      playSfx('liarCall');
      window.setTimeout(() => playSfx('reveal'), 150);
      pushToast(
        'liar',
        `${name} called Liar! ${result === 'success' ? 'It was a bluff.' : 'They were honest.'}`,
      );
      showTopDeck(playedCards);
      // Capture the whole top-deck + roulette pipeline so onGameEndEvent
      // can await it before flipping to the game-over screen.
      const p = showLiarResult(name, isShot);
      callLiarPipelineRef.current = p.finally(() => {
        if (callLiarPipelineRef.current === p) callLiarPipelineRef.current = null;
      });
    }

    async function showTopDeck(playedCards: LiarCard[]) {
      setTopDeck(playedCards);
    }

    async function showLiarResult(name: string, isShot: boolean) {
      console.log('about to start timer');
      const timer = await startTimer(3);
      console.log('timer started', timer);
      await runRoulette(name, isShot);

      getHand();

      setTopDeck([]);
      setJustPlayed(null);
      setTableCards([]);
      setLeavingCardIds(new Set());
    }

    function runRoulette(name: string, isShot: boolean): Promise<void> {
      return new Promise<void>(resolve => {
        const player = playersRef.current.find(p => p.name === name);
        const el = player ? cylinderRefs.current.get(player.playerId) : null;
        if (!player || !el) {
          // Graceful fallback — keep the existing pacing if we can't
          // measure the seat for any reason.
          window.setTimeout(resolve, 3000);
          return;
        }
        const r = el.getBoundingClientRect();
        rouletteResolveRef.current = resolve;
        setRoulette({
          playerId: player.playerId,
          name,
          isShot,
          seatRect: { left: r.left, top: r.top, width: r.width, height: r.height },
        });
      });
    }

    function getHand() {
      console.log('about to get hand');
      socket.emit('getHand', myName);
    }

    function startTimer(seconds: number) {
      // Reveal pacing for the top-deck flip-up. The timer used to drive
      // a visible numeric countdown; in Phase 6 the dwell is implicit
      // from the flip + roulette zoom, so this is now just a delay.
      return new Promise<boolean>(resolve => {
        window.setTimeout(() => resolve(true), seconds * 1000);
      });
    }

    async function onGameEndEvent(name: string) {
      console.log('game end event received', name);
      if (callLiarPipelineRef.current) {
        // A callLiar sequence is in flight (top-deck reveal + roulette +
        // cleanup). Wait for it to finish so the roulette animation plays
        // out fully before we flip to the game-over screen.
        await callLiarPipelineRef.current;
        // Brief pause so the post-shot seat cylinder (lethal red + OUT tag)
        // is visible for a moment before the game-over panel covers it.
        await new Promise<void>(r => window.setTimeout(r, 1000));
      } else {
        await startTimer(3);
      }
      playSfx('win');
      setGameEnded({ gameEnded: true, winnerName: name });
    }

    function onRoomCreatedEvent(roomName: string) {
      console.log('room created event received', roomName);
      setCurrentRoom(roomName);
    }

    function onRoomLeftEvent(roomName: string) {
      console.log('room left event received', roomName);
      setCurrentRoom('');
      setCanReadyUp(false);
      setMyName('');
    }

    function onUsernameSetEvent(name: string) {
      console.log('username set event received', name);
      setMyName(name);
      setCanReadyUp(true);
    }

    function onRoomJoinedEvent(roomName: string) {
      console.log('room joined event received', roomName);
      setCurrentRoom(roomName);
    }

    function onClearStateEvent() {
      console.log('clear state event received');
      setJustPlayed(null);
      setSelectedCards([]);
      setGameState({} as GameState);
      setJustPlayed(null);
      setSelectedCards([]);
      clearAllToasts();
      setTopDeck([]);
      setGameEnded(null);
      setTableCards([]);
      setLeavingCardIds(new Set());
      setGhosts([]);
      setRoulette(null);
      rouletteResolveRef.current?.();
      rouletteResolveRef.current = null;
      callLiarPipelineRef.current = null;
      lastTurnNameRef.current = null;
    }

    function onSessionTokenEvent(sessionToken: string) {
      console.log('session token event received', sessionToken);
      localStorage.setItem('sessionToken', sessionToken);
    }

    socket.on('join', onJoinEvent);
    socket.on('gameState', onGameStateEvent);
    socket.on('getHand', onGetHandEvent);
    socket.on('error', onErrorEvent);
    socket.on('playCards', onPlayCardsEvent);
    socket.on('resetGame', onResetGameEvent);
    socket.on('callLiar', onCallLiarEvent);
    socket.on('gameEnd', onGameEndEvent);
    socket.on('roomCreated', onRoomCreatedEvent);
    socket.on('roomLeft', onRoomLeftEvent);
    socket.on('usernameSet', onUsernameSetEvent);
    socket.on('roomJoined', onRoomJoinedEvent);
    socket.on('clearState', onClearStateEvent);
    socket.on('sessionToken', onSessionTokenEvent);

    return () => {
      socket.off('join', onJoinEvent);
      socket.off('gameState', onGameStateEvent);
      socket.off('getHand', onGetHandEvent);
      socket.off('error', onErrorEvent);
      socket.off('playCards', onPlayCardsEvent);
      socket.off('resetGame', onResetGameEvent);
      socket.off('callLiar', onCallLiarEvent);
      socket.off('gameEnd', onGameEndEvent);
      socket.off('roomCreated', onRoomCreatedEvent);
      socket.off('roomLeft', onRoomLeftEvent);
      socket.off('usernameSet', onUsernameSetEvent);
      socket.off('roomJoined', onRoomJoinedEvent);
      socket.off('clearState', onClearStateEvent);
      socket.off('sessionToken', onSessionTokenEvent);
    };
  }, []);

  useEffect(() => {
    console.log('useEffect gameState.gameStarted', gameState.gameStarted);
    if (gameState.gameStarted && !gameEnded) {
      console.log('inside if gameState.gameStarted');
      socket.emit('getHand', myName);
    }
  }, [gameState.gameStarted, justPlayed, gameEnded]);

  // Order players starting with me, so I always sit at position 0 (bottom)
  const playersInOrder = useMemo(() => {
    const meIndex = gameState?.players?.findIndex(p => p.name === myName);
    if (!gameState?.players || meIndex === -1) return [];

    const ordered: Player[] = [];
    for (let i = 0; i < gameState.players.length; i++) {
      ordered.push(gameState.players[(meIndex + i) % gameState.players.length]);
    }
    return ordered;
  }, [gameState?.players, myName, myHand]);

  const handleToggle = useCallback((card: LiarCard) => {
    primeAudio();
    playSfx('cardSelect');
    setSelectedCards(prev =>
      prev.includes(card.id) ? prev.filter(id => id !== card.id) : [...prev, card.id]
    );
  }, []);

  const onGhostLand = useCallback((g: GhostSpec) => {
    setGhosts(prev => prev.filter(x => x.key !== g.key));
    setTableCards(prev => [
      ...prev,
      {
        id: g.card.id,
        rotateDeg: g.dst.rotateDeg,
        offsetX: g.dst.rotateDeg * 2,
      },
    ]);
  }, []);

  // Derive the active screen from existing state — no new socket events.
  const screen: Screen = !currentRoom
    ? 'lobby'
    : gameEnded
      ? 'gameOver'
      : gameState.gameStarted
        ? 'playing'
        : 'room';

  const leaveRoom = () => {
    primeAudio();
    playSfx('button');
    socket.emit('leaveRoom', currentRoom);
    console.log('leaving room:', currentRoom, ' and removing session token');
    localStorage.removeItem('sessionToken');
    clearAllToasts();
    lastTurnNameRef.current = null;
  };

  const onPlayCardsClick = () => {
    primeAudio();
    playSfx('button');
    socket.emit('playCards', selectedCards);
  };

  const onCallLiarClick = () => {
    primeAudio();
    playSfx('button');
    socket.emit('callLiar');
  };

  const onLobbyCreate = (name: string) => {
    primeAudio();
    playSfx('button');
    socket.emit('createRoom', name);
  };

  const onLobbyJoin = (name: string) => {
    primeAudio();
    playSfx('button');
    socket.emit('joinRoom', name);
  };

  const onRoomSetUsername = (name: string) => {
    primeAudio();
    playSfx('button');
    socket.emit('setUsername', name, currentRoom);
  };

  const onRoomReady = () => {
    primeAudio();
    playSfx('button');
    socket.emit('ready', myName);
  };

  const onGameOverReady = () => {
    primeAudio();
    playSfx('button');
    socket.emit('ready');
    setGameEnded(null);
  };

  const showLeaveInAudioPanel = screen === 'room' || screen === 'playing' || screen === 'gameOver';

  return (
    <>
      <div
        className={`bg ${screen !== 'playing' ? 'bg--blurred' : ''}`}
        style={{ backgroundImage: `url(${tableBackground})` }}
      />

      <Toasts />

      <AudioControls
        onAbout={() => setAboutOpen(true)}
        onLeaveRoom={showLeaveInAudioPanel ? leaveRoom : undefined}
      />

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

      {screen === 'lobby' && (
        <LobbyScreen onCreate={onLobbyCreate} onJoin={onLobbyJoin} />
      )}

      {screen === 'room' && (
        <RoomScreen
          myName={myName}
          players={gameState.players ?? []}
          currentRoom={currentRoom}
          canReadyUp={canReadyUp}
          onSetUsername={onRoomSetUsername}
          onReady={onRoomReady}
          onLeave={leaveRoom}
        />
      )}

      {screen === 'gameOver' && gameEnded && (
        <GameOverScreen
          winnerName={gameEnded.winnerName}
          onReady={onGameOverReady}
          onLeave={leaveRoom}
        />
      )}

      {screen === 'playing' && (
        <div className="playing-screen">
          <DeclaredRankBanner rank={gameState.declaredRank} />

          <div
            className={`playing-actions ${gameState.gameStarted ? 'playing-actions--visible' : 'playing-actions--hidden'} ${gameState.whosTurn?.name === myName ? 'my-turn' : ''}`}
          >
            <button
              type="button"
              className="btn btn--primary playing-actions__play"
              disabled={
                gameState.whosTurn?.name !== myName || selectedCards.length === 0
              }
              onClick={onPlayCardsClick}
            >
              Play Cards
            </button>
            {gameState.whosTurn?.name === myName && gameState.whosTurn?.canCallLiar ? (
              <button type="button" className="btn playing-actions__liar" onClick={onCallLiarClick}>
                Call Liar
              </button>
            ) : (
              <button type="button" className="btn playing-actions__liar" disabled>
                Call Liar
              </button>
            )}
          </div>

          {/* Play area at felt center — landed cards lay flat */}
          <div className="play-area" ref={playAreaRef}>
            {topDeck.length > 0 ? (
              <div className="play-area__cards">
                {topDeck.map((card, i) => {
                  const n = topDeck.length;
                  const t = n > 1 ? (i - (n - 1) / 2) : 0;
                  const scatter = t * 7;
                  const offsetX = t * 14;
                  return (
                    <PlayingCard
                      key={card.id}
                      card={card}
                      faceUp
                      selected={false}
                      disabled
                      onToggle={() => { }}
                      className="play-area__card"
                      style={{
                        transform: `translate(-50%, -50%) translate(${offsetX}px, 0) rotate(${scatter}deg)`,
                        zIndex: i,
                      }}
                    />
                  );
                })}
              </div>
            ) : tableCards.length > 0 ? (
              <div className="play-area__cards">
                {tableCards.map((tc, i) => (
                  <PlayingCard
                    key={tc.id}
                    card={{ id: tc.id, rank: '?' }}
                    faceUp={false}
                    selected={false}
                    disabled
                    onToggle={() => { }}
                    className="play-area__card"
                    style={{
                      transform: `translate(-50%, -50%) translate(${tc.offsetX}px, 0) rotate(${tc.rotateDeg}deg)`,
                      zIndex: i,
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {playersInOrder?.map((player, playerIndex) => {
            const isMe = player.name === myName;

            // You get real cards, opponents get their hidden '?' cards from gameState
            const cards = isMe
              ? myHand
              : player.hand;

            const isRouletteTarget = roulette?.playerId === player.playerId;
            return (
              <PlayerHand
                key={player.playerId}
                player={player}
                playerIndex={playerIndex}
                cards={cards}
                isMyTurn={gameState.whosTurn?.name === myName}
                isActive={gameState.whosTurn?.playerId === player.playerId}
                selectedCards={selectedCards}
                onToggle={handleToggle}
                registerCardRef={registerCardRef}
                leavingCardIds={leavingCardIds}
                cylinderHidden={isRouletteTarget}
                suppressEliminated={isRouletteTarget}
                registerCylinderRef={registerCylinderRef}
              />
            );
          })}

          {roulette && (
            <RouletteOverlay
              seatRect={roulette.seatRect}
              isShot={roulette.isShot}
              onComplete={onRouletteComplete}
            />
          )}

          {/* Ghost layer — portaled to body inside CardGhost itself */}
          {ghosts.map(g => (
            <CardGhost
              key={g.key}
              card={g.card}
              src={g.src}
              dst={g.dst}
              delayMs={g.delayMs}
              faceUpStart={g.faceUpStart}
              faceUpEnd={g.faceUpEnd}
              onLand={() => onGhostLand(g)}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default App
