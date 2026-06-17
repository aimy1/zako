import React from "react";
import { Player } from "../types";
import { UnoCard } from "./UnoCard";
import { motion, AnimatePresence } from "motion/react";
import { Bot } from "lucide-react";

export const AIHand = ({
  player,
  position,
  isTurn,
}: {
  player: Player;
  position: "top" | "left" | "right";
  isTurn: boolean;
}) => {
  const isHorizontal = position === "top";

  return (
    <div
      className={`absolute flex transition-all duration-300 z-10
            ${position === "top" ? "flex-col items-center top-6 left-1/2 -translate-x-1/2" : ""}
            ${position === "left" ? "flex-row items-center left-6 top-1/2 -translate-y-1/2" : ""}
            ${position === "right" ? "flex-row-reverse items-center right-6 top-1/2 -translate-y-1/2" : ""}
        `}
    >
      {/* Player Info */}
      <div
        className={`glass-panel px-3 sm:px-4 py-2 rounded-full flex flex-shrink-0 items-center gap-3 bg-black/50 backdrop-blur-md border transition-all duration-500 ${isTurn ? "border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.6),0_0_40px_rgba(0,240,255,0.3)] scale-105" : "border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]"}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center bg-black/50 transition-colors duration-500 ${isTurn ? "animate-pulse bg-[#00f0ff]/20" : ""}`}
        >
          {player.avatar ? (
            <img src={player.avatar} alt={player.name} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <Bot
              className={`w-5 h-5 transition-colors duration-500 ${isTurn ? "text-[#00f0ff]" : "text-white/60"}`}
            />
          )}
        </div>
        <div className="flex flex-col">
          <span
            className={`font-bold text-xs sm:text-sm transition-colors duration-500 ${isTurn ? "text-[#00f0ff]" : "text-white/90"}`}
          >
            {player.name}
          </span>
          <span className="text-[10px] sm:text-xs text-white/70 font-bold bg-black/50 px-2 py-0.5 rounded-full mt-0.5 flex-none w-max">
            {player.hand.length} 张
          </span>
        </div>

        <AnimatePresence>
          {player.isUno && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-3 -right-3 bg-[#ed1c24] text-white text-[10px] sm:text-xs font-black px-2 py-1 rounded-lg border-2 border-white shadow-lg transform rotate-12"
            >
              UNO!
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Hand Area (Facedown cards) */}
      <div
        className={`relative ${isHorizontal ? "w-48 h-12 mx-2" : "h-48 w-12 mx-2"}`}
      >
        {player.hand.map((c, i) => {
          const total = player.hand.length;
          const maxSp = isHorizontal ? 15 : 12;
          const sp = Math.min(maxSp, 120 / Math.max(total, 1));
          const baseStyle = isHorizontal
            ? {
                left: `calc(50% - ${(total * sp) / 2}px + ${i * sp}px)`,
                top: "50%",
                position: "absolute" as "absolute",
                zIndex: i,
              }
            : {
                top: `calc(50% - ${(total * sp) / 2}px + ${i * sp}px)`,
                left: "50%",
                position: "absolute" as "absolute",
                zIndex: i,
              };

          return (
            <motion.div
              key={`facedown_${c.id}`}
              layoutId={c.id}
              style={baseStyle}
              className="origin-center rounded-lg transform -translate-x-1/2 -translate-y-1/2 scale-[0.35] sm:scale-[0.4] hover:scale-[0.45] transition-transform"
            >
              <UnoCard
                card="facedown"
                className="!shadow-[0_5px_15px_rgba(0,0,0,0.8)] !m-0"
                tiltAngle={isHorizontal ? 0 : 90}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
