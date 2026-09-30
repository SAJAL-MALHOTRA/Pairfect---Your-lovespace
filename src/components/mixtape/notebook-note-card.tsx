"use client";

import React from "react";

interface NotebookNoteCardProps {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  senderName?: string;
}

export function NotebookNoteCard({
  value,
  onChange,
  readOnly = false,
  placeholder = "write a little note to your favorite person...",
  maxLength = 280,
  className = "",
  senderName,
}: NotebookNoteCardProps) {
  const currentLength = value.length;

  return (
    <div
      className={`relative mx-auto rounded-2xl bg-[#FCFAF2] border-2 border-[#E9DFCE] shadow-[0_12px_32px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden transition-all ${className}`}
      style={{
        maxWidth: 460,
        width: "100%",
        minHeight: 280,
      }}
    >
      {/* 4 Binder Punched Holes along left margin */}
      <div className="absolute top-0 bottom-0 left-3 w-6 flex flex-col justify-around py-6 pointer-events-none z-10">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="w-4 h-4 rounded-full bg-[#E3D9C6] border border-[#CFC3AE] shadow-[inset_0_2px_3px_rgba(0,0,0,0.25)]"
          />
        ))}
      </div>

      {/* Red / Salmon Vertical Margin Line */}
      <div className="absolute top-0 bottom-0 left-12 w-0.5 bg-red-300/80 pointer-events-none z-10" />

      {/* Blue Ruled Lines Background */}
      <div
        className="absolute inset-0 pl-14 pr-5 pt-5 pb-12 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(transparent, transparent 33px, #CDE2F5 33px, #CDE2F5 34px)",
          backgroundPositionY: "24px",
        }}
      />

      {/* Content Area */}
      <div className="relative pl-14 pr-6 pt-5 pb-12 z-20">
        {readOnly ? (
          <div className="min-h-[200px] whitespace-pre-wrap font-script text-2xl text-zinc-800 leading-[34px] break-words">
            {value || <span className="text-zinc-300 italic">No note attached...</span>}
            {senderName && (
              <div className="mt-4 text-right font-script text-xl text-zinc-600">
                with love, {senderName}
              </div>
            )}
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => {
              if (e.target.value.length <= maxLength) {
                onChange?.(e.target.value);
              }
            }}
            placeholder={placeholder}
            rows={6}
            maxLength={maxLength}
            className="w-full bg-transparent resize-none border-none outline-none font-script text-2xl text-zinc-800 placeholder:text-zinc-400 leading-[34px] focus:ring-0 p-0"
            style={{
              lineHeight: "34px",
            }}
          />
        )}
      </div>

      {/* Card Footer: Character Counter or Tape Accent */}
      <div className="absolute bottom-2.5 right-4 z-20 flex items-center gap-3">
        {!readOnly && (
          <span
            className={`font-mono text-xs ${
              currentLength >= maxLength
                ? "text-red-500 font-bold"
                : "text-zinc-400"
            }`}
          >
            {currentLength} / {maxLength}
          </span>
        )}
        <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
          PAIRFECT NOTE
        </span>
      </div>
    </div>
  );
}
