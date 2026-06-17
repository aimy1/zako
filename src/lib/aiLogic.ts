import { Card, CardColor, Player } from '../types';
import { isValidPlay } from './deckUtil';

// Evaluates AI hand and chooses the best card to play
export const determineAITurn = (
  hand: Card[],
  topCard: Card,
  currentColor: CardColor,
  nextPlayerCount: number,
  pendingDraw: number = 0
): { card: Card | null; selectedColor?: CardColor } => {
  
  // Find all valid cards
  const validCards = hand.filter(card => isValidPlay(card, topCard, currentColor, pendingDraw));
  
  if (validCards.length === 0) {
    return { card: null };
  }

  // Normal/Hard strategy: 
  // 1. Play colors over wilds if possible
  // 2. Play special cards to hinder others (Skip, Reverse, Draw2)
  // 3. Save wilds for last resorts or ending
  // 4. If playing wild, pick the most abundant color in hand.
  
  const colorCards = validCards.filter(c => c.color !== 'wild');
  const actionCards = colorCards.filter(c => ['skip', 'reverse', 'draw2'].includes(c.type));
  const numberCards = colorCards.filter(c => !['skip', 'reverse', 'draw2'].includes(c.type));
  const wildCards = validCards.filter(c => c.color === 'wild');

  let chosenCard: Card | null = null;

  // Prefer action cards if next player has few cards (<= 2)
  if (nextPlayerCount <= 2 && actionCards.length > 0) {
    chosenCard = actionCards[0];
  } else if (numberCards.length > 0) {
    // Play a random number card of valid color
    chosenCard = numberCards[Math.floor(Math.random() * numberCards.length)];
  } else if (actionCards.length > 0) {
    chosenCard = actionCards[Math.floor(Math.random() * actionCards.length)];
  } else if (wildCards.length > 0) {
    chosenCard = wildCards[0];
  }

  // Fallback
  if (!chosenCard) {
    chosenCard = validCards[0];
  }

  // If a wild was chosen, select best color
  let selectedColor: CardColor | undefined;
  if (chosenCard.color === 'wild') {
    const colorCounts: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
    hand.forEach(c => {
      if (c.color !== 'wild') colorCounts[c.color]++;
    });
    
    // Find color with max count
    let max = -1;
    let bestCol = 'red';
    for (const [col, count] of Object.entries(colorCounts)) {
      if (count > max) {
        max = count;
        bestCol = col;
      }
    }
    selectedColor = bestCol as CardColor;
  }

  return { card: chosenCard, selectedColor };
};
