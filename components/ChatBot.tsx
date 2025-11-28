
import React, { useState, useEffect, useRef } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { createChatSession } from '../services/geminiService';
import { ChatMessage, Report } from '../types';
import { Icons } from './Icons';
import ReactMarkdown from 'react-markdown';

interface ChatBotProps {
  currentReport: Report | null;
  history: Report[];
}

export const ChatBot: React.FC<ChatBotProps> = ({ currentReport, history }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Re-initialize chat when context changes significantly
  useEffect(() => {
    try {
      let contextString = "";
      
      if (currentReport) {
        contextString += `User is currently viewing a report titled: "${currentReport.title}". 
        Executive Summary: ${currentReport.executiveSummary}.
        Key Insights: ${currentReport.keyInsights.map(k => k.text).join('; ')}. `;
      }

      if (history.length > 0) {
        const recentTitles = history.slice(0, 3).map(h => h.title).join(", ");
        contextString += `User has previously analyzed: ${recentTitles}.`;
      }

      chatSession.current = createChatSession(contextString);

      // Only add greeting if it's the very first load
      if (messages.length === 0) {
        setMessages([{
          id: 'init',
          role: 'model',
          text: currentReport 
            ? `I'm here to help you dig deeper into "${currentReport.title}". What would you like to know?`
            : "Namaste! I'm your PolitiSight assistant. Ask me about Indian politics or start a new analysis.",
          timestamp: new Date()
        }]);
      }
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  }, [currentReport?.id, history.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await chatSession.current.sendMessageStream({ message: userMsg.text });
      
      let fullResponse = '';
      const botMsgId = (Date.now() + 1).toString();
      
      // Add placeholder bot message
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullResponse += c.text;
          setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { ...msg, text: fullResponse } : msg
          ));
        }
      }
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-slate-700 rotate-90' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-110'
        }`}
      >
        {isOpen ? <Icons.Close className="text-white" /> : <Icons.Message className="text-white" />}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] glass-panel rounded-2xl flex flex-col shadow-2xl transition-all duration-300 transform z-40 origin-bottom-right border border-white/10 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-white/5 rounded-t-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
            <Icons.Bot size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white">AI Assistant</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {currentReport ? 'Report Context Active' : 'Online • Gemini 3 Pro'}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                  msg.role === 'user' ? 'bg-slate-700' : 'bg-violet-600'
                }`}
              >
                {msg.role === 'user' ? <Icons.User size={14} /> : <Icons.Bot size={14} />}
              </div>
              <div 
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-700 text-white rounded-tr-none' 
                    : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex-shrink-0 flex items-center justify-center mt-1">
                  <Icons.Bot size={14} />
                </div>
                <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-slate-900/50 rounded-b-2xl">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="w-full bg-slate-800 text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 border border-white/10"
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icons.Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
