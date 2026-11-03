/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types/game';
import { Send, X, MessageSquare } from 'lucide-react';
import { sounds } from '../audio/soundEffects';
import { BOT_CHAT_LINES } from '../entities/botPlayers';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  messages: ChatMessage[];
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  messages,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when pressing '/'
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sounds.playBuildSnap();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 left-3 md:left-4 z-40 w-80 md:w-96 flex flex-col pointer-events-auto bg-slate-950/95 border-2 border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-white/10">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span>BloxWorld Chat</span>
          <span className="text-[10px] text-slate-400 font-mono">(/)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message List */}
      <div className="h-56 overflow-y-auto p-3 space-y-2 text-xs font-medium">
        {messages.map((msg) => {
          let roleBadge = null;
          let roleColor = 'text-white font-bold';

          if (msg.role === 'owner') {
            roleBadge = <span className="bg-red-600 text-white font-bold px-1.5 py-0.2 rounded text-[10px] mr-1">[ADMIN]</span>;
            roleColor = 'text-red-400 font-bold';
          } else if (msg.role === 'vip') {
            roleBadge = <span className="bg-amber-500 text-black font-black px-1.5 py-0.2 rounded text-[10px] mr-1">[VIP]</span>;
            roleColor = 'text-amber-300 font-bold';
          } else if (msg.role === 'system') {
            return (
              <div key={msg.id} className="text-yellow-400 italic text-[11px] bg-yellow-500/10 px-2 py-1 rounded">
                ⚙️ {msg.text}
              </div>
            );
          }

          return (
            <div key={msg.id} className="leading-snug break-words">
              {roleBadge}
              <span className={roleColor}>{msg.sender}: </span>
              <span className="text-slate-200">{msg.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-2 bg-slate-900 border-t border-white/10 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="To chat click here or press / key..."
          maxLength={120}
          className="flex-1 bg-slate-800 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
        />
        <button
          type="submit"
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
