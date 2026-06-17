import { useState, useCallback, useEffect, useRef } from "react";
import { GameState, Card, Player, CardColor } from "../types";
import { createDeck, isValidPlay } from "../lib/deckUtil";
import { determineAITurn } from "../lib/aiLogic";

const INITIAL_HAND_SIZE = 7;

export const useUno = () => {
  const [state, setState] = useState<GameState>({
    status: "menu",
    players: [],
    currentPlayerIndex: 0,
    direction: 1,
    deck: [],
    discardPile: [],
    currentColor: "red",
    pendingDraw: 0,
    pendingAction: "none",
    pendingWildCardInfo: null,
    winner: null,
    logs: [],
  });

  const [timeLeft, setTimeLeft] = useState(30);

  const addLog = (msg: string) => {
    setState((s) => ({ ...s, logs: [msg, ...s.logs].slice(0, 15) }));
  };

  const drawCardRef = useRef<((id: string) => void) | null>(null);
  const catchUnoRef = useRef<((id: string) => void) | null>(null);

  const callUno = useCallback((playerId: string) => {
    setState((s) => {
      const newPlayers = [...s.players];
      const pIdx = newPlayers.findIndex((p) => p.id === playerId);
      if (pIdx === -1) return s;
      if (newPlayers[pIdx].hand.length <= 2 && !newPlayers[pIdx].isUno) {
        newPlayers[pIdx] = { ...newPlayers[pIdx], isUno: true };
        return {
          ...s,
          players: newPlayers,
          logs: [`${newPlayers[pIdx].name} 喊了UNO！`, ...s.logs].slice(0, 15),
        };
      }
      return s;
    });
  }, []);

  const catchUno = useCallback((playerId: string) => {
    setState((s) => {
      const newPlayers = [...s.players];
      const pIdx = newPlayers.findIndex((p) => p.id === playerId);
      if (pIdx === -1) return s;
      if (newPlayers[pIdx].hand.length === 1 && !newPlayers[pIdx].isUno) {
        // Penalty draw 2
        let newDeck = [...s.deck];
        let newDiscard = [...s.discardPile];
        const penalized = {
          ...newPlayers[pIdx],
          hand: [...newPlayers[pIdx].hand],
        };
        for (let i = 0; i < 2; i++) {
          if (newDeck.length === 0) {
            const top = newDiscard.pop()!;
            newDeck = newDiscard.sort(() => Math.random() - 0.5);
            newDiscard = [top];
          }
          const drawn = newDeck.pop();
          if (drawn) penalized.hand.push(drawn);
        }
        newPlayers[pIdx] = penalized;
        return {
          ...s,
          players: newPlayers,
          deck: newDeck,
          discardPile: newDiscard,
          logs: [`${penalized.name} 忘记喊UNO，摸了2张牌！`, ...s.logs].slice(
            0,
            15,
          ),
        };
      }
      return s;
    });
  }, []);

  interface GameOptions {
    playerName?: string;
    playerAvatar?: string;
    botAvatars?: string[];
  }

  const startGame = (opts?: GameOptions) => {
    const {
      playerName = "YOU",
      playerAvatar = "👨‍🚀",
      botAvatars = ["🤖", "👽", "👾"],
    } = opts || {};

    let deck = createDeck();
    const players: Player[] = [
      {
        id: "p1",
        name: playerName,
        isAI: false,
        hand: [],
        isUno: false,
        avatar: playerAvatar,
      },
      {
        id: "ai1",
        name: "ミク",
        isAI: true,
        hand: [],
        isUno: false,
        avatar: botAvatars[0],
      },
      {
        id: "ai2",
        name: "ルカ",
        isAI: true,
        hand: [],
        isUno: false,
        avatar: botAvatars[1],
      },
      {
        id: "ai3",
        name: "リナ",
        isAI: true,
        hand: [],
        isUno: false,
        avatar: botAvatars[2],
      },
    ];

    for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
      players.forEach((p) => p.hand.push(deck.pop()!));
    }

    let firstCard = deck.pop()!;
    while (
      firstCard.color === "wild" ||
      ["skip", "reverse", "draw2"].includes(firstCard.type)
    ) {
      deck.unshift(firstCard);
      firstCard = deck.pop()!;
    }

    setState({
      status: "playing",
      players,
      currentPlayerIndex: 0,
      direction: 1,
      deck,
      discardPile: [firstCard],
      currentColor: firstCard.color,
      pendingDraw: 0,
      pendingAction: "none",
      pendingWildCardInfo: null,
      winner: null,
      logs: ["游戏开始！"],
    });
  };

  const drawCard = useCallback((playerId: string) => {
    setState((s) => {
      if (
        s.status !== "playing" ||
        s.players[s.currentPlayerIndex].id !== playerId
      )
        return s;

      let newDeck = [...s.deck];
      let newDiscard = [...s.discardPile];
      let newPlayers = [...s.players];

      if (s.pendingDraw > 0) {
        const currPlayer = {
          ...newPlayers[s.currentPlayerIndex],
          hand: [...newPlayers[s.currentPlayerIndex].hand],
        };
        for (let i = 0; i < s.pendingDraw; i++) {
          if (newDeck.length === 0) {
            const top = newDiscard.pop()!;
            newDeck = newDiscard.sort(() => Math.random() - 0.5);
            newDiscard = [top];
          }
          const drawn = newDeck.pop();
          if (drawn) currPlayer.hand.push(drawn);
        }
        newPlayers[s.currentPlayerIndex] = currPlayer;

        const nextIndex =
          (s.currentPlayerIndex + s.direction + s.players.length) %
          s.players.length;
        return {
          ...s,
          deck: newDeck,
          discardPile: newDiscard,
          players: newPlayers,
          pendingDraw: 0,
          currentPlayerIndex: nextIndex,
          logs: [
            `${currPlayer.name} 摸了${s.pendingDraw}张惩罚牌！`,
            ...s.logs,
          ].slice(0, 10),
        };
      }

      if (newDeck.length === 0) {
        const topCard = newDiscard.pop()!;
        newDeck = newDiscard.sort(() => Math.random() - 0.5);
        newDiscard = [topCard];
      }

      const drawnCard = newDeck.pop();
      if (!drawnCard) return s;

      const currPlayer = {
        ...newPlayers[s.currentPlayerIndex],
        hand: [...newPlayers[s.currentPlayerIndex].hand, drawnCard],
        isUno: false,
      };
      newPlayers[s.currentPlayerIndex] = currPlayer;

      return {
        ...s,
        deck: newDeck,
        discardPile: newDiscard,
        players: newPlayers,
        currentPlayerIndex:
          (s.currentPlayerIndex + s.direction + s.players.length) %
          s.players.length,
        logs: [
          `${s.players[s.currentPlayerIndex].name} 摸了一张牌。`,
          ...s.logs,
        ].slice(0, 10),
      };
    });
  }, []);

  useEffect(() => {
    drawCardRef.current = drawCard;
  }, [drawCard]);

  useEffect(() => {
    catchUnoRef.current = catchUno;
  }, [catchUno]);

  // Turn Timer
  useEffect(() => {
    if (state.status !== "playing" || state.pendingAction !== "none") return;

    setTimeLeft(30);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const you = state.players[state.currentPlayerIndex];
          if (you && !you.isAI && drawCardRef.current) {
            drawCardRef.current(you.id);
          }
          return 30; // reset visually, effect will re-run on turn change anyway
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    state.currentPlayerIndex,
    state.status,
    state.pendingAction,
    state.players,
  ]);

  const handleWildColorSelect = (color: CardColor) => {
    setState((s) => {
      if (s.pendingAction !== "wild_color_select" || !s.pendingWildCardInfo)
        return s;

      const newPlayers = [...s.players];
      const currPlayerObj = [...newPlayers][s.currentPlayerIndex];
      const newHand = currPlayerObj.hand.filter(
        (c) => c.id !== s.pendingWildCardInfo!.card.id,
      );
      const newIsUno = currPlayerObj.isAI
        ? newHand.length === 1
        : currPlayerObj.isUno && newHand.length === 1;
      newPlayers[s.currentPlayerIndex] = {
        ...currPlayerObj,
        hand: newHand,
        isUno: newIsUno,
      };

      let nextIndex =
        (s.currentPlayerIndex + s.direction + s.players.length) %
        s.players.length;

      if (s.pendingWildCardInfo!.card.type === "wild4") {
        return {
          ...s,
          players: newPlayers,
          discardPile: [...s.discardPile, s.pendingWildCardInfo!.card],
          currentColor: color,
          currentPlayerIndex: nextIndex,
          pendingDraw: s.pendingDraw + 4,
          pendingAction: "none",
          pendingWildCardInfo: null,
          logs: [
            `${currPlayerObj.name} 出了+4万能牌。颜色: ${color === "red" ? "红色" : color === "blue" ? "蓝色" : color === "green" ? "绿色" : "黄色"}`,
            ...s.logs,
          ].slice(0, 10),
        };
      }

      // Normal wild
      return {
        ...s,
        players: newPlayers,
        discardPile: [...s.discardPile, s.pendingWildCardInfo!.card],
        currentColor: color,
        currentPlayerIndex: nextIndex,
        pendingAction: "none",
        pendingWildCardInfo: null,
        logs: [
          `${currPlayerObj.name} 出了万能牌。颜色: ${color === "red" ? "红色" : color === "blue" ? "蓝色" : color === "green" ? "绿色" : "黄色"}`,
          ...s.logs,
        ].slice(0, 10),
      };
    });
  };

  const playCard = (playerId: string, card: Card) => {
    setState((s) => {
      if (
        s.status !== "playing" ||
        s.players[s.currentPlayerIndex].id !== playerId ||
        s.pendingAction !== "none"
      )
        return s;
      const topCard = s.discardPile[s.discardPile.length - 1];
      if (!isValidPlay(card, topCard, s.currentColor, s.pendingDraw)) return s;

      const currPlayer = s.players[s.currentPlayerIndex];

      if (card.color === "wild") {
        return {
          ...s,
          pendingAction: "wild_color_select",
          pendingWildCardInfo: { playerId, card },
        };
      }

      const newPlayers = [...s.players];
      const newHand = currPlayer.hand.filter((c) => c.id !== card.id);
      const newIsUno = currPlayer.isAI
        ? newHand.length === 1
        : currPlayer.isUno && newHand.length === 1;
      newPlayers[s.currentPlayerIndex] = {
        ...currPlayer,
        hand: newHand,
        isUno: newIsUno,
      };

      let nextDirection = s.direction;
      let nextIndex =
        (s.currentPlayerIndex + nextDirection + s.players.length) %
        s.players.length;

      let newDeck = [...s.deck];
      let newDiscard = [...s.discardPile, card];

      let nextPendingDraw = s.pendingDraw;

      if (card.type === "reverse") {
        nextDirection = nextDirection === 1 ? -1 : 1;
        if (s.players.length === 2) {
          // In 2 player, reverse acts as skip
          nextIndex = s.currentPlayerIndex;
        } else {
          nextIndex =
            (s.currentPlayerIndex + nextDirection + s.players.length) %
            s.players.length;
        }
      } else if (card.type === "skip") {
        nextIndex =
          (nextIndex + nextDirection + s.players.length) % s.players.length;
      } else if (card.type === "draw2") {
        nextPendingDraw += 2;
      }

      let logs = [
        `${currPlayer.name} 出了${card.color === "red" ? "红色" : card.color === "blue" ? "蓝色" : card.color === "green" ? "绿色" : card.color === "yellow" ? "黄色" : ""} ${card.type === "skip" ? "跳过" : card.type === "reverse" ? "反转" : card.type === "draw2" ? "+2" : card.type.toUpperCase()}`,
        ...s.logs,
      ].slice(0, 10);
      if (newHand.length === 1) logs.unshift(`${currPlayer.name} 喊了UNO！`);

      return {
        ...s,
        players: newPlayers,
        discardPile: newDiscard,
        currentColor: card.color,
        deck: newDeck,
        direction: nextDirection,
        pendingDraw: nextPendingDraw,
        currentPlayerIndex: nextIndex,
        logs,
      };
    });
  };

  // AI Turn Hook
  useEffect(() => {
    if (state.status !== "playing" || state.pendingAction !== "none") return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer.isAI) return;

    // Check for winner before AI acts
    const winner = state.players.find((p) => p.hand.length === 0);
    if (winner) {
      setState((s) => ({ ...s, status: "gameover", winner }));
      return;
    }

    const vulnerableId = state.players.find(
      (p) => !p.isAI && p.hand.length === 1 && !p.isUno,
    )?.id;

    const topCard = state.discardPile[state.discardPile.length - 1];
    const nextIndex =
      (state.currentPlayerIndex + state.direction + state.players.length) %
      state.players.length;
    const nextPlayerHandSize = state.players[nextIndex].hand.length;

    const aiTimer = setTimeout(() => {
      if (vulnerableId && catchUnoRef.current) {
        catchUnoRef.current(vulnerableId);
      }

      const { card, selectedColor } = determineAITurn(
        currentPlayer.hand,
        topCard,
        state.currentColor,
        nextPlayerHandSize,
        state.pendingDraw,
      );

      if (!card) {
        drawCard(currentPlayer.id);
      } else if (card.color === "wild") {
        // Handle wild selection entirely in one go for AI via internal action
        // But to reuse state logic, we mock the multistep process:
        setState((s) => ({
          ...s,
          pendingAction: "wild_color_select",
          pendingWildCardInfo: { playerId: currentPlayer.id, card },
        }));
        setTimeout(() => handleWildColorSelect(selectedColor || "red"), 600);
      } else {
        playCard(currentPlayer.id, card);
      }
    }, 1500); // 1.5s thinking time

    return () => clearTimeout(aiTimer);
  }, [state.currentPlayerIndex, state.status, state.pendingAction]);

  // Check Game Over logic for player
  useEffect(() => {
    if (state.status !== "playing") return;
    const winner = state.players.find((p) => p.hand.length === 0);
    if (winner) {
      setState((s) => ({ ...s, status: "gameover", winner }));
    }
  }, [state.players, state.status]);

  const exitGame = () => {
    setState((s) => ({ ...s, status: "menu", winner: null, logs: [] }));
  };

  return {
    state,
    timeLeft,
    startGame,
    exitGame,
    playCard,
    drawCard,
    handleWildColorSelect,
    callUno,
  };
};
