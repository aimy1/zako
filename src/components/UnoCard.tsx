import React from 'react';
import { Card as CardType } from '../types';
import { motion } from 'motion/react';

interface CardProps {
  key?: React.Key;
  card: CardType | 'facedown';
  onClick?: () => void;
  isValid?: boolean;
  selected?: boolean;
  style?: React.CSSProperties;
  className?: string;
  tiltAngle?: number;
  layoutId?: string;
}

const colorMap: Record<string, string> = {
  red: 'bg-[#ed1c24]',
  blue: 'bg-[#0072bc]',
  green: 'bg-[#50b848]',
  yellow: 'bg-[#fff200]',
  wild: 'bg-[#231f20]',
};

const textMap: Record<string, string> = {
  red: 'text-[#ed1c24]',
  blue: 'text-[#0072bc]',
  green: 'text-[#50b848]',
  yellow: 'text-[#fff200]',
  wild: 'text-white',
};

const strokeShadow = {
    textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
};

const centerStroke = {
    textShadow: "-1px -1px 0 #231f20, 1px -1px 0 #231f20, -1px 1px 0 #231f20, 1px 1px 0 #231f20, 3px 4px 0 rgba(0,0,0,0.3)"
};

const getDisplayName = (type: string) => {
    switch(type) {
        case 'skip': return '⊘';
        case 'reverse': return '⇄';
        case 'draw2': return '+2';
        case 'wild': return '万能';
        case 'wild4': return '+4';
        default: return type;
    }
};

export const UnoCard = ({ card, onClick, isValid = true, selected = false, style, className = '', tiltAngle = 0, layoutId }: CardProps) => {
  if (card === 'facedown') {
    return (
      <motion.div
        layoutId={layoutId}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ ...style, rotate: tiltAngle }}
        className={`w-16 h-24 sm:w-20 sm:h-32 md:w-24 md:h-36 rounded-xl sm:rounded-2xl border-[4px] sm:border-[6px] border-white bg-[#ed1c24] flex items-center justify-center shadow-[0_5px_15px_rgba(0,0,0,0.5)] ${className}`}
      >
        <div className="w-[85%] h-[65%] rounded-[50%] bg-[#231f20] flex items-center justify-center transform -rotate-[20deg] border-[3px] border-[#fff200] shadow-inner relative overflow-hidden">
           <div className="absolute w-[150%] h-[12px] bg-[#ed1c24] transform -rotate-[30deg]"></div>
           <span className="font-extrabold text-[#fff200] text-lg sm:text-2xl md:text-3xl italic tracking-tighter relative z-10" style={{textShadow: "2px 2px 0px #ed1c24"}}>UNO</span>
        </div>
      </motion.div>
    );
  }

  const isSpecial = ['skip', 'reverse', 'draw2', 'wild', 'wild4'].includes(card.type);

  return (
    <motion.div
      layoutId={layoutId}
      whileHover={isValid ? { y: -20, scale: 1.1, rotate: tiltAngle, zIndex: 50 } : {}}
      whileTap={isValid ? { scale: 0.95 } : {}}
      onClick={() => isValid && onClick?.()}
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ 
          opacity: 1, 
          y: selected ? -20 : 0, 
          scale: 1,
          rotate: tiltAngle
      }}
      style={style}
      className={`
        relative w-16 h-24 sm:w-20 sm:h-32 md:w-24 md:h-36 rounded-xl sm:rounded-2xl border-[4px] sm:border-[6px] border-white overflow-hidden
        flex flex-col items-center justify-center select-none
        transition-shadow duration-300
        ${isValid ? 'cursor-pointer hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:z-50' : 'opacity-80 cursor-not-allowed grayscale-[30%] brightness-90'}
        ${colorMap[card.color]}
        ${selected ? 'shadow-[0_0_20px_rgba(255,255,255,1)] z-40' : 'shadow-[0_4px_10px_rgba(0,0,0,0.3)]'}
        ${className}
      `}
    >
      
      {/* Central Ellipse */}
      {card.color === 'wild' ? (
          <div className="absolute w-[85%] h-[60%] sm:w-[85%] sm:h-[65%] rounded-[50%] transform -rotate-[24deg] flex items-center justify-center overflow-hidden border-2 border-white/20">
              <div className="absolute inset-0 flex flex-wrap">
                  <div className="w-1/2 h-1/2 bg-[#ed1c24]"></div>
                  <div className="w-1/2 h-1/2 bg-[#0072bc]"></div>
                  <div className="w-1/2 h-1/2 bg-[#fff200]"></div>
                  <div className="w-1/2 h-1/2 bg-[#50b848]"></div>
              </div>
              <div className="absolute w-[70%] h-[70%] bg-[#231f20] rounded-[50%] flex items-center justify-center shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]"></div>
          </div>
      ) : (
          <div className="absolute w-[95%] h-[60%] sm:w-[90%] sm:h-[65%] bg-white rounded-[50%] transform -rotate-[24deg] flex items-center justify-center shadow-[inset_0_3px_8px_rgba(0,0,0,0.3)]"></div>
      )}
      
      {/* Top Left */}
      <span className="absolute top-0.5 left-1 sm:top-1 sm:left-1.5 text-white font-extrabold text-xs sm:text-sm md:text-md z-10" style={strokeShadow}>
        {getDisplayName(card.type)}
      </span>
      
      {/* Center */}
      <span className={`${textMap[card.color]} font-black z-10 
        ${isSpecial ? 'text-2xl sm:text-3xl md:text-4xl tracking-tighter max-w-[80%] text-center leading-none' : 'text-5xl sm:text-6xl md:text-7xl'}`} style={centerStroke}>
        {getDisplayName(card.type)}
      </span>
      
      {/* Bottom Right */}
      <span className="absolute bottom-0.5 right-1 sm:bottom-1 sm:right-1.5 text-white font-extrabold text-xs sm:text-sm md:text-md z-10 rotate-180" style={strokeShadow}>
        {getDisplayName(card.type)}
      </span>

      {/* Subtle interaction shine */}
      <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors duration-300 pointer-events-none z-20"></div>
    </motion.div>
  );
};
