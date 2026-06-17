import React, { useEffect, useState } from "react";
import { useUno } from "./hooks/useUno";
import { useNetwork } from "./hooks/useNetwork";
import { useAudio } from "./hooks/useAudio";
import { UnoCard } from "./components/UnoCard";
import { AIHand } from "./components/AIHand";
import { CyberConfetti } from "./components/CyberConfetti";
import { isValidPlay } from "./lib/deckUtil";
import { motion, AnimatePresence } from "motion/react";
import { ScrollText, Timer, Settings, Users, Wifi, WifiOff, Copy, RefreshCw } from "lucide-react";
import { CardColor, Card } from "./types";
import logoImg from "../assets/.aistudio/miku.png";
import bgImg from "../assets/.aistudio/bj.png";
import avatar1 from "../assets/avatar/1.png";
import avatar2 from "../assets/avatar/2.png";
import avatar3 from "../assets/avatar/3.png";
import avatar4 from "../assets/avatar/4.png";
import avatar5 from "../assets/avatar/5.png";
import avatar6 from "../assets/avatar/6.png";
import avatar7 from "../assets/avatar/7.png";
import avatar8 from "../assets/avatar/8.png";

const AVATARS = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8];

export default function App() {
  const [playerName, setPlayerName] = useState("玩家");
  const [playerAvatar, setPlayerAvatar] = useState(avatar1);
  const [botAvatars, setBotAvatars] = useState<[string, string, string]>([
    avatar2,
    avatar3,
    avatar4,
  ]);
  const [volume, setVolume] = useState(0.8);
  const [showSettings, setShowSettings] = useState(false);
  const [showInGameSettings, setShowInGameSettings] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [serverUrl, setServerUrl] = useState("ws://localhost:3001");
  const [maxPlayers, setMaxPlayers] = useState(4);

  const {
    state,
    timeLeft,
    startGame,
    exitGame,
    playCard,
    drawCard,
    handleWildColorSelect,
    callUno,
  } = useUno();

  const network = useNetwork();

  const { playClick, playSwoosh, playPop, playHover, playAlert, startAmbient } =
    useAudio(volume);

  useEffect(() => {
    if (state.status === "playing") {
      const stopAmbient = startAmbient();
      return () => stopAmbient?.();
    }
  }, [state.status, startAmbient]);

  useEffect(() => {
    if (timeLeft > 0 && timeLeft <= 5 && state.status === "playing") {
      playAlert();
    }
  }, [timeLeft, state.status, playAlert]);

  const handleStartGame = () => {
    playPop();
    startGame({ playerName, playerAvatar, botAvatars });
  };

  const handlePlayCard = (id: string, c: Card) => {
    playSwoosh();
    playCard(id, c);
  };

  const handleDrawCard = (id: string) => {
    playSwoosh();
    drawCard(id);
  };

  const handleColorSelect = (color: CardColor) => {
    playClick();
    handleWildColorSelect(color);
  };

  if (state.status === "menu") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gray-950 font-sans" style={{backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
        {/* Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00f0ff] rounded-full blur-[120px] opacity-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#39C5BB] rounded-full blur-[120px] opacity-10"></div>

        {!showSettings && !showMultiplayer ? (
          <div className="z-10 flex flex-col items-center text-center space-y-6 sm:space-y-8 bg-white p-6 sm:p-12 rounded-[30px] sm:rounded-[40px] w-full max-w-md mx-4 shadow-2xl border-4 border-[#39C5BB]">
            <h1 className="flex items-center justify-center">
              <img src={logoImg} alt="雑魚🐟雑魚！" className="w-40 sm:w-64 md:w-80 h-auto" />
            </h1>

            <div className="flex flex-col w-full gap-3 sm:gap-4 pt-4 sm:pt-8">
              <button
                onClick={handleStartGame}
                className="w-full py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-[#39C5BB] to-[#00D4AA] text-white font-black text-lg sm:text-xl tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                style={{fontFamily: 'var(--font-display)'}}
              >
                开始游戏
              </button>
              <button
                onClick={() => {
                  playClick();
                  setShowMultiplayer(true);
                }}
                className="w-full py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-[#FF69B4] to-[#FF1493] text-white font-black text-lg sm:text-xl tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                style={{fontFamily: 'var(--font-display)'}}
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6" /> 多人对战
              </button>
              <button
                onClick={() => {
                  playClick();
                  setShowSettings(true);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6B5B95] to-[#9B8EC4] text-white font-bold tracking-wide shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Settings className="w-5 h-5" /> 系统设置
              </button>
            </div>

            <div className="pt-2 sm:pt-4 text-gray-400 text-xs sm:text-sm font-bold">
              1 名玩家 vs 3 个AI对手
            </div>
          </div>
        ) : showSettings ? (
          <div className="z-10 flex flex-col items-center space-y-4 sm:space-y-6 bg-white p-6 sm:p-8 rounded-[30px] sm:rounded-[40px] w-full max-w-md mx-4 shadow-2xl border-4 border-[#39C5BB]">
            <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-[#FF1493]" style={{fontFamily: 'var(--font-display)'}}>
              系统设置
            </h2>

            <div className="w-full space-y-4 text-left">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">
                  昵称
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-800 font-bold focus:outline-none focus:border-[#39C5BB] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  头像
                </label>
                <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
                  {AVATARS.map((ava, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        playSwoosh();
                        setPlayerAvatar(ava);
                      }}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden transition-all ${playerAvatar === ava ? "border-2 border-[#39C5BB] scale-110 shadow-md" : "border-2 border-gray-200 hover:border-gray-300 hover:scale-105"}`}
                    >
                      <img src={ava} alt={`头像${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">
                  音量: {Math.round(volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#39C5BB]"
                />
              </div>
            </div>

            <button
              onClick={() => {
                playClick();
                setShowSettings(false);
              }}
              className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-[#6B5B95] to-[#9B8EC4] text-white font-black text-lg tracking-wide shadow-md hover:shadow-lg hover:scale-105 transition-all"
              style={{fontFamily: 'var(--font-display)'}}
            >
              确认
            </button>
          </div>
        ) : (
          <div className="z-10 flex flex-col items-center space-y-4 sm:space-y-6 bg-white p-6 sm:p-8 rounded-[30px] sm:rounded-[40px] w-full max-w-lg mx-4 shadow-2xl border-4 border-[#39C5BB] max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-[#FF1493]" style={{fontFamily: 'var(--font-display)'}}>
              多人对战
            </h2>

            {/* 服务器连接 */}
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2">
                {network.status === 'connected' ? (
                  <Wifi className="w-4 h-4 text-[#39C5BB]" />
                ) : (
                  <WifiOff className="w-4 h-4 text-[#FF1493]" />
                )}
                <span className="text-sm font-bold text-gray-600">
                  {network.status === 'connected' ? '已连接' : network.status === 'connecting' ? '连接中...' : '未连接'}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="ws://服务器地址:3001"
                  className="flex-1 bg-gray-100 border-2 border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-sm font-bold focus:outline-none focus:border-[#39C5BB] transition-colors"
                />
                {network.status === 'connected' ? (
                  <button
                    onClick={() => { playClick(); network.disconnect(); }}
                    className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#39C5BB] to-[#00D4AA] text-white text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  >
                    断开
                  </button>
                ) : (
                  <button
                    onClick={() => { playClick(); network.connect(serverUrl); }}
                    className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#6B5B95] to-[#9B8EC4] text-white text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  >
                    连接
                  </button>
                )}
              </div>
            </div>

            {network.error && (
              <div className="w-full p-3 rounded-xl bg-[#39C5BB]/10 border-2 border-[#39C5BB]/30 text-[#FF1493] text-sm font-bold">
                {network.error}
              </div>
            )}

            {/* 房间列表 */}
            {network.status === 'connected' && !network.roomId && (
              <>
                <div className="w-full flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-gray-800" style={{fontFamily: 'var(--font-display)'}}>可用房间</h3>
                  <button
                    onClick={() => { playClick(); network.refreshRooms(); }}
                    className="p-2 rounded-xl bg-gray-100 border-2 border-gray-200 text-gray-600 hover:bg-gray-200 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-full space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                  {network.rooms.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-4 font-bold">暂无房间</div>
                  ) : (
                    network.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-[#39C5BB] transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-gray-800 truncate">{room.name}</div>
                          <div className="text-xs text-gray-500 font-bold">
                            {room.playerCount}/{room.maxPlayers} 玩家 · {room.hostName}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            playClick();
                            network.joinRoom(room.id, playerName, playerAvatar);
                          }}
                          disabled={room.inGame || room.playerCount >= room.maxPlayers}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF69B4] to-[#FF1493] text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-2 flex-shrink-0"
                        >
                          {room.inGame ? '游戏中' : '加入'}
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    人数: {maxPlayers} 人
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => { playClick(); setMaxPlayers(n); }}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${maxPlayers === n ? 'bg-gradient-to-r from-[#FF69B4] to-[#FF1493] text-white shadow-md scale-105' : 'bg-gray-100 border-2 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {n}人
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    playClick();
                    network.createRoom(playerName, playerAvatar, maxPlayers);
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF69B4] to-[#FF1493] text-white font-black text-lg tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                  style={{fontFamily: 'var(--font-display)'}}
                >
                  创建房间
                </button>
              </>
            )}

            {/* 房间内 */}
            {network.roomId && (
              <>
                <div className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs text-gray-500 font-bold">房间号</div>
                      <div className="text-xl sm:text-2xl font-black text-[#FF1493] tracking-widest" style={{fontFamily: 'var(--font-display)'}}>
                        {network.roomId}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(network.roomId);
                        playClick();
                      }}
                      className="p-2 rounded-xl bg-gray-100 border-2 border-gray-200 text-gray-600 hover:bg-gray-200 transition-all"
                      title="复制房间号"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 font-bold mb-3">
                    {network.isHost
                      ? `你是房主 · 需要${network.roomMaxPlayers}人开始 (${network.roomPlayers.length}/${network.roomMaxPlayers})`
                      : `等待房主开始游戏... (${network.roomPlayers.length}/${network.roomMaxPlayers})`}
                  </div>
                  <div className="space-y-2">
                    {network.roomPlayers.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-white border-2 border-gray-200">
                        <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-sm text-gray-800 font-bold">{p.name}</span>
                        {p.id === network.myId && (
                          <span className="text-xs text-[#39C5BB] font-bold">(你)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {network.isHost && (
                  <button
                    onClick={() => { playPop(); network.startGame(); }}
                    disabled={network.roomPlayers.length !== network.roomMaxPlayers}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#fff200] to-[#ffdd00] text-gray-800 font-black text-lg tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{fontFamily: 'var(--font-display)'}}
                  >
                    {network.roomPlayers.length === network.roomMaxPlayers
                      ? `开始游戏 (${network.roomPlayers.length}人)`
                      : `等待玩家加入 (${network.roomPlayers.length}/${network.roomMaxPlayers})`}
                  </button>
                )}

                <button
                  onClick={() => { playClick(); network.leaveRoom(); }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#39C5BB] to-[#00D4AA] text-white font-black text-lg tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                  style={{fontFamily: 'var(--font-display)'}}
                >
                  离开房间
                </button>
              </>
            )}

            <button
              onClick={() => {
                playClick();
                setShowMultiplayer(false);
                if (network.roomId) network.leaveRoom();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#39C5BB] to-[#00D4AA] text-white font-black text-lg tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              style={{fontFamily: 'var(--font-display)'}}
            >
              返回
            </button>
          </div>
        )}
      </div>
    );
  }

  const you = state.players[0];
  const isYourTurn =
    state.currentPlayerIndex === 0 && state.pendingAction === "none";
  const topCard = state.discardPile[state.discardPile.length - 1];

  // 网络模式下的游戏状态
  const isNetworkMode = network.gameState !== null;
  const gameState = isNetworkMode ? network.gameState : state;
  const networkYou = gameState.players.find(p => p.id === network.myId);
  const networkIsYourTurn = networkYou && gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === network.myId) && gameState.pendingAction === "none";
  const networkTopCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="min-h-screen w-full flex flex-col bg-cover bg-center overflow-hidden font-sans select-none fixed inset-0" style={{backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-800/30 via-blue-950/40 to-gray-950/50 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent pointer-events-none"></div>

      {/* In-Game Settings Button & Modal */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => { playClick(); setShowInGameSettings(true); }}
          className="p-3 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full text-white/70 hover:text-white hover:bg-black/70 hover:border-[#00f0ff] transition-all"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {showInGameSettings && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm mx-4 bg-white border-4 border-[#39C5BB] p-6 sm:p-8 rounded-[30px] sm:rounded-[40px] shadow-2xl flex flex-col items-center space-y-4 sm:space-y-6"
            >
              <h2 className="text-3xl font-black tracking-wider text-[#FF1493]" style={{fontFamily: 'var(--font-display)'}}>暂停</h2>

              <div className="w-full space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">音量: {Math.round(volume * 100)}%</label>
                  <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-full accent-[#39C5BB]" />
                </div>
              </div>

              <div className="w-full flex flex-col gap-3 mt-4">
                <button
                  onClick={() => { playClick(); setShowInGameSettings(false); }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6B5B95] to-[#9B8EC4] text-white font-black text-lg tracking-wide shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  style={{fontFamily: 'var(--font-display)'}}
                >
                  继续游戏
                </button>
                <button
                  onClick={() => { playPop(); setShowInGameSettings(false); startGame({ playerName, playerAvatar, botAvatars }); }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#fff200] to-[#ffdd00] text-gray-800 font-black text-lg tracking-wide shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  style={{fontFamily: 'var(--font-display)'}}
                >
                  重新开始
                </button>
                <button
                  onClick={() => { playSwoosh(); setShowInGameSettings(false); exitGame(); }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#39C5BB] to-[#00D4AA] text-white font-black text-lg tracking-wide shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  style={{fontFamily: 'var(--font-display)'}}
                >
                  返回主菜单
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Opponents - 本地模式 */}
      {!isNetworkMode && state.players.length === 4 && (
        <>
          <AIHand
            player={state.players[2]}
            position="top"
            isTurn={state.currentPlayerIndex === 2}
          />
          <AIHand
            player={state.players[1]}
            position="left"
            isTurn={state.currentPlayerIndex === 1}
          />
          <AIHand
            player={state.players[3]}
            position="right"
            isTurn={state.currentPlayerIndex === 3}
          />
        </>
      )}

      {/* 网络模式 - 其他玩家 */}
      {isNetworkMode && gameState.players.filter(p => p.id !== network.myId).map((p, idx) => {
        const positions: ("top" | "left" | "right")[] = ["top", "left", "right"];
        const pos = positions[idx % 3];
        const playerIdx = gameState.players.findIndex(pl => pl.id === p.id);
        return (
          <React.Fragment key={p.id}>
            <AIHand
              player={p}
              position={pos}
              isTurn={gameState.currentPlayerIndex === playerIdx}
            />
          </React.Fragment>
        );
      })}

      {/* Center Table */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        {/* Current Color Indicator Ring */}
        <div className="absolute w-[400px] h-[400px] rounded-full border border-white/5 opacity-40 flex items-center justify-center pointer-events-none">
          <div
            className={`w-[200px] h-[200px] rounded-full filter blur-[100px] transition-colors duration-1000
                ${gameState.currentColor === "red" ? "bg-[#ed1c24]/60" : ""}
                ${gameState.currentColor === "green" ? "bg-[#50b848]/60" : ""}
                ${gameState.currentColor === "blue" ? "bg-[#0072bc]/60" : ""}
                ${gameState.currentColor === "yellow" ? "bg-[#fff200]/60" : ""}
              `}
          ></div>
        </div>

        <div className="flex items-center gap-8 md:gap-20 pointer-events-auto mt-[-50px] relative z-20">
          {/* Draw Pile */}
          <motion.div
            className="relative cursor-pointer group"
            onClick={() => {
              if (isNetworkMode) {
                if (networkIsYourTurn) network.drawCard();
              } else {
                if (isYourTurn) handleDrawCard(you.id);
              }
            }}
            whileHover={(isNetworkMode ? networkIsYourTurn : isYourTurn) ? { scale: 1.05, y: -10 } : { scale: 1.02 }}
            whileTap={(isNetworkMode ? networkIsYourTurn : isYourTurn) ? { scale: 0.95 } : {}}
          >
            {[...Array(5)].map((_, i) => (
              <UnoCard
                key={`deck_stack_${i}`}
                card="facedown"
                style={{
                  position: "absolute",
                  top: -i * 2,
                  left: -i * 2,
                  zIndex: 5 - i,
                }}
                className="opacity-90 transition-all duration-300 group-hover:left-[-10px] group-hover:top-[-5px]"
              />
            ))}
            <UnoCard
              card="facedown"
              className={`relative z-10 transition-transform ${(isNetworkMode ? networkIsYourTurn : isYourTurn) ? "shadow-[0_0_30px_rgba(0,240,255,0.4)] ring-2 ring-[#00f0ff]/50" : ""}`}
            />
            {(isNetworkMode ? networkIsYourTurn : isYourTurn) && (
              <div
                className={`absolute -bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs text-nowrap animate-pulse ${gameState.pendingDraw > 0 ? "text-[#FF1493] font-black drop-shadow-[0_0_8px_#ff003c] scale-125" : "text-[#00f0ff] drop-shadow-[0_0_8px_#00f0ff]"}`}
              >
                {gameState.pendingDraw > 0
                  ? `摸 ${gameState.pendingDraw} 张`
                  : "摸牌"}
              </div>
            )}
          </motion.div>

          {/* Direction Indicator */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 opacity-30 text-8xl"
            animate={{ rotate: gameState.direction === 1 ? 360 : -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            {gameState.direction === 1 ? "↻" : "↺"}
          </motion.div>

          {/* Discard Pile */}
          <motion.div
            className="relative pointer-events-auto cursor-default group"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {gameState.discardPile
              .slice(Math.max(0, gameState.discardPile.length - 2))
              .map((card, idx, arr) => {
                const isTop = idx === arr.length - 1;
                const depth = arr.length - 1 - idx;

                // Deterministic random-looking values
                const seed =
                  card.id.charCodeAt(0) +
                  card.id.charCodeAt(card.id.length - 1);
                // Top card slightly rotated, bottom cards rotated more randomly
                const rotation = isTop ? (seed % 8) - 4 : (seed % 50) - 25;
                const offsetX = isTop ? 0 : (seed % 24) - 12;
                const offsetY = isTop ? 0 : ((seed * 3) % 24) - 12;

                return (
                  <UnoCard
                    key={`discard_${card.id}_${idx}`}
                    layoutId={card.id}
                    card={card}
                    className={`${isTop ? "relative z-10 shadow-[0_5px_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_10px_30px_rgba(255,255,255,0.4)]" : "absolute top-0 left-0 opacity-80 shadow-[0_2px_5px_rgba(0,0,0,0.5)] transition-shadow duration-300 group-hover:left-[-10px] group-hover:top-[-5px]"}`}
                    style={
                      isTop
                        ? { zIndex: 10 }
                        : {
                            top: offsetY,
                            left: offsetX,
                            zIndex: 10 - depth,
                          }
                    }
                    tiltAngle={rotation}
                  />
                );
              })}

            {/* Current Color Indicator Block */}
            {gameState.currentColor && (
              <motion.div
                className={`absolute -right-16 md:-right-24 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 rounded-lg border-2 border-white/40 z-20
                  ${gameState.currentColor === "red" ? "bg-[#ed1c24] shadow-[0_0_25px_#ed1c24]" : ""}
                  ${gameState.currentColor === "green" ? "bg-[#50b848] shadow-[0_0_25px_#50b848]" : ""}
                  ${gameState.currentColor === "blue" ? "bg-[#0072bc] shadow-[0_0_25px_#0072bc]" : ""}
                  ${gameState.currentColor === "yellow" ? "bg-[#fff200] shadow-[0_0_25px_#fff200]" : ""}
                `}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={gameState.currentColor}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                title={`Current color: ${gameState.currentColor}`}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Your Hand & UI Area */}
      <div className="absolute bottom-0 left-0 right-0 h-48 md:h-64 flex flex-col items-center justify-end z-30 pointer-events-none">
        <div className="w-full flex justify-center pb-4 sm:pb-8 pointer-events-auto px-4 overflow-x-auto overflow-y-visible">
          <div className="flex relative h-[200px] md:h-[200px] w-[750px] justify-center items-end pb-8">
            <AnimatePresence>
              {(isNetworkMode ? (networkYou?.hand || []) : you.hand).map((c, i) => {
                const hand = isNetworkMode ? (networkYou?.hand || []) : you.hand;
                const total = hand.length;
                const spacing = Math.min(80, 800 / Math.max(total, 1));
                const overlap = 96 - spacing;
                const mid = (total - 1) / 2;
                const angle = (i - mid) * 2;
                const yOffset = Math.abs(i - mid) * 1.5;

                const currentIsYourTurn = isNetworkMode ? networkIsYourTurn : isYourTurn;
                const currentTopCard = isNetworkMode ? networkTopCard : topCard;

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={{ opacity: 1, y: yOffset, scale: 1 }}
                    exit={{
                      opacity: 0,
                      transition: { duration: 0.3 },
                    }}
                    whileHover={{ y: yOffset - 30, zIndex: 100 }}
                    onHoverStart={() => playHover()}
                    style={{
                      marginLeft: i === 0 ? 0 : -overlap,
                      zIndex: i,
                      position: "relative",
                    }}
                  >
                    <UnoCard
                      layoutId={c.id}
                      card={c}
                      isValid={
                        currentIsYourTurn &&
                        isValidPlay(
                          c,
                          currentTopCard,
                          gameState.currentColor,
                          gameState.pendingDraw,
                        )
                      }
                      className={
                        currentIsYourTurn &&
                        isValidPlay(
                          c,
                          currentTopCard,
                          gameState.currentColor,
                          gameState.pendingDraw,
                        )
                          ? "animate-cyan-bloom ring-2 ring-[#00f0ff]/50"
                          : ""
                      }
                      onClick={() => {
                        if (!currentIsYourTurn) return;
                        if (!isValidPlay(c, currentTopCard, gameState.currentColor, gameState.pendingDraw)) return;
                        
                        if (isNetworkMode) {
                          if (c.color === 'wild') {
                            // For wild cards, we need to handle color selection
                            // For now, just send the play card command
                            network.playCard(c.id);
                          } else {
                            network.playCard(c.id);
                          }
                        } else {
                          handlePlayCard(you.id, c);
                        }
                      }}
                      tiltAngle={angle}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Header */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 md:h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"
          flex
          items-center
          justify-between
          px-8
        ></div>
      </div>

      {/* UNO Button */}
      <AnimatePresence>
        {(() => {
          const currentYou = isNetworkMode ? networkYou : you;
          if (!currentYou) return null;
          return currentYou.hand.length > 0 && currentYou.hand.length <= 2 && !currentYou.isUno && (
            <motion.button
              initial={{ scale: 0, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 50 }}
              whileHover={{
                scale: 1.1,
                textShadow: "0px 0px 8px rgb(255,255,255)",
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                playSwoosh();
                if (isNetworkMode) {
                  network.callUno();
                } else {
                  callUno(you.id);
                }
              }}
              className="absolute bottom-48 md:bottom-64 left-1/2 -translate-x-1/2 z-50 px-10 py-3 bg-gradient-to-br from-[#ff003c] to-[#990024] text-white font-black italic text-2xl md:text-3xl rounded-xl shadow-[0_0_30px_#ff003c] border-2 border-white/50 tracking-tighter hover:shadow-[0_0_50px_#ff003c] transition-shadow duration-300 pointer-events-auto"
              style={{fontFamily: 'var(--font-display)'}}
            >
              UNO!
            </motion.button>
          );
        })()}
      </AnimatePresence>

      {/* Heads up text (Turn info) */}
      <div className="absolute bottom-[280px] left-1/2 -translate-x-1/2 glass-panel px-6 py-2.5 rounded-full z-40 pointer-events-auto flex items-center gap-4 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <span
          className={`font-bold tracking-widest text-sm flex items-center gap-2 transition-colors ${
            isNetworkMode 
              ? (gameState.players.findIndex(p => p.id === network.myId) === gameState.currentPlayerIndex ? "text-[#fff200] drop-shadow-[0_0_8px_rgba(255,242,0,0.5)]" : "text-white/70")
              : (state.currentPlayerIndex === 0 ? "text-[#fff200] drop-shadow-[0_0_8px_rgba(255,242,0,0.5)]" : "text-white/70")
          }`}
          style={{fontFamily: 'var(--font-display)', letterSpacing: '0.08em'}}
        >
          {(() => {
            const currentPlayer = gameState.players[gameState.currentPlayerIndex];
            return currentPlayer?.avatar ? (
              <img src={currentPlayer.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
            ) : null;
          })()}
          {isNetworkMode
            ? (gameState.players.findIndex(p => p.id === network.myId) === gameState.currentPlayerIndex
              ? `你的回合`
              : `${gameState.players[gameState.currentPlayerIndex]?.name || '对手'} 思考中...`)
            : (state.currentPlayerIndex === 0
              ? `你的回合`
              : `${state.players[state.currentPlayerIndex].name} 思考中...`)}
        </span>

        <div className="flex items-center gap-2 opacity-90 pl-2 border-l border-white/10">
          <div className="relative flex items-center justify-center w-7 h-7">
            <svg
              className="-rotate-90 w-full h-full drop-shadow-md"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-white/10"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 10}
                strokeDashoffset={2 * Math.PI * 10 * (timeLeft / 30)}
                style={{
                  transitionProperty: "stroke-dashoffset",
                  transitionDuration: timeLeft === 30 ? "0ms" : "1000ms",
                  transitionTimingFunction: "linear",
                }}
                className={`${timeLeft <= 5 ? "text-[#ed1c24] animate-pulse drop-shadow-[0_0_8px_rgba(237,28,36,0.9)]" : "text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]"}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`font-mono text-[10px] font-bold ${timeLeft <= 5 ? "text-[#ed1c24] animate-pulse" : "text-[#00f0ff]/80"}`}
              >
                {timeLeft}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wild Color Picker Modal */}
      <AnimatePresence>
        {gameState.pendingAction === "wild_color_select" &&
          gameState.pendingWildCardInfo?.playerId === (isNetworkMode ? network.myId : you.id) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
            >
              <div className="glass-panel p-8 rounded-2xl flex flex-col items-center">
                <h2 className="text-xl font-mono text-white/80 mb-6 tracking-widest" style={{fontFamily: 'var(--font-display)', letterSpacing: '0.15em'}}>
                  选择颜色
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {(["red", "blue", "green", "yellow"] as CardColor[]).map(
                    (color) => {
                      const bg =
                        color === "red"
                          ? "bg-[#39C5BB]"
                          : color === "blue"
                            ? "bg-[#00f0ff]"
                            : color === "green"
                              ? "bg-[#00ff66]"
                              : "bg-[#ffee00]";
                      const shadow =
                        color === "red"
                          ? "hover:shadow-[0_0_20px_#ff003c]"
                          : color === "blue"
                            ? "hover:shadow-[0_0_20px_#00f0ff]"
                            : color === "green"
                              ? "hover:shadow-[0_0_20px_#00ff66]"
                              : "hover:shadow-[0_0_20px_#ffee00]";
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            if (isNetworkMode) {
                              network.playCard(gameState.pendingWildCardInfo!.card.id, color);
                            } else {
                              handleColorSelect(color);
                            }
                          }}
                          className={`w-24 h-24 rounded-lg transform hover:scale-110 transition-all border border-white/20 ${bg} ${shadow}`}
                        />
                      );
                    },
                  )}
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Game Over Screen */}
      <AnimatePresence>
        {gameState.status === "gameover" && (
          <>
            <CyberConfetti />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="flex flex-col items-center space-y-6 text-center z-50">
                <h1 className="text-6xl font-black italic text-white drop-shadow-[0_0_20px_white]" style={{fontFamily: 'var(--font-display)'}}>
                  {isNetworkMode
                    ? (gameState.winner?.id === network.myId ? "胜利" : "失败")
                    : (state.winner?.id === you.id ? "胜利" : "失败")}
                </h1>
                <p className="text-xl font-mono text-white/60">
                  {gameState.winner?.name} 已出完所有手牌。
                </p>
                <div className="flex gap-4">
                  {isNetworkMode && network.isHost ? (
                    <button
                      onClick={() => { playPop(); network.restartGame(); }}
                      className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 font-mono tracking-widest transition-colors mt-8 backdrop-blur-lg"
                      style={{fontFamily: 'var(--font-display)', letterSpacing: '0.1em'}}
                    >
                      再玩一次
                    </button>
                  ) : !isNetworkMode ? (
                    <button
                      onClick={handleStartGame}
                      className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 font-mono tracking-widest transition-colors mt-8 backdrop-blur-lg"
                      style={{fontFamily: 'var(--font-display)', letterSpacing: '0.1em'}}
                    >
                      再玩一次
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      playSwoosh();
                      if (isNetworkMode) {
                        network.leaveRoom();
                      } else {
                        exitGame();
                      }
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-[#ed1c24]/20 to-[#ed1c24]/10 border border-[#ed1c24]/50 text-[#ed1c24] rounded-xl hover:from-[#ed1c24]/30 hover:to-[#ed1c24]/20 font-mono tracking-widest transition-colors mt-8 backdrop-blur-lg"
                    style={{fontFamily: 'var(--font-display)', letterSpacing: '0.1em'}}
                  >
                    返回主菜单
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Activity Logs (Top Left) */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none max-w-[200px] hidden md:block">
        <div className="flex items-center gap-2 mb-3 text-white/30 text-xs">
          <ScrollText className="w-4 h-4" /> <span style={{fontFamily: 'var(--font-display)', letterSpacing: '0.1em'}}>系统日志</span>
        </div>
        <div className="space-y-1">
          <AnimatePresence>
            {gameState.logs.map((log, i) => (
              <motion.div
                key={`${log}_${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1 - i * 0.15, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-mono text-white/80 line-clamp-1"
              >
                {log}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
