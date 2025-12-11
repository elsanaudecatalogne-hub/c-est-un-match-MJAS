import React, { useState, useEffect, useRef } from 'react';
import { Match, ChatMessage } from '../types';
import { Send, ChevronLeft, MoreVertical, Mail } from 'lucide-react';

interface ChatScreenProps {
  match: Match;
  onBack: () => void;
  onUpdateMatch: (updatedMatch: Match) => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ match, onBack, onUpdateMatch }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [match.messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    const updatedMessages = [...match.messages, userMsg];
    const updatedMatch = { ...match, messages: updatedMessages, lastMessage: input };
    
    // Update state immediately
    onUpdateMatch(updatedMatch);
    setInput('');
    
    // No AI response generation here. 
    // The message is stored in the shared state (App.tsx) and will be visible in RecruiterDashboard.
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex flex-col border-b border-gray-100 bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-3 pb-2">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-brand-pink">
            <ChevronLeft size={28} />
            </button>
            <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-teal mb-1">
                <img src={match.hospital.image_url} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">{match.hospital.name}</h3>
            </div>
            <button className="p-2 -mr-2 text-gray-300">
            <MoreVertical size={24} />
            </button>
          </div>
          <div className="bg-gray-50 px-4 py-1 text-[10px] text-gray-500 flex items-center justify-center gap-1 border-t border-gray-100">
             <Mail size={10} /> Connecté à jepostule.audepo@elsan.care
          </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-bg">
        <div className="text-center text-xs text-gray-400 my-4">
          Vous avez matché avec {match.hospital.name} ! <br/>
          Envoyez un message pour postuler. 📄
        </div>
        
        {match.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-brand-teal text-white rounded-br-none'
                  : 'bg-white text-gray-700 border border-gray-200 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {match.messages.length > 0 && match.messages[match.messages.length - 1].sender === 'user' && (
             <div className="text-[10px] text-center text-gray-400 italic mt-2">
                 En attente de réponse du service RH...
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-brand-teal focus-within:ring-1 focus-within:ring-brand-teal transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="text-brand-teal disabled:text-gray-300 hover:scale-110 transition-transform"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;