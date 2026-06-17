import { Card, CardColor, CardType } from '../types';

const COLORS: CardColor[] = ['red', 'yellow', 'green', 'blue'];
const NUMBERS: CardType[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ACTIONS: CardType[] = ['skip', 'reverse', 'draw2'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  let id = 0;

  COLORS.forEach((color) => {
    // One 0 per color
    deck.push({ id: `card_${id++}`, color, type: '0' });
    
    // Two of each 1-9 and actions per color
    for (let i = 0; i < 2; i++) {
        NUMBERS.forEach(num => deck.push({ id: `card_${id++}`, color, type: num }));
        ACTIONS.forEach(action => deck.push({ id: `card_${id++}`, color, type: action }));
    }
  });

  // Four wild and four wild4
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${id++}`, color: 'wild', type: 'wild' });
    deck.push({ id: `card_${id++}`, color: 'wild', type: 'wild4' });
  }

  return shuffle(deck);
};

export const shuffle = (array: Card[]): Card[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const isValidPlay = (card: Card, topCard: Card, currentColor: CardColor, pendingDraw: number = 0): boolean => {
  if (pendingDraw > 0) {
    if (topCard.type === 'draw2' && card.type === 'draw2') return true;
    if (topCard.type === 'wild4' && card.type === 'wild4') return true;
    return false;
  }
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.type === topCard.type && topCard.color !== 'wild') return true;
  return false;
};
