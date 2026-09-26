"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Smile, Image as ImageIcon, X, Loader2, Sparkles } from "lucide-react";
import { GifResult } from "@/app/api/tenor/search/route";

export interface SessionChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text?: string;
  gifUrl?: string;
  emoji?: string;
  createdAt: string;
}

interface SessionChatProps {
  messages: SessionChatMessage[];
  currentUserId: string;
  partnerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (content: { text?: string; gifUrl?: string; emoji?: string }) => void;
  onSendHeart: () => void;
}

const QUICK_EMOJIS = ["❤️", "😂", "🥺", "🔥", "🍿", "👏", "😭", "✨"];
const QUICK_GIF_TOPICS = ["Love", "Hug", "Cheers", "Popcorn", "Laugh", "Cute"];

export function SessionChat({
  messages,
  currentUserId,
  partnerName,
  isOpen,
  onClose,
  onSendMessage,
  onSendHeart,
}: SessionChatProps) {
  const [inputText, setInputText] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [gifResults, setGifResults] = useState<GifResult[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load GIFs when GIF picker is opened or query changes
  useEffect(() => {
    if (!showGifPicker) return;

    let active = true;
    const fetchGifs = async () => {
      setLoadingGifs(true);
      try {
        const query = gifSearchQuery.trim() || "love cute";
        const res = await fetch(`/api/tenor/search?q=${encodeURIComponent(query)}`);
        if (res.ok && active) {
          const json = await res.json();
          setGifResults(json.results || []);
        }
      } catch (err) {
        console.error("Failed to load Tenor GIFs:", err);
      } finally {
        if (active) setLoadingGifs(false);
      }
    };

    const timer = setTimeout(fetchGifs, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [showGifPicker, gifSearchQuery]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage({ text: inputText.trim() });
    setInputText("");
  };

  const handleSelectGif = (gif: GifResult) => {
    onSendMessage({ gifUrl: gif.url });
    setShowGifPicker(false);
    setGifSearchQuery("");
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-3 bottom-20 top-3 w-80 sm:w-96 rounded-3xl bg-white/95 border border-[#FFD9E3] shadow-2xl backdrop-blur-md flex flex-col z-40 overflow-hidden paper-grain animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-[#FFD9E3] flex items-center justify-between bg-[#FFF8FA]/80">
        <div>
          <h4 className="font-display italic font-bold text-base text-[#3D2432]">
            In-Call Chat
          </h4>
          <p className="text-[10px] font-mono text-[#7A4B5D] uppercase tracking-wider">
            With {partnerName} · Live &amp; Private
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full border border-[#FFD9E3] text-[#7A4B5D] hover:text-[#3D2432] hover:bg-white cursor-pointer transition-colors"
          title="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages list */}
      <div ref={scrollRef} className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 text-[#7A4B5D]">
            <Sparkles className="w-6 h-6 text-[#E8527D]" />
            <p className="font-display italic text-sm text-[#3D2432]">No messages yet.</p>
            <p className="text-[11px] leading-relaxed">
              Send a note, a quick emoji, or search a reaction GIF below!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <span className="text-[9px] font-mono text-[#7A4B5D] px-1 mb-0.5">
                  {isMe ? "You" : m.senderName}
                </span>

                {m.text && (
                  <div
                    className={`max-w-[85%] px-3.5 py-2 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                      isMe
                        ? "bg-[#E8527D] text-white rounded-br-xs shadow-xs"
                        : "bg-[#FFF0F4] text-[#3D2432] border border-[#FFD9E3] rounded-bl-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                )}

                {m.gifUrl && (
                  <div className="rounded-2xl overflow-hidden border border-[#FFD9E3] max-w-[80%] shadow-sm bg-black/5 mt-1">
                    <img
                      src={m.gifUrl}
                      alt="Reaction GIF"
                      className="w-full h-auto max-h-48 object-cover rounded-xl"
                      loading="lazy"
                    />
                  </div>
                )}

                {m.emoji && (
                  <span className="text-3xl filter drop-shadow-xs my-0.5">{m.emoji}</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tenor GIF Search Popup Layer */}
      {showGifPicker && (
        <div className="p-3 border-t border-[#FFD9E3] bg-[#FFF8FA] space-y-2.5 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E8527D]">
              Tenor Reaction GIFs
            </span>
            <button
              onClick={() => setShowGifPicker(false)}
              className="text-[#7A4B5D] hover:text-[#3D2432] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Search GIFs (e.g. hug, popcorn, laugh)..."
            value={gifSearchQuery}
            onChange={(e) => setGifSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-[#FFD9E3] bg-white text-xs text-[#3D2432] focus:outline-none focus:border-[#E8527D]"
          />

          {/* Quick topic buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_GIF_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setGifSearchQuery(topic)}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white border border-[#FFD9E3] text-[#7A4B5D] hover:border-[#E8527D] shrink-0"
              >
                {topic}
              </button>
            ))}
          </div>

          {loadingGifs ? (
            <div className="py-8 text-center">
              <Loader2 className="w-5 h-5 text-[#E8527D] animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {gifResults.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => handleSelectGif(gif)}
                  className="rounded-xl overflow-hidden border border-[#FFD9E3] hover:border-[#E8527D] transition-all aspect-video relative group bg-black/5"
                >
                  <img
                    src={gif.previewUrl || gif.url}
                    alt={gif.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Emoji Bar */}
      <div className="px-3 pt-2 pb-1 border-t border-[#FFD9E3]/70 flex items-center justify-between bg-white/70">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSendMessage({ emoji })}
              className="w-7 h-7 rounded-full hover:bg-[#FFF0F4] hover:scale-120 active:scale-95 transition-all text-sm flex items-center justify-center cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSendHeart}
          className="text-base hover:scale-125 transition-transform p-1 cursor-pointer"
          title="Send Heart Shower"
        >
          💖
        </button>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSendText} className="p-3 bg-white flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowGifPicker((v) => !v)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            showGifPicker
              ? "bg-[#E8527D] text-white border-[#E8527D]"
              : "border-[#FFD9E3] text-[#7A4B5D] hover:text-[#E8527D] hover:bg-[#FFF0F4]"
          }`}
          title="Search Tenor GIFs"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${partnerName}...`}
          className="flex-1 px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FFD9E3] text-xs text-[#3D2432] placeholder:text-[#B392A0] focus:outline-none focus:border-[#E8527D] focus:ring-1 focus:ring-[#E8527D]"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-[#E8527D] text-white hover:bg-[#D13D68] disabled:opacity-40 transition-all cursor-pointer shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
