"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export interface CoupleBeansMascotProps {
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function CoupleBeansMascot({
  className = "w-32 h-24",
  interactive = true,
  onClick,
}: CoupleBeansMascotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const handleTap = () => {
    setTapCount((prev) => prev + 1);
    if (onClick) onClick();
  };

  return (
    <motion.div
      className={`relative mx-auto flex items-center justify-center select-none ${className}`}
      whileHover={interactive ? { scale: 1.06, y: -4 } : undefined}
      whileTap={interactive ? { scale: 0.95, y: 1 } : undefined}
      transition={{
        type: "spring",
        stiffness: 360,
        damping: 26,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleTap}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label="Pairfect Couple Beans Mascot"
      style={{ cursor: interactive ? "pointer" : "default" }}
    >
      <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-md overflow-visible">
        {/* Floating animated hearts */}
        {/* Heart 1: Main romantic rose heart */}
        <motion.path
          d="M78 18 C78 14 74 10 70 10 C66 10 63 13 63 16 C63 13 60 10 56 10 C52 10 48 14 48 18 C48 24 63 32 63 32 C63 32 78 24 78 18 Z"
          fill="#F43F5E"
          animate={{
            y: [0, -8, -18, -28],
            x: [0, 2.5, -2, 1],
            rotate: [-3, 4, -4, 2],
            scale: [0.75, 1.05, 0.95, 0.7],
            opacity: [0, 0.95, 0.85, 0],
          }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.7, 1],
          }}
          style={{ transformOrigin: "63px 21px" }}
        />

        {/* Heart 2: Playful coral heart drifting right */}
        <motion.path
          d="M106 24 C106 21 103 18 100 18 C97 18 95 20 95 22 C95 20 93 18 90 18 C87 18 84 21 84 24 C84 29 95 35 95 35 C95 35 106 29 106 24 Z"
          fill="#FB7185"
          animate={{
            y: [0, -7, -16, -26],
            x: [0, -2.5, 2, -1],
            rotate: [2, -5, 4, -2],
            scale: [0.65, 1, 0.9, 0.6],
            opacity: [0, 0.9, 0.8, 0],
          }}
          transition={{
            duration: 3.8,
            delay: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.7, 1],
          }}
          style={{ transformOrigin: "95px 26px" }}
        />

        {/* Heart 3: Petite blush heart drifting left */}
        <motion.path
          d="M52 24 C52 21 49 18 46 18 C43 18 41 20 41 22 C41 20 39 18 36 18 C33 18 30 21 30 24 C30 29 41 35 41 35 C41 35 52 29 52 24 Z"
          fill="#FDA4AF"
          animate={{
            y: [0, -6, -15, -24],
            x: [0, 2, -1.8, 0.5],
            rotate: [-4, 3, -3, 1],
            scale: [0.6, 0.95, 0.85, 0.55],
            opacity: [0, 0.85, 0.75, 0],
          }}
          transition={{
            duration: 4.0,
            delay: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.7, 1],
          }}
          style={{ transformOrigin: "41px 26px" }}
        />

        {/* Tap Reaction Heart Burst */}
        {tapCount > 0 && (
          <motion.path
            key={tapCount}
            d="M74 22 C74 18 70 14 66 14 C62 14 59 17 59 20 C59 17 56 14 52 14 C48 14 44 18 44 22 C44 28 59 36 59 36 C59 36 74 28 74 22 Z"
            fill="#FF2D55"
            initial={{ scale: 0.4, y: 0, opacity: 1 }}
            animate={{ scale: 1.35, y: -26, opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            style={{ transformOrigin: "59px 25px" }}
          />
        )}

        {/* Left Bean (Warm Pink / Rose) */}
        <g transform="translate(18, 30)">
          <motion.g
            animate={{
              rotate: isHovered ? [-6, -3, -6] : [-6, -4, -6],
              y: isHovered ? [0, -3.5, 0] : [0, -2, 0],
              scaleY: isHovered ? [1, 1.04, 1] : [1, 1.025, 1],
              scaleX: isHovered ? [1, 0.975, 1] : [1, 0.985, 1],
            }}
            transition={{
              duration: isHovered ? 1.6 : 3.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "38px 74px" }}
          >
            {/* Body */}
            <rect x="10" y="8" width="56" height="74" rx="28" fill="#FDA4AF" stroke="#1C1917" strokeWidth="2.5" />
            {/* Belly highlight */}
            <ellipse cx="38" cy="52" rx="20" ry="24" fill="#FFE4E6" />

            {/* Natural Blinking Eyes */}
            <motion.g
              animate={{
                scaleY: [1, 1, 0.08, 1, 1],
              }}
              transition={{
                duration: 4.6,
                repeat: Infinity,
                times: [0, 0.88, 0.91, 0.94, 1],
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "37px 38px" }}
            >
              {/* Eyes */}
              <circle cx="28" cy="38" r="3" fill="#1C1917" />
              <circle cx="46" cy="38" r="3" fill="#1C1917" />
              {/* Eye shine */}
              <circle cx="29" cy="37" r="1" fill="#FFFFFF" />
              <circle cx="47" cy="37" r="1" fill="#FFFFFF" />
            </motion.g>

            {/* Interactive Rosy Cheeks */}
            <motion.circle
              cx="22"
              cy="44"
              r="3.5"
              fill={isHovered ? "#E11D48" : "#F43F5E"}
              animate={{
                scale: isHovered ? [1.2, 1.45, 1.25] : [1, 1.08, 1],
                opacity: isHovered ? [0.85, 1, 0.85] : [0.55, 0.72, 0.55],
              }}
              transition={
                isHovered
                  ? { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
                  : { repeat: Infinity, duration: 3.4, ease: "easeInOut" }
              }
              style={{ transformOrigin: "22px 44px" }}
            />
            <motion.circle
              cx="52"
              cy="44"
              r="3.5"
              fill={isHovered ? "#E11D48" : "#F43F5E"}
              animate={{
                scale: isHovered ? [1.2, 1.45, 1.25] : [1, 1.08, 1],
                opacity: isHovered ? [0.85, 1, 0.85] : [0.55, 0.72, 0.55],
              }}
              transition={
                isHovered
                  ? { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
                  : { repeat: Infinity, duration: 3.4, ease: "easeInOut" }
              }
              style={{ transformOrigin: "52px 44px" }}
            />

            {/* Smile */}
            <path d="M33 44 Q37 49 41 44" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Left Little Arm */}
            <motion.path
              d="M10 48 Q2 54 8 62"
              stroke="#1C1917"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              animate={isHovered ? { rotate: [-4, 6, -4] } : { rotate: 0 }}
              transition={{ repeat: isHovered ? Infinity : 0, duration: 0.8, ease: "easeInOut" }}
              style={{ transformOrigin: "10px 48px" }}
            />
          </motion.g>
        </g>

        {/* Right Bean (Soft Lavender / Purple) */}
        <g transform="translate(68, 26)">
          <motion.g
            animate={{
              rotate: isHovered ? [6, 3, 6] : [6, 4, 6],
              y: isHovered ? [0, -3.8, 0] : [0, -2.2, 0],
              scaleY: isHovered ? [1, 1.045, 1] : [1, 1.028, 1],
              scaleX: isHovered ? [1, 0.972, 1] : [1, 0.982, 1],
            }}
            transition={{
              duration: isHovered ? 1.6 : 3.8,
              repeat: Infinity,
              delay: 0.2,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "38px 76px" }}
          >
            {/* Body */}
            <rect x="10" y="8" width="56" height="78" rx="28" fill="#DDD6FE" stroke="#1C1917" strokeWidth="2.5" />
            {/* Belly highlight */}
            <ellipse cx="38" cy="54" rx="20" ry="25" fill="#EDE9FE" />

            {/* Natural Blinking / Squinting Happy Eyes */}
            <motion.g
              animate={{
                scaleY: [1, 1, 0.15, 1.15, 1, 1],
              }}
              transition={{
                duration: 5.2,
                delay: 0.9,
                repeat: Infinity,
                times: [0, 0.86, 0.89, 0.92, 0.95, 1],
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "38px 38px" }}
            >
              {/* Eyes (happy curved arcs) */}
              <path d="M25 38 Q29 34 33 38" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M43 38 Q47 34 51 38" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </motion.g>

            {/* Interactive Rosy Cheeks */}
            <motion.circle
              cx="21"
              cy="44"
              r="3.5"
              fill={isHovered ? "#9333EA" : "#A78BFA"}
              animate={{
                scale: isHovered ? [1.2, 1.45, 1.25] : [1, 1.08, 1],
                opacity: isHovered ? [0.85, 1, 0.85] : [0.55, 0.72, 0.55],
              }}
              transition={
                isHovered
                  ? { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
                  : { repeat: Infinity, duration: 3.8, delay: 0.2, ease: "easeInOut" }
              }
              style={{ transformOrigin: "21px 44px" }}
            />
            <motion.circle
              cx="55"
              cy="44"
              r="3.5"
              fill={isHovered ? "#9333EA" : "#A78BFA"}
              animate={{
                scale: isHovered ? [1.2, 1.45, 1.25] : [1, 1.08, 1],
                opacity: isHovered ? [0.85, 1, 0.85] : [0.55, 0.72, 0.55],
              }}
              transition={
                isHovered
                  ? { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
                  : { repeat: Infinity, duration: 3.8, delay: 0.2, ease: "easeInOut" }
              }
              style={{ transformOrigin: "55px 44px" }}
            />

            {/* Smile with cute open mouth */}
            <path d="M34 45 Q38 51 42 45" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" fill="#F43F5E" />

            {/* Right Little Arm */}
            <motion.path
              d="M66 50 Q74 56 68 64"
              stroke="#1C1917"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              animate={isHovered ? { rotate: [4, -6, 4] } : { rotate: 0 }}
              transition={{ repeat: isHovered ? Infinity : 0, duration: 0.8, ease: "easeInOut" }}
              style={{ transformOrigin: "66px 50px" }}
            />
          </motion.g>
        </g>

        {/* Embracing Hands in the center */}
        <motion.path
          d="M64 74 Q74 68 84 74"
          stroke="#1C1917"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          animate={{
            y: isHovered ? [0, -2, 0] : [0, -1.2, 0],
            scaleY: [1, 1.04, 1],
          }}
          transition={{
            duration: isHovered ? 1.6 : 3.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "74px 74px" }}
        />
      </svg>
    </motion.div>
  );
}

export interface HeartBeansAirplaneMascotProps {
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function HeartBeansAirplaneMascot({
  className = "w-28 h-20",
  interactive = true,
  onClick,
}: HeartBeansAirplaneMascotProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative mx-auto flex items-center justify-center select-none ${className}`}
      whileHover={interactive ? { scale: 1.06, y: -3 } : undefined}
      whileTap={interactive ? { scale: 0.95, y: 1 } : undefined}
      transition={{
        type: "spring",
        stiffness: 360,
        damping: 26,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label="Pairfect Heart Beans Airplane Mascot"
      style={{ cursor: interactive ? "pointer" : "default" }}
    >
      <svg viewBox="0 0 160 110" className="w-full h-full overflow-visible drop-shadow-xs">
        {/* Animated trajectory dashed line gliding smoothly along the flight path */}
        <motion.path
          d="M 22 55 Q 75 8 138 38"
          fill="none"
          stroke="#FDA4AF"
          strokeWidth="1.8"
          strokeDasharray="4 4"
          opacity={0.85}
          animate={{ strokeDashoffset: [0, -32] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Soaring airplane with organic turbulence wobble */}
        <g transform="translate(86, 15)">
          <motion.g
            animate={{
              rotate: [16, 19, 13, 17, 16],
              y: isHovered ? [0, -3.5, 1, -2, 0] : [0, -2, 1.2, -1, 0],
              x: [0, 0.8, -0.6, 0.4, 0],
            }}
            transition={{
              duration: isHovered ? 1.8 : 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "0px 0px" }}
          >
            {/* Plane fuselage */}
            <path
              d="M -10 0 L 10 -2 L 14 0 L 10 2 L -10 2 Z"
              fill="#FFFFFF"
              stroke="#1C1917"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Main wing */}
            <path
              d="M 0 -2 L -5 -9 L 2 -2 Z"
              fill="#93C5FD"
              stroke="#1C1917"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Tail wing */}
            <path
              d="M -9 0 L -12 -5 L -8 -1 Z"
              fill="#F472B6"
              stroke="#1C1917"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </motion.g>
        </g>

        {/* Left Heart Bean (Pink) with gentle swaying */}
        <g transform="translate(18, 30)">
          <motion.g
            animate={{
              rotate: isHovered ? [-4, 3, -4] : [-2.5, 2, -2.5],
              y: isHovered ? [0, -2.5, 0] : [0, -1.2, 0],
            }}
            transition={{
              duration: isHovered ? 1.8 : 3.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "20px 52px" }}
          >
            {/* Heart body */}
            <path
              d="M 28 14 C 28 6 18 4 14 11 C 10 4 0 6 0 14 C 0 25 14 36 14 36 C 14 36 28 25 28 14 Z"
              transform="scale(1.4)"
              fill="#FDA4AF"
              stroke="#1C1917"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Soft lighter belly shine */}
            <ellipse cx="20" cy="24" rx="10" ry="11" fill="#FFE4E6" />

            {/* Natural Blinking Eyes */}
            <motion.g
              animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
              transition={{
                duration: 4.4,
                repeat: Infinity,
                times: [0, 0.88, 0.91, 0.94, 1],
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "20px 18px" }}
            >
              <circle cx="14" cy="18" r="2.4" fill="#1C1917" />
              <circle cx="26" cy="18" r="2.4" fill="#1C1917" />
              <circle cx="15" cy="17" r="0.8" fill="#FFFFFF" />
              <circle cx="27" cy="17" r="0.8" fill="#FFFFFF" />
            </motion.g>

            {/* Sweet Eyelashes */}
            <path d="M 12 15 L 9 13" stroke="#1C1917" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 28 15 L 31 13" stroke="#1C1917" strokeWidth="1.2" strokeLinecap="round" />

            {/* Rosy Cheeks */}
            <motion.circle
              cx="10"
              cy="23"
              r="2.8"
              fill="#F43F5E"
              animate={{
                scale: isHovered ? [1.2, 1.45, 1.25] : [1, 1.08, 1],
                opacity: isHovered ? [0.85, 1, 0.85] : [0.65, 0.85, 0.65],
              }}
              transition={
                isHovered
                  ? { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
                  : { repeat: Infinity, duration: 3.4, ease: "easeInOut" }
              }
              style={{ transformOrigin: "10px 23px" }}
            />
            <motion.circle
              cx="30"
              cy="23"
              r="2.8"
              fill="#F43F5E"
              animate={{
                scale: isHovered ? [1.2, 1.45, 1.25] : [1, 1.08, 1],
                opacity: isHovered ? [0.85, 1, 0.85] : [0.65, 0.85, 0.65],
              }}
              transition={
                isHovered
                  ? { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
                  : { repeat: Infinity, duration: 3.4, ease: "easeInOut" }
              }
              style={{ transformOrigin: "30px 23px" }}
            />

            {/* Smile */}
            <path d="M 17 22 Q 20 25 23 22" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Feet */}
            <ellipse cx="14" cy="52" rx="3.5" ry="2.2" fill="#FB7185" stroke="#1C1917" strokeWidth="1.5" />
            <ellipse cx="26" cy="52" rx="3.5" ry="2.2" fill="#FB7185" stroke="#1C1917" strokeWidth="1.5" />
          </motion.g>
        </g>

        {/* Right Heart Bean (Baby Blue) with gentle swaying */}
        <g transform="translate(68, 30)">
          <motion.g
            animate={{
              rotate: isHovered ? [4, -3, 4] : [2.5, -2, 2.5],
              y: isHovered ? [0, -2.5, 0] : [0, -1.2, 0],
            }}
            transition={{
              duration: isHovered ? 1.8 : 3.4,
              delay: 0.25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "20px 52px" }}
          >
            {/* Heart body */}
            <path
              d="M 28 14 C 28 6 18 4 14 11 C 10 4 0 6 0 14 C 0 25 14 36 14 36 C 14 36 28 25 28 14 Z"
              transform="scale(1.4)"
              fill="#BAE6FD"
              stroke="#1C1917"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Soft lighter belly shine */}
            <ellipse cx="20" cy="24" rx="10" ry="11" fill="#E0F2FE" />

            {/* Natural Blinking Eyes */}
            <motion.g
              animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
              transition={{
                duration: 5.0,
                delay: 0.8,
                repeat: Infinity,
                times: [0, 0.88, 0.91, 0.94, 1],
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "20px 18px" }}
            >
              <circle cx="14" cy="18" r="2.4" fill="#1C1917" />
              <circle cx="26" cy="18" r="2.4" fill="#1C1917" />
              <circle cx="15" cy="17" r="0.8" fill="#FFFFFF" />
              <circle cx="27" cy="17" r="0.8" fill="#FFFFFF" />
            </motion.g>

            {/* Rosy Cheeks */}
            <motion.circle
              cx="10"
              cy="23"
              r="2.8"
              fill={isHovered ? "#0284C7" : "#38BDF8"}
              animate={{
                scale: isHovered ? [1.2, 1.45, 1.25] : [1, 1.08, 1],
                opacity: isHovered ? [0.85, 1, 0.85] : [0.65, 0.85, 0.65],
              }}
              transition={
                isHovered
                  ? { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
                  : { repeat: Infinity, duration: 3.4, ease: "easeInOut" }
              }
              style={{ transformOrigin: "10px 23px" }}
            />
            <motion.circle
              cx="30"
              cy="23"
              r="2.8"
              fill={isHovered ? "#0284C7" : "#38BDF8"}
              animate={{
                scale: isHovered ? [1.2, 1.45, 1.25] : [1, 1.08, 1],
                opacity: isHovered ? [0.85, 1, 0.85] : [0.65, 0.85, 0.65],
              }}
              transition={
                isHovered
                  ? { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
                  : { repeat: Infinity, duration: 3.4, ease: "easeInOut" }
              }
              style={{ transformOrigin: "30px 23px" }}
            />

            {/* Smile */}
            <path d="M 17 22 Q 20 25 23 22" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Feet */}
            <ellipse cx="14" cy="52" rx="3.5" ry="2.2" fill="#7DD3FC" stroke="#1C1917" strokeWidth="1.5" />
            <ellipse cx="26" cy="52" rx="3.5" ry="2.2" fill="#7DD3FC" stroke="#1C1917" strokeWidth="1.5" />
          </motion.g>
        </g>

        {/* Holding hands in the middle */}
        <motion.path
          d="M 50 56 Q 63 64 76 56"
          stroke="#1C1917"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          animate={{ y: isHovered ? [0, -1.8, 0] : [0, -0.8, 0] }}
          transition={{
            duration: isHovered ? 1.8 : 3.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating mini heart between them */}
        <motion.path
          d="M 64 36 C 64 33 61 31 59 33 C 57 31 54 33 54 36 C 54 40 59 44 59 44 C 59 44 64 40 64 36 Z"
          fill="#F43F5E"
          animate={{
            y: [0, -4, 0],
            scale: [1, 1.18, 1],
            opacity: [0.75, 1, 0.75],
          }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "59px 38px" }}
        />
      </svg>
    </motion.div>
  );
}

export default CoupleBeansMascot;
