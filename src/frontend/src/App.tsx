import { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import tableBackground from './assets/table-background.png';
import './App.css'
import { socket } from './socket';
import type { Player, GameState, LiarCard, } from '../../shared/types';
import { PlayingCard } from './components/PlayingCard';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fooEvents, setFooEvents] = useState<string[]>([]);
  const [helloMessage, setHelloMessage] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [myName, setMyName] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>({});
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [justPlayed, setJustPlayed] = useState<{ name: string, numCards: number } | null>(null);
  const [iPlayedCards, setIPlayedCards] = useState<boolean>(false);
  const [topDeck, setTopDeck] = useState<LiarCard[]>([]);
  const [liarResult, setLiarResult] = useState<{ result: string, name: string, playedCards: LiarCard[] } | null>(null);
  const [gameEnded, setGameEnded] = useState<{ gameEnded: boolean, winnerName: string } | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [shotResult, setShotResult] = useState<{name: string, isShot: boolean} | null>(null);
  const [createRoomInput, setCreateRoomInput] = useState<string>('');
  const [joinRoomInput, setJoinRoomInput] = useState<string>('');
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [canReadyUp, setCanReadyUp] = useState<boolean>(false);
  
  const selectCard = (card: LiarCard) => {
    setSelectedCards(previous => [...previous, card.id]);
  }

  const deselectCard = (card: LiarCard) => {
    setSelectedCards(previous => previous.filter(id => id !== card.id));
  }

  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  useEffect(() => {
    console.log('useEffect topDeck', topDeck);
  }, [topDeck]);

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

    function onGameStateEvent(value: GameState) {
      console.log('game state event received', value);
      setGameState(value);
    }

    function onGetHandEvent(value: GameState) {
      console.log('get hand event received', value);
      setGameState(value);
      console.log('value', JSON.stringify(value, null, 2));
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
      setTopDeck([]);
      setLiarResult(null);
      setGameEnded(null);
      setTimer(0);
      setGameEnded(null);
    }

    function onCallLiarEvent(result: string, name: string, playedCards: LiarCard[], isShot: boolean) {
      console.log('call liar event received:');
      console.log('result:', result);
      console.log('name:', name);
      console.log('playedCards:', playedCards);
      console.log('isShot:', isShot);
      showTopDeck(playedCards);
      //setJustPlayed({ name, numCards: playedCards.length, playedCards });
      //setSelectedCards([]);
      showLiarResult(result, name, playedCards, isShot);
    }

    async function showTopDeck(playedCards: LiarCard[]) {
      setTopDeck(playedCards);
    }

    async function showLiarResult(result: string, name: string, playedCards: LiarCard[], isShot: boolean) {
      setLiarResult({ result, name, playedCards });
      console.log('about to start timer');
      const timer = await startTimer(3);
      console.log('timer started', timer);
      setShotResult({name, isShot});
      await startTimer(3);

      getHand();

      setTopDeck([]);
      setJustPlayed(null);
      setLiarResult(null);
      setShotResult(null);
     // setLiarResult(null);
    }

    function getHand() {
      console.log('about to get hand');
      socket.emit('getHand', myName);
    }

    function startTimer(seconds: number) {
      let secs = seconds;
      return new Promise(resolve => {
        setTimer(seconds);
        const interval = setInterval(() => {
          setTimer(previous => previous - 1);
          secs--;
          if (secs <= 0) {
            clearInterval(interval);
            resolve(true);
          }
        }, 1000);
      });
    }

    async function onGameEndEvent(name: string) {
      console.log('game end event received', name);
      await startTimer(3);
      setGameEnded({gameEnded: true, winnerName: name});
    }

    function onRoomCreatedEvent(roomName: string) {
      console.log('room created event received', roomName);
      setCurrentRoom(roomName);
    }

    function onRoomLeftEvent(roomName: string) {
      console.log('room left event received', roomName);
      setCurrentRoom('');
      setCanReadyUp(false);
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
      setGameState({});
      setPlayers([]);
      setJustPlayed(null);
      setSelectedCards([]);
      setErrors([]);
      setTopDeck([]);
      setLiarResult(null);
      setGameEnded(null);
      setTimer(0);
      setGameEnded(null);
    }

    function onSessionTokenEvent(sessionToken: string) {
      console.log('session token event received', sessionToken);
      localStorage.setItem('sessionToken', sessionToken);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('foo', onFooEvent);
    socket.on('hello', onHelloEvent);
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
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('foo', onFooEvent);
      socket.off('hello', onHelloEvent);
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
  }, [gameState.gameStarted, justPlayed, gameEnded])



  return (
    <>
      <div id="background-image">
        <img src={tableBackground} height="100%" width="100%" alt="Background" />
      </div>
      <div className='table-surface'>
        <PlayingCard style='table-card' card={{id: 1, rank: 'king'}} selected={false} disabled={false} onToggle={() => {}} />
      </div>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>

      {currentRoom ? (
        <>
          <div className="room-controls">
            <input type="text" placeholder='Enter a username' value={usernameInput} onChange={e => setUsernameInput(e.target.value)} />
            <button
              onClick={() => {
                socket.emit('setUsername', usernameInput, currentRoom);
                setUsernameInput('');
              }}
            > 
              Set Username
            </button>
          </div>

          <p>Current Room: {currentRoom}</p>
          <button onClick={() => {
            socket.emit('leaveRoom', currentRoom);
            console.log('leaving room:', currentRoom, ' and removing session token');
            localStorage.removeItem('sessionToken');
          }}>Leave Room</button>
        </>
      ) : (
        <>
          <input type="text" placeholder='Enter a room name' value={createRoomInput} onChange={e => setCreateRoomInput(e.target.value)} />
          <button
            onClick={() => {
              socket.emit('createRoom', createRoomInput);
              setCreateRoomInput('');
            }}
          > 
            Create Room
          </button>
    
          
          <input type="text" placeholder='Enter a room name' value={joinRoomInput} onChange={e => setJoinRoomInput(e.target.value)} />
          <button
            onClick={() => {
              // socket.connect();
              // socket.emit('join', myName);
              //
                socket.emit('joinRoom', joinRoomInput);
                setJoinRoomInput('');
            }}
          > 
            Join Room
          </button>
        </>
      )}

      {errors?.map(error => {
        return (
          <div className="error-container" key={error}>
            <p className="error">{error}</p>
            <button onClick={() => setErrors(previous => previous.filter(e => e !== error))}>X</button>
          </div>
        )
      })}
      
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <button onClick={() => socket.connect()}>Connect</button>
      <button onClick={() => socket.disconnect()}>Disconnect</button>
      <button onClick={() => socket.emit('foo', 'bar')}>Send Foo Event</button>
      <button disabled={!canReadyUp} onClick={() => socket.emit('ready', myName)}>Ready</button>
      <button onClick={() => socket.emit('resetGame')}>Reset Game</button>
      <p>Connected: {isConnected ? '✅' : '❌'}</p>
      <p>Hello Message: {helloMessage}</p>
      <p>Foo Events: {fooEvents.join(', ')}</p>
      <p>Players: {gameState.players?.map(player => player.name + (player.ready ? ' (Ready)' : ' (Not Ready)')).join(', ')}</p>
      <p>Game Started: {gameState.gameStarted ? 'Yes' : 'No'}</p>
      <p>Declared Rank: <b>{gameState.declaredRank}</b></p>
      <p>Whos Turn: {gameState.whosTurn?.name}</p>

      <div className={`${gameState.gameStarted ? 'game-started' : 'game-not-started'} ${gameState.whosTurn?.name === myName ? 'my-turn' : ''}`}>

        <button disabled={gameState.whosTurn?.name !== myName} onClick={() => {
          //socket.emit('playCards', selectedCards);
          setIPlayedCards(true);
        }}>Play Cards</button>
      </div>

      <p>Moves: {gameState?.moves?.map(move => `${move.player}: ${move.rank}`).join(', ')}</p> 
      {justPlayed && (
        <p><b>{justPlayed?.name} played {justPlayed?.numCards} { gameState.declaredRank ? ` ${gameState.declaredRank}` : '' } </b></p>
      )}

      {/* Timer */}
      {timer > 0 && (
        <p><b>{timer}</b></p>
      )}

      {/* Top Deck after Liar Call */}
      {topDeck.length > 0 && (
        <>
        <div className="top-deck-container">
          <p>Top Deck:</p>
          {topDeck.map(card => (
            <PlayingCard key={card.id} card={card} selected={false} disabled={false} onToggle={() => {}} />
          ))}
        </div>
        </>
      )}

      {/* Liar Result */}
      {liarResult && (
        <>
          <p>{`${liarResult?.result == 'success' ? 'They lied' : 'They didn\'t lie'}, ${liarResult?.name} plays roulette.`}</p>
          {shotResult && (
            <p><b>{`${shotResult?.name} ${shotResult?.isShot ? 'Is dead.' : 'Is still alive.'}`}</b></p>
          )}
        </>
      )}

      {/* Game Ended  */}
      {gameEnded && (
        <>
          <p><b>Game Ended: {gameEnded.winnerName} wins!</b></p>
          <button onClick={() => {
            socket.emit('ready');
            setGameEnded(null);
          }}>Ready Up</button>
        </>
      )}

      {(gameState.whosTurn?.name === myName && gameState.whosTurn?.canCallLiar) ? (
        <button onClick={() => socket.emit('callLiar')}>Call Liar</button>
      ) : (
        <button disabled={true}>Call Liar</button>
      )}
      <p>Hands: </p> 
      {gameState?.players?.map(player => (
        <div key={player.socketId}>
          <p>{player.name}</p>
          <div className="playing-card-container">
            {player.hand?.map((card, index) => (
              <PlayingCard
                played={selectedCards.includes(card.id) && iPlayedCards}
                key={card.id >= 0 ? card.id : `hidden-${index}`}
                card={card}
                selected={selectedCards.includes(card.id)}
                onToggle={() => selectedCards.includes(card.id) ? deselectCard(card) : selectCard(card)}
                disabled={gameState.whosTurn?.name !== myName || card.rank === '?'}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export default App
