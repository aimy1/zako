import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Types ---
type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
type CardType =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

interface Card {
  id: string;
  color: CardColor;
  type: CardType;
}

interface Player {
  id: string;
  name: string;
  isAI: boolean;
  hand: Card[];
  isUno: boolean;
  avatar?: string;
}

interface Room {
  id: string;
  name: string;
  hostId: string;
  players: { ws: WebSocket; id: string; name: string; avatar: string }[];
  maxPlayers: number;
  gameState: GameState | null;
}

interface GameState {
  status: 'playing' | 'gameover';
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  deck: Card[];
  discardPile: Card[];
  currentColor: CardColor;
  pendingDraw: number;
  pendingAction: 'none' | 'wild_color_select';
  pendingWildCardInfo: { playerId: string; card: Card } | null;
  winner: Player | null;
  logs: string[];
}

// --- Helpers ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COLORS: CardColor[] = ['red', 'yellow', 'green', 'blue'];
const NUMBERS: CardType[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ACTIONS: CardType[] = ['skip', 'reverse', 'draw2'];

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  COLORS.forEach((color) => {
    deck.push({ id: `card_${id++}`, color, type: '0' });
    for (let i = 0; i < 2; i++) {
      NUMBERS.forEach((num) => deck.push({ id: `card_${id++}`, color, type: num }));
      ACTIONS.forEach((action) => deck.push({ id: `card_${id++}`, color, type: action }));
    }
  });
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${id++}`, color: 'wild', type: 'wild' });
    deck.push({ id: `card_${id++}`, color: 'wild', type: 'wild4' });
  }
  return shuffle(deck);
}

function isValidPlay(card: Card, topCard: Card, currentColor: CardColor, pendingDraw: number = 0): boolean {
  if (pendingDraw > 0) {
    if (topCard.type === 'draw2' && card.type === 'draw2') return true;
    if (topCard.type === 'wild4' && card.type === 'wild4') return true;
    return false;
  }
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.type === topCard.type && topCard.color !== 'wild') return true;
  return false;
}

function determineAITurn(
  hand: Card[], topCard: Card, currentColor: CardColor,
  nextPlayerCount: number, pendingDraw: number = 0
): { card: Card | null; selectedColor?: CardColor } {
  const validCards = hand.filter(card => isValidPlay(card, topCard, currentColor, pendingDraw));
  if (validCards.length === 0) return { card: null };

  const colorCards = validCards.filter(c => c.color !== 'wild');
  const actionCards = colorCards.filter(c => ['skip', 'reverse', 'draw2'].includes(c.type));
  const numberCards = colorCards.filter(c => !['skip', 'reverse', 'draw2'].includes(c.type));
  const wildCards = validCards.filter(c => c.color === 'wild');

  let chosenCard: Card | null = null;
  if (nextPlayerCount <= 2 && actionCards.length > 0) chosenCard = actionCards[0];
  else if (numberCards.length > 0) chosenCard = numberCards[Math.floor(Math.random() * numberCards.length)];
  else if (actionCards.length > 0) chosenCard = actionCards[Math.floor(Math.random() * actionCards.length)];
  else if (wildCards.length > 0) chosenCard = wildCards[0];
  if (!chosenCard) chosenCard = validCards[0];

  let selectedColor: CardColor | undefined;
  if (chosenCard.color === 'wild') {
    const counts: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
    hand.forEach(c => { if (c.color !== 'wild') counts[c.color]++; });
    let max = -1, best = 'red';
    for (const [col, cnt] of Object.entries(counts)) {
      if (cnt > max) { max = cnt; best = col; }
    }
    selectedColor = best as CardColor;
  }
  return { card: chosenCard, selectedColor };
}

function getCardTypeName(type: string): string {
  switch (type) {
    case 'skip': return '跳过';
    case 'reverse': return '反转';
    case 'draw2': return '+2';
    default: return type.toUpperCase();
  }
}

function getColorName(color: string): string {
  switch (color) {
    case 'red': return '红色';
    case 'blue': return '蓝色';
    case 'green': return '绿色';
    case 'yellow': return '黄色';
    default: return color;
  }
}

// --- Server ---
const app = express();
const server = http.createServer(app);

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const wss = new WebSocketServer({ server });

const rooms = new Map<string, Room>();
const wsToRoom = new Map<WebSocket, string>();
const wsToPlayerId = new Map<WebSocket, string>();

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function send(ws: WebSocket, data: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastRoom(roomId: string, data: any, excludeWs?: WebSocket) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.players.forEach(p => {
    if (p.ws !== excludeWs) send(p.ws, data);
  });
}

function broadcastRoomAll(roomId: string, data: any) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.players.forEach(p => send(p.ws, data));
}

function getPublicRoomList(): any[] {
  return Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    playerCount: r.players.length,
    maxPlayers: r.maxPlayers,
    hostName: r.players.find(p => p.id === r.hostId)?.name || '',
    inGame: r.gameState !== null,
  }));
}

function buildPlayerListForClient(room: Room, targetWs: WebSocket): Player[] {
  const gameState = room.gameState;
  if (!gameState) {
    return room.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      isAI: false,
      hand: [],
      isUno: false,
      avatar: p.avatar,
    }));
  }
  // Return full state - each player only sees their own hand
  return gameState.players.map(p => {
    const roomPlayer = room.players.find(rp => rp.id === p.id);
    if (roomPlayer && roomPlayer.ws === targetWs) {
      return p; // Full hand for self
    }
    return { ...p, hand: [] }; // Empty hand for others
  });
}

function sendGameStateToAll(room: Room) {
  if (!room.gameState) return;
  room.players.forEach(p => {
    const publicPlayers = buildPlayerListForClient(room, p.ws);
    send(p.ws, {
      type: 'game_state',
      state: { ...room.gameState, players: publicPlayers },
      myId: p.id,
    });
  });
}

function initGame(room: Room) {
  let deck = createDeck();
  const players: Player[] = room.players.map((p, i) => ({
    id: p.id,
    name: p.name,
    isAI: false,
    hand: [],
    isUno: false,
    avatar: p.avatar,
  }));

  for (let i = 0; i < 7; i++) {
    players.forEach(p => p.hand.push(deck.pop()!));
  }

  let firstCard = deck.pop()!;
  while (firstCard.color === 'wild' || ['skip', 'reverse', 'draw2'].includes(firstCard.type)) {
    deck.unshift(firstCard);
    firstCard = deck.pop()!;
  }

  room.gameState = {
    status: 'playing',
    players,
    currentPlayerIndex: 0,
    direction: 1,
    deck,
    discardPile: [firstCard],
    currentColor: firstCard.color,
    pendingDraw: 0,
    pendingAction: 'none',
    pendingWildCardInfo: null,
    winner: null,
    logs: ['游戏开始！'],
  };

  sendGameStateToAll(room);
  processAITurns(room);
}

function processAITurns(room: Room) {
  if (!room.gameState || room.gameState.status !== 'playing') return;
  const gs = room.gameState;
  const currentPlayer = gs.players[gs.currentPlayerIndex];
  if (currentPlayer.isAI) return; // Only process real player turns

  // Check winner
  const winner = gs.players.find(p => p.hand.length === 0);
  if (winner) {
    gs.status = 'gameover';
    gs.winner = winner;
    sendGameStateToAll(room);
    return;
  }
}

function advanceTurn(room: Room) {
  if (!room.gameState) return;
  const gs = room.gameState;

  // Check winner
  const winner = gs.players.find(p => p.hand.length === 0);
  if (winner) {
    gs.status = 'gameover';
    gs.winner = winner;
    sendGameStateToAll(room);
    return;
  }

  sendGameStateToAll(room);
}

function doDrawCard(room: Room, playerId: string) {
  const gs = room.gameState!;
  const pIdx = gs.players.findIndex(p => p.id === playerId);
  if (pIdx === -1 || pIdx !== gs.currentPlayerIndex) return;

  let deck = [...gs.deck];
  let discard = [...gs.discardPile];
  const players = gs.players.map(p => ({ ...p, hand: [...p.hand] }));

  if (gs.pendingDraw > 0) {
    const curr = players[pIdx];
    for (let i = 0; i < gs.pendingDraw; i++) {
      if (deck.length === 0) {
        const top = discard.pop()!;
        deck = shuffle(discard);
        discard = [top];
      }
      const drawn = deck.pop();
      if (drawn) curr.hand.push(drawn);
    }
    players[pIdx] = curr;
    const nextIdx = (pIdx + gs.direction + players.length) % players.length;
    gs.players = players;
    gs.deck = deck;
    gs.discardPile = discard;
    gs.pendingDraw = 0;
    gs.currentPlayerIndex = nextIdx;
    gs.logs = [`${curr.name} 摸了${gs.pendingDraw || '多'}张惩罚牌！`, ...gs.logs].slice(0, 10);
    advanceTurn(room);
    return;
  }

  if (deck.length === 0) {
    const top = discard.pop()!;
    deck = shuffle(discard);
    discard = [top];
  }
  const drawn = deck.pop();
  if (!drawn) return;

  const curr = players[pIdx];
  curr.hand.push(drawn);
  curr.isUno = false;
  players[pIdx] = curr;

  const nextIdx = (pIdx + gs.direction + players.length) % players.length;
  gs.players = players;
  gs.deck = deck;
  gs.discardPile = discard;
  gs.currentPlayerIndex = nextIdx;
  gs.logs = [`${curr.name} 摸了一张牌。`, ...gs.logs].slice(0, 10);
  advanceTurn(room);
}

function doPlayCard(room: Room, playerId: string, cardId: string, selectedColor?: CardColor) {
  const gs = room.gameState!;
  const pIdx = gs.players.findIndex(p => p.id === playerId);
  if (pIdx === -1 || pIdx !== gs.currentPlayerIndex) return;
  if (gs.pendingAction !== 'none' && gs.pendingAction !== 'wild_color_select') return;

  const currPlayer = gs.players[pIdx];
  const card = currPlayer.hand.find(c => c.id === cardId);
  if (!card) return;

  const topCard = gs.discardPile[gs.discardPile.length - 1];
  if (!isValidPlay(card, topCard, gs.currentColor, gs.pendingDraw)) return;

  if (card.color === 'wild') {
    if (gs.pendingAction === 'none') {
      gs.pendingAction = 'wild_color_select';
      gs.pendingWildCardInfo = { playerId, card };
      sendGameStateToAll(room);
      return;
    }
    // Color selected
    const color = selectedColor || 'red';
    const newHand = currPlayer.hand.filter(c => c.id !== card.id);
    const newIsUno = newHand.length === 1;
    const players = gs.players.map((p, i) =>
      i === pIdx ? { ...p, hand: newHand, isUno: newIsUno } : { ...p, hand: [...p.hand] }
    );

    let nextIdx = (pIdx + gs.direction + players.length) % players.length;
    let pendingDraw = gs.pendingDraw;

    if (card.type === 'wild4') {
      pendingDraw += 4;
    }

    gs.players = players;
    gs.discardPile = [...gs.discardPile, card];
    gs.currentColor = color;
    gs.currentPlayerIndex = nextIdx;
    gs.pendingDraw = pendingDraw;
    gs.pendingAction = 'none';
    gs.pendingWildCardInfo = null;
    const logMsg = card.type === 'wild4'
      ? `${currPlayer.name} 出了+4万能牌。颜色: ${getColorName(color)}`
      : `${currPlayer.name} 出了万能牌。颜色: ${getColorName(color)}`;
    gs.logs = [logMsg, ...gs.logs].slice(0, 10);
    if (newHand.length === 1) gs.logs.unshift(`${currPlayer.name} 喊了UNO！`);
    advanceTurn(room);
    return;
  }

  // Non-wild card
  const newHand = currPlayer.hand.filter(c => c.id !== card.id);
  const newIsUno = newHand.length === 1;
  const players = gs.players.map((p, i) =>
    i === pIdx ? { ...p, hand: newHand, isUno: newIsUno } : { ...p, hand: [...p.hand] }
  );

  let nextDirection = gs.direction;
  let nextIdx = (pIdx + nextDirection + players.length) % players.length;

  if (card.type === 'reverse') {
    nextDirection = nextDirection === 1 ? -1 : 1;
    if (players.length === 2) {
      nextIdx = pIdx;
    } else {
      nextIdx = (pIdx + nextDirection + players.length) % players.length;
    }
  } else if (card.type === 'skip') {
    nextIdx = (nextIdx + nextDirection + players.length) % players.length;
  }

  let nextPendingDraw = gs.pendingDraw;
  if (card.type === 'draw2') {
    nextPendingDraw += 2;
  }

  gs.players = players;
  gs.discardPile = [...gs.discardPile, card];
  gs.currentColor = card.color;
  gs.direction = nextDirection;
  gs.currentPlayerIndex = nextIdx;
  gs.pendingDraw = nextPendingDraw;
  const logMsg = `${currPlayer.name} 出了${getColorName(card.color)} ${getCardTypeName(card.type)}`;
  gs.logs = [logMsg, ...gs.logs].slice(0, 10);
  if (newHand.length === 1) gs.logs.unshift(`${currPlayer.name} 喊了UNO！`);
  advanceTurn(room);
}

function doCallUno(room: Room, playerId: string) {
  const gs = room.gameState!;
  const pIdx = gs.players.findIndex(p => p.id === playerId);
  if (pIdx === -1) return;
  const p = gs.players[pIdx];
  if (p.hand.length <= 2 && !p.isUno) {
    gs.players = gs.players.map((pl, i) =>
      i === pIdx ? { ...pl, isUno: true } : pl
    );
    gs.logs = [`${p.name} 喊了UNO！`, ...gs.logs].slice(0, 15);
    sendGameStateToAll(room);
  }
}

function doCatchUno(room: Room, targetPlayerId: string) {
  const gs = room.gameState!;
  const pIdx = gs.players.findIndex(p => p.id === targetPlayerId);
  if (pIdx === -1) return;
  const p = gs.players[pIdx];
  if (p.hand.length === 1 && !p.isUno) {
    const players = gs.players.map(pl => ({ ...pl, hand: [...pl.hand] }));
    let deck = [...gs.deck];
    let discard = [...gs.discardPile];
    for (let i = 0; i < 2; i++) {
      if (deck.length === 0) {
        const top = discard.pop()!;
        deck = shuffle(discard);
        discard = [top];
      }
      const drawn = deck.pop();
      if (drawn) players[pIdx].hand.push(drawn);
    }
    gs.players = players;
    gs.deck = deck;
    gs.discardPile = discard;
    gs.logs = [`${p.name} 忘记喊UNO，摸了2张牌！`, ...gs.logs].slice(0, 15);
    sendGameStateToAll(room);
  }
}

// --- WebSocket Handler ---
wss.on('connection', (ws) => {
  let currentRoomId: string | null = null;
  let myPlayerId: string | null = null;

  ws.on('message', (raw) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case 'get_rooms': {
        send(ws, { type: 'room_list', rooms: getPublicRoomList() });
        break;
      }

      case 'create_room': {
        const roomId = generateRoomId();
        const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const room: Room = {
          id: roomId,
          name: msg.roomName || `房间 ${roomId}`,
          hostId: playerId,
          players: [{ ws, id: playerId, name: msg.playerName || '玩家', avatar: msg.avatar || '👨‍🚀' }],
          maxPlayers: msg.maxPlayers || 4,
          gameState: null,
        };
        rooms.set(roomId, room);
        wsToRoom.set(ws, roomId);
        wsToPlayerId.set(ws, playerId);
        currentRoomId = roomId;
        myPlayerId = playerId;
        send(ws, { type: 'room_created', roomId, playerId, room: { id: roomId, name: room.name, maxPlayers: room.maxPlayers } });
        break;
      }

      case 'join_room': {
        const room = rooms.get(msg.roomId);
        if (!room) {
          send(ws, { type: 'error', message: '房间不存在' });
          return;
        }
        if (room.players.length >= room.maxPlayers) {
          send(ws, { type: 'error', message: '房间已满' });
          return;
        }
        if (room.gameState) {
          send(ws, { type: 'error', message: '游戏已开始' });
          return;
        }
        const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        room.players.push({ ws, id: playerId, name: msg.playerName || '玩家', avatar: msg.avatar || '👨‍' });
        wsToRoom.set(ws, msg.roomId);
        wsToPlayerId.set(ws, playerId);
        currentRoomId = msg.roomId;
        myPlayerId = playerId;

        // Notify all players in room
        broadcastRoomAll(msg.roomId, {
          type: 'player_joined',
          players: room.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar })),
          myId: playerId,
        });
        break;
      }

      case 'leave_room': {
        if (currentRoomId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            room.players = room.players.filter(p => p.ws !== ws);
            if (room.players.length === 0) {
              rooms.delete(currentRoomId);
            } else {
              broadcastRoomAll(currentRoomId, {
                type: 'player_left',
                players: room.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar })),
              });
            }
          }
          wsToRoom.delete(ws);
          wsToPlayerId.delete(ws);
          currentRoomId = null;
          myPlayerId = null;
        }
        send(ws, { type: 'room_list', rooms: getPublicRoomList() });
        break;
      }

      case 'start_game': {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        if (room.hostId !== myPlayerId) {
          send(ws, { type: 'error', message: '只有房主可以开始游戏' });
          return;
        }
        if (room.players.length < 2) {
          send(ws, { type: 'error', message: '至少需要2名玩家' });
          return;
        }
        if (room.players.length !== room.maxPlayers) {
          send(ws, { type: 'error', message: `需要${room.maxPlayers}名玩家才能开始，当前${room.players.length}名` });
          return;
        }
        initGame(room);
        break;
      }

      case 'play_card': {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room || !room.gameState) return;

        // Check if it's a wild card needing color selection
        if (msg.selectedColor) {
          doPlayCard(room, myPlayerId!, msg.cardId, msg.selectedColor);
        } else {
          doPlayCard(room, myPlayerId!, msg.cardId);
        }
        break;
      }

      case 'draw_card': {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room || !room.gameState) return;
        doDrawCard(room, myPlayerId!);
        break;
      }

      case 'call_uno': {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room || !room.gameState) return;
        doCallUno(room, myPlayerId!);
        break;
      }

      case 'catch_uno': {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room || !room.gameState) return;
        doCatchUno(room, msg.targetPlayerId);
        break;
      }

      case 'restart_game': {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        if (room.hostId !== myPlayerId) {
          send(ws, { type: 'error', message: '只有房主可以重新开始' });
          return;
        }
        room.gameState = null;
        broadcastRoomAll(currentRoomId, { type: 'game_reset' });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.players = room.players.filter(p => p.ws !== ws);
        if (room.players.length === 0) {
          rooms.delete(currentRoomId);
        } else {
          // If host left, assign new host
          if (room.hostId === myPlayerId) {
            room.hostId = room.players[0].id;
          }
          broadcastRoomAll(currentRoomId, {
            type: 'player_left',
            players: room.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar })),
          });
          // If game was running, end it
          if (room.gameState) {
            room.gameState = null;
            broadcastRoomAll(currentRoomId, { type: 'game_reset' });
          }
        }
      }
      wsToRoom.delete(ws);
      wsToPlayerId.delete(ws);
    }
  });
});

const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`UNO 服务器已启动: http://localhost:${PORT}`);
  console.log(`WebSocket 端口: ${PORT}`);
});
