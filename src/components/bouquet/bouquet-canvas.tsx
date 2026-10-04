"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getFlowerById,
  getWrappingStyle,
  getGreeneryData,
  RIBBON_STYLES,
  generateArrangement,
  ArrangementPosition,
} from "@/lib/bouquet/flowers-data";
import { RibbonBow } from "./flower-illustrations";
import { playChimeSound } from "@/lib/bouquet/audio";
import { celebrateBouquet } from "@/lib/bouquet/confetti";
import { Sparkles, Heart } from "lucide-react";

interface BouquetCanvasProps {
  flowers: string[];
  wrappingId?: string;
  ribbonId?: string;
  greeneryId?: string;
  atmosphereId?: string;
  seed?: number;
  positions?: ArrangementPosition[];
  onPositionsChange?: (positions: ArrangementPosition[]) => void;
  allowDrag?: boolean;
  isMono?: boolean;
  toName?: string;
  fromName?: string;
  message?: string;
  isRevealMode?: boolean;
  onUntie?: () => void;
  className?: string;
}

export default function BouquetCanvas({
  flowers,
  wrappingId = "classic",
  ribbonId = "gold",
  greeneryId = "eucalyptus",
  atmosphereId = "petals",
  seed = 0.42,
  positions: externalPositions,
  onPositionsChange,
  allowDrag = false,
  isMono = false,
  toName = "Someone Special",
  fromName = "With Love",
  message = "A handpicked digital bouquet for you.",
  isRevealMode = false,
  onUntie,
  className = "",
}: BouquetCanvasProps) {
  const [isOpened, setIsOpened] = useState(!isRevealMode);
  const [isUntying, setIsUntying] = useState(false);
  const [cardFocused, setCardFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const wrap = getWrappingStyle(wrappingId);
  const ribbon = RIBBON_STYLES[ribbonId] || RIBBON_STYLES.gold;
  const greenery = getGreeneryData(greeneryId, isMono);

  // Filter or fallback flowers
  const validFlowers = useMemo(() => {
    return Array.isArray(flowers) && flowers.length > 0
      ? flowers.slice(0, 10)
      : ["rose", "peony", "tulip", "daisy"];
  }, [flowers]);

  // Generate organic phyllotaxis layout if external positions are not supplied
  const defaultPositions = useMemo(() => {
    return generateArrangement(validFlowers, seed, 460, 540);
  }, [validFlowers, seed]);

  const currentPositions = externalPositions && externalPositions.length === validFlowers.length
    ? externalPositions
    : defaultPositions;

  const handleOpenClick = () => {
    setIsUntying(true);
    playChimeSound();
    setTimeout(() => {
      setIsOpened(true);
      setCardFocused(true);
      setIsUntying(false);
      celebrateBouquet();
      onUntie?.();
    }, 600);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-[460px] aspect-[4/5] mx-auto select-none overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 ${className}`}
      style={{
        background: isMono
          ? "linear-gradient(155deg, #27272A 0%, #18181B 100%)"
          : "linear-gradient(155deg, #FBF8F3 0%, #F5ECE0 60%, #EFE3D3 100%)",
      }}
    >
      {/* Untying Golden Sparkle Burst */}
      {isUntying && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={`burst-${i}`}
              className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-300 to-rose-300 shadow-md"
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.8, 0],
                x: Math.cos((i / 18) * Math.PI * 2) * 150,
                y: Math.sin((i / 18) * Math.PI * 2) * 150,
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      {/* Atmosphere Particles: Floating Rose Petals */}
      {atmosphereId === "petals" && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={`petal-${i}`}
              className="absolute w-3.5 h-4.5 bg-gradient-to-br from-rose-200 via-rose-300 to-rose-400/80 rounded-full"
              style={{
                borderRadius: "60% 40% 70% 30%",
                left: `${(i * 11 + 4) % 100}%`,
                top: "-10%",
                boxShadow: "0 2px 8px rgba(225,29,72,0.18)",
              }}
              animate={{
                y: ["0%", "1200%"],
                x: [0, i % 2 === 0 ? 35 : -35, 0],
                rotateZ: [0, 360],
                opacity: [0, 0.95, 0],
              }}
              transition={{
                duration: 6 + (i % 4),
                repeat: Infinity,
                delay: i * 0.6,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      {/* Atmosphere Particles: Golden Stardust */}
      {atmosphereId === "sparkles" && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute text-amber-400"
              style={{
                left: `${(i * 9 + 4) % 94}%`,
                top: `${(i * 14 + 10) % 85}%`,
              }}
              animate={{
                scale: [0, 1.25, 0],
                opacity: [0, 0.9, 0],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: (i * 0.3) % 2.5,
              }}
            >
              <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-400 drop-shadow" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Atmosphere Particles: Tender Hearts */}
      {atmosphereId === "hearts" && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`heart-${i}`}
              className="absolute text-rose-400"
              style={{
                left: `${(i * 13 + 5) % 92}%`,
                bottom: "5%",
              }}
              animate={{
                y: [0, -420],
                opacity: [0, 0.85, 0],
                scale: [0.6, 1.15, 0.8],
              }}
              transition={{
                duration: 5 + (i % 3),
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeOut",
              }}
            >
              <Heart className="w-3.5 h-3.5 fill-rose-300 text-rose-400" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Background Soft Vignette */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(60,40,30,0.18)_100%)]" />

      {/* LAYER 1: Back Wrapping Paper Cone or Back Wall */}
      {!wrap.isVase && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[62%] h-[64%] z-[2] transition-all duration-500"
          style={{
            background: wrap.bgGradient,
            clipPath: "polygon(14% 0%, 86% 0%, 100% 100%, 0% 100%)",
            boxShadow: `0 16px 36px ${wrap.shadowColor}`,
            borderTop: `1px solid ${wrap.borderColor}`,
          }}
        />
      )}

      {/* LAYER 2: Foliage Bush Base (Behind Flowers) */}
      <div className="absolute inset-x-0 bottom-[6%] h-[74%] z-[3] pointer-events-none flex items-center justify-center">
        <img
          src={greenery.base}
          alt={greenery.name}
          className="w-[84%] h-[74%] object-contain select-none pointer-events-none filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.32)]"
          loading="eager"
        />
      </div>

      {/* LAYER 3: Arranged Botanical Flowers */}
      <div className="absolute inset-0 z-[10] overflow-hidden">
        {currentPositions.map((p, idx) => {
          const flower = getFlowerById(p.flowerId);
          const imgSrc = isMono ? flower.monoImage : flower.image;

          // Scaled coordinates relative to container percentage
          const pctLeft = (p.x / 460) * 100;
          const pctTop = (p.y / 540) * 100;

          return (
            <motion.div
              key={`${p.flowerId}-${idx}`}
              className="absolute select-none"
              style={{
                left: `${pctLeft}%`,
                top: `${pctTop}%`,
                zIndex: p.zIndex,
                width: 120,
                height: 120,
                cursor: allowDrag ? "grab" : "default",
              }}
              drag={allowDrag}
              dragConstraints={containerRef}
              dragElastic={0.1}
              whileDrag={{
                scale: p.scale * 1.15,
                zIndex: 60,
                cursor: "grabbing",
                filter: "drop-shadow(0 12px 24px rgba(225, 29, 72, 0.45))",
              }}
              onDragEnd={(_, info) => {
                if (onPositionsChange && containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  const newX = Math.max(20, Math.min(380, p.x + (info.offset.x / rect.width) * 460));
                  const newY = Math.max(20, Math.min(320, p.y + (info.offset.y / rect.height) * 540));
                  const updated = [...currentPositions];
                  updated[idx] = { ...p, x: newX, y: newY };
                  onPositionsChange(updated);
                }
              }}
              initial={{ scale: 0.2, opacity: 0, rotate: p.rotation - 15 }}
              animate={{
                scale: p.scale,
                rotate: p.rotation,
                opacity: 1,
              }}
              whileHover={{
                scale: p.scale * 1.08,
                rotate: p.rotation + 2,
                filter: "drop-shadow(0 8px 18px rgba(225, 29, 72, 0.35))",
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: idx * 0.06,
              }}
            >
              <img
                src={imgSrc}
                alt={flower.name}
                width={120}
                height={120}
                className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.36)]"
                loading="eager"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/bouquet/color/flowers/rose.png";
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* LAYER 4: Foliage Top Bush Overlay (Subtle 3D Depth) */}
      <div className="absolute inset-x-0 bottom-[6%] h-[74%] z-[15] pointer-events-none flex items-center justify-center opacity-65">
        <img
          src={greenery.top}
          alt=""
          className="w-[84%] h-[74%] object-contain select-none pointer-events-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
          loading="eager"
        />
      </div>

      {/* LAYER 5: Front Wrapping Paper or Vase */}
      {wrap.isVase ? (
        // Glass or Ceramic Vase
        <div
          className={`absolute left-1/2 -translate-x-1/2 bottom-[3%] z-[20] transition-all duration-500 ${
            wrap.id === "glass" ? "w-[124px] h-[210px] rounded-[24px_24px_44px_44px] backdrop-blur-md border border-white/50 shadow-xl" : "w-[134px] h-[200px] rounded-[36px_36px_56px_56px] border border-stone-300 shadow-xl"
          }`}
          style={{
            background: wrap.bgGradient,
            boxShadow: `0 18px 36px ${wrap.shadowColor}`,
          }}
        >
          {wrap.id === "glass" && (
            <div className="absolute inset-y-2 left-3 w-2.5 rounded-full bg-white/40 blur-[1px]" />
          )}
        </div>
      ) : (
        // Origami Wrapping Sleeve
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[54%] h-[48%] z-[20] transition-all duration-500"
          style={{
            background: wrap.bgGradient,
            clipPath: "polygon(0 0, 100% 0, 78% 100%, 22% 100%)",
            boxShadow: `inset 0 -20px 40px rgba(0,0,0,0.08), 0 -8px 24px ${wrap.shadowColor}`,
          }}
        >
          {/* Subtle paper fold texture lines */}
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(45deg,transparent_45%,#000_50%,transparent_55%)] [background-size:12px_12px]" />
        </div>
      )}

      {/* LAYER 6: Ribbon Tie & Bow */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 bottom-[14%] z-[24] pointer-events-none filter drop-shadow-md"
        animate={
          isUntying
            ? {
                scale: [1, 1.4, 0],
                opacity: [1, 0.8, 0],
                rotate: [0, 20, -25],
                y: [0, -10, 30],
              }
            : { scale: 1, opacity: 1, rotate: 0, y: 0 }
        }
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <RibbonBow color={ribbon.color} size={100} />
      </motion.div>

      {/* LAYER 7: Tucked Personal Gift Card (Interactive) */}
      <motion.div
        className="absolute z-[28] cursor-pointer"
        style={{
          right: "8%",
          bottom: "16%",
          width: "58%",
        }}
        animate={
          cardFocused
            ? {
                x: "-35%",
                y: "-45%",
                scale: 1.18,
                rotate: 0,
                zIndex: 42,
                boxShadow: "0 22px 45px rgba(0,0,0,0.28)",
              }
            : {
                x: 0,
                y: 0,
                scale: 1,
                rotate: 4,
                zIndex: 28,
                boxShadow: "0 8px 20px rgba(80,60,40,0.18)",
              }
        }
        transition={{ type: "spring", stiffness: 340, damping: 25 }}
        onClick={() => setCardFocused(!cardFocused)}
        title={cardFocused ? "Tap to tuck card back into bouquet" : "Tap to focus and read card"}
      >
        <div
          className="p-4 sm:p-5 rounded-2xl border transition-all"
          style={{
            background: "#FFFDF9",
            borderColor: "rgba(180, 140, 100, 0.38)",
            color: "#382923",
          }}
        >
          <div className="flex items-center justify-between border-b border-rose-200/60 pb-1.5 mb-2">
            <span className="font-serif font-bold text-xs sm:text-sm text-rose-900 truncate">
              To: {toName || "My Favorite Person"}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-500">
              Floral Note
            </span>
          </div>

          <p className="font-script text-sm sm:text-base leading-relaxed line-clamp-4 text-zinc-800 italic">
            &ldquo;{message || "Thinking of you today and sending you these blooms."}&rdquo;
          </p>

          <div className="text-right pt-2 border-t border-rose-100/80 mt-2">
            <span className="font-serif text-[11px] sm:text-xs text-rose-800 font-semibold italic">
              From: {fromName || "Always Yours"}
            </span>
          </div>

          {cardFocused && (
            <p className="text-[9px] font-mono text-center text-zinc-400 pt-1 uppercase tracking-widest">
              Tap to tuck back in
            </p>
          )}
        </div>
      </motion.div>

      {/* LAYER 8: Recipient Interactive Untie Overlay */}
      <AnimatePresence>
        {isRevealMode && !isOpened && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-50 bg-black/45 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isUntying}
              onClick={handleOpenClick}
              className="px-6 py-4 rounded-full bg-white text-rose-900 font-sans font-bold text-sm sm:text-base shadow-2xl flex items-center gap-2.5 cursor-pointer border border-rose-200 transition-all active:scale-95 disabled:opacity-70"
            >
              {isUntying ? (
                <>
                  <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
                  <span>Untying with love...</span>
                </>
              ) : (
                <>
                  <span>Untie Ribbon and Unwrap Bouquet</span>
                  <span className="text-lg">🎀</span>
                </>
              )}
            </motion.button>
            <p className="text-white/90 font-mono text-xs mt-3 drop-shadow-sm">
              Handcrafted for you with botanical love
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
