import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Card, CardColor } from '../types';

export interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  hostName: string;
  inGame: boolean;
}

export interface NetworkPlayer {
  id: string;
  name: string;
  avatar: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export const useNetwork = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [myId, setMyId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [roomPlayers, setRoomPlayers] = useState<NetworkPlayer[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [roomMaxPlayers, setRoomMaxPlayers] = useState(4);

  const connect = useCallback((url?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = url || `ws://${window.location.hostname}:3001`;
    setStatus('connecting');
    setError('');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      // Fetch room list
      ws.send(JSON.stringify({ type: 'get_rooms' }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'room_list':
          setRooms(msg.rooms || []);
          break;
        case 'room_created':
          setRoomId(msg.roomId);
          setMyId(msg.playerId);
          setIsHost(true);
          setRoomMaxPlayers(msg.room?.maxPlayers || 4);
          setRoomPlayers([{ id: msg.playerId, name: '', avatar: '' }]);
          break;
        case 'player_joined':
          setRoomPlayers(msg.players || []);
          setMyId(msg.myId);
          break;
        case 'player_left':
          setRoomPlayers(msg.players || []);
          break;
        case 'game_state':
          setGameState(msg.state);
          setMyId(msg.myId);
          break;
        case 'game_reset':
          setGameState(null);
          break;
        case 'error':
          setError(msg.message);
          break;
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      setGameState(null);
      setRoomPlayers([]);
      setRoomId('');
    };

    ws.onerror = () => {
      setError('连接失败，请确认服务器已启动');
      setStatus('disconnected');
    };
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setGameState(null);
    setRoomPlayers([]);
    setRoomId('');
  }, []);

  const refreshRooms = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'get_rooms' }));
    }
  }, []);

  const createRoom = useCallback((playerName: string, avatar: string, maxPlayers: number = 4) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'create_room',
        playerName,
        avatar,
        maxPlayers,
      }));
    }
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string, avatar: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join_room',
        roomId,
        playerName,
        avatar,
      }));
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
    }
    setRoomId('');
    setRoomPlayers([]);
    setRoomMaxPlayers(4);
    setGameState(null);
  }, []);

  const startGame = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_game' }));
    }
  }, []);

  const playCard = useCallback((cardId: string, selectedColor?: CardColor) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'play_card',
        cardId,
        selectedColor,
      }));
    }
  }, []);

  const drawCard = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'draw_card' }));
    }
  }, []);

  const callUno = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'call_uno' }));
    }
  }, []);

  const catchUno = useCallback((targetPlayerId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'catch_uno',
        targetPlayerId,
      }));
    }
  }, []);

  const restartGame = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'restart_game' }));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    status,
    rooms,
    myId,
    roomId,
    roomPlayers,
    roomMaxPlayers,
    gameState,
    error,
    isHost,
    connect,
    disconnect,
    refreshRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    playCard,
    drawCard,
    callUno,
    catchUno,
    restartGame,
    clearError: () => setError(''),
  };
};
