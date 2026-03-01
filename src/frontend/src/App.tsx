import { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { socket } from './socket';

function App() {
  const [count, setCount] = useState(0);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fooEvents, setFooEvents] = useState<string[]>([]);
  const [helloMessage, setHelloMessage] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>({});
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [justPlayed, setJustPlayed] = useState<{name: string, numCards: number} | null>(null);

  type TableRank = 'king' | 'queen' | 'ace';
  type Rank = TableRank | 'joker';

  type Card = {
    id: number;
    rank: Rank | '?';
  }

  type Player = {
    socketId: string;
    name: string;
    ready: boolean;
    hand: Card[];
  }

  type GameState = {
    players: Player[];
    maxPlayers: number;
    gameStarted: boolean;
    whosTurn: Player | null;
    declaredRank: TableRank | null;
    moves: Record<Player['name'], Rank>[];
  }

  const selectCard = (card: Card) => {
    setSelectedCards(previous => [...previous, card.id]);
  }

  const deselectCard = (card: Card) => {
    setSelectedCards(previous => previous.filter(id => id !== card.id));
  }

  useEffect(() => {
    function onConnect() {
      if (socket.recovered) {
        // any event missed during the disconnection period will be received now
        console.log('User recovered connection', socket.id);
      }
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onJoinEvent(value: GameState) {
      console.log('join event received', value);
      setGameState(value);
    }

    function onFooEvent(value) {
      setFooEvents(previous => [...previous, value]);
    }

    function onHelloEvent(value) {
      console.log('hello event received', value);
      setHelloMessage(JSON.stringify(value));
    }

    function onCountEvent(value: number) {
      setCount(value);
    }

    function onGameStateEvent(value: GameState) {
      console.log('game state event received', value);
      setGameState(value);
    }

    function onGetHandEvent(value: GameState) {
      console.log('get hand event received', value);
      setGameState(value);
      console.log('value', JSON.stringify(value));
    }

    function onErrorEvent(value: string) {
      console.log('error event received', value);
      setErrors(previous => [...previous, value]);
    }

    function onPlayCardsEvent(name: string, numCards: number) {
      console.log('play cards event received', name, numCards);
      setJustPlayed({ name, numCards });
      setSelectedCards([]);
    }

    function onResetGameEvent() {
      console.log('reset game event received');
      setJustPlayed(null);
      setSelectedCards([]);
      setGameState({});
      setPlayers([]);
      setJustPlayed(null);
      setSelectedCards([]);
      setErrors([]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('foo', onFooEvent);
    socket.on('hello', onHelloEvent);
    socket.on('count', onCountEvent);
    socket.on('join', onJoinEvent);
    socket.on('gameState', onGameStateEvent);
    socket.on('getHand', onGetHandEvent);
    socket.on('error', onErrorEvent);
    socket.on('playCards', onPlayCardsEvent);
    socket.on('resetGame', onResetGameEvent);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('foo', onFooEvent);
      socket.off('hello', onHelloEvent);
      socket.off('count', onCountEvent);
      socket.off('join', onJoinEvent);
      socket.off('gameState', onGameStateEvent);
      socket.off('getHand', onGetHandEvent);
      socket.off('error', onErrorEvent);
      socket.off('playCards', onPlayCardsEvent);
      socket.off('resetGame', onResetGameEvent);
    };
  }, []);

  useEffect(() => {
    console.log('useEffect gameState.gameStarted', gameState.gameStarted);
    if (gameState.gameStarted) {
      console.log('inside if gameState.gameStarted');
      socket.emit('getHand', name);
    }
  }, [gameState.gameStarted, justPlayed])



  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => socket.emit('count', count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <input type="text" placeholder='Enter your name' value={name} onChange={e => setName(e.target.value)} />
      <button
        onClick={() => {
          socket.connect();
          socket.emit('join', name);
        }}
      > 
        Join Room
      </button>
      {errors?.map(error => {
        return (
          <div className="error-container" key={error}>
            <p className="error">{error}</p>
            <button onClick={() => setErrors(previous => previous.filter(e => e !== error))}>X</button>
          </div>
        )})}
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <button onClick={() => socket.connect()}>Connect</button>
      <button onClick={() => socket.disconnect()}>Disconnect</button>
      <button onClick={() => socket.emit('foo', 'bar')}>Send Foo Event</button>
      <button onClick={() => socket.emit('ready', name)}>Ready</button>
      <button onClick={() => socket.emit('resetGame')}>Reset Game</button>
      <p>Connected: {isConnected ? '✅' : '❌'}</p>
      <p>Hello Message: {helloMessage}</p>
      <p>Foo Events: {fooEvents.join(', ')}</p>
      <p>Players: {gameState.players?.map(player => player.name + (player.ready ? ' (Ready)' : ' (Not Ready)')).join(', ')}</p>
      <p>Game Started: {gameState.gameStarted ? 'Yes' : 'No'}</p>
      <p>Declared Rank: <b>{gameState.declaredRank}</b></p>
      <p>Whos Turn: {gameState.whosTurn?.name}</p>

      <div className={`${gameState.gameStarted ? 'game-started' : 'game-not-started'} ${gameState.whosTurn?.name === name ? 'my-turn' : ''}`}>
        <button disabled={gameState.whosTurn?.name !== name} onClick={() => socket.emit('move', name, 'a')} >Move A</button>
        <button disabled={gameState.whosTurn?.name !== name} onClick={() => socket.emit('move', name, 'b')}>Move B</button>
        <button disabled={gameState.whosTurn?.name !== name} onClick={() => socket.emit('move', name, 'c')}>Move C</button>
        <button disabled={gameState.whosTurn?.name !== name} onClick={() => socket.emit('playCards', selectedCards)}>Play Cards</button>
      </div>

      <p>Moves: {gameState?.moves?.map(move => `${move.player}: ${move.rank}`).join(', ')}</p> 
      {justPlayed && (
        <p><b>{justPlayed?.name} played {justPlayed?.numCards} { gameState.declaredRank ? ` ${gameState.declaredRank}` : '' } </b></p>
      )}
      <p>Hands: </p> 
      {gameState?.players?.map(player => (
        <div key={player.socketId}>
          <p>{player.name}</p>
          <div className="playing-card-container">
            {player.hand?.map((card, index) => (
              <PlayingCard
                key={card.id >= 0 ? card.id : `hidden-${index}`}
                card={card}
                selected={selectedCards.includes(card.id)}
                onToggle={() => selectedCards.includes(card.id) ? deselectCard(card) : selectCard(card)}
                disabled={gameState.whosTurn?.name !== name || card.rank === '?'}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export default App


const PlayingCard = ({ card, selected, disabled, onToggle }: { card: Card, selected: boolean, disabled: boolean, onToggle: () => void }) => { 

  return (
    <button disabled={disabled} className={`playing-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`} onClick={() => onToggle()}>
      <p>{card.rank}</p>
    </button>
  )
}