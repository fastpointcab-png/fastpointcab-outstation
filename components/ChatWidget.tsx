import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', sender: 'bot', text: 'Hi! I can help you pick the perfect ride or answer questions about our services.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const reply = await sendMessageToGemini(userMsg.text);
    
    const botMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: reply };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right">
          <div className="bg-amber-500 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={24} />
              <span className="font-bold">CabBot Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-amber-600 p-1 rounded">
              <X size={20} />
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 p-4 h-80 overflow-y-auto bg-slate-50 dark:bg-slate-900 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-amber-500 text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
               <div className="flex justify-start">
               <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-600">
                 <div className="flex gap-1">
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                 </div>
               </div>
             </div>
            )}
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about fleets, prices..."
              className="flex-1 bg-slate-100 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
        aria-label="Chat Support"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};
