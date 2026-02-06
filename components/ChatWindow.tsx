import React, { useState, useRef, useEffect } from 'react';
import { Match } from '../types';
import { X, Send } from 'lucide-react';
import { dbUpdateMatch } from '../services/dbService';

interface ChatWindowProps {
  match: Match;
  onClose: () => void;
  isNewMatch?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ match, onClose, isNewMatch }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(match.messages || []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const newMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setMessage('');

    // Save to database
    await dbUpdateMatch({
      ...match,
      messages: updatedMessages,
    });

    // Simulate hospital response after 2 seconds
    setTimeout(async () => {
      const hospitalResponse = {
        id: crypto.randomUUID(),
        sender: 'hospital',
        text: getAutomaticResponse(),
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, hospitalResponse];
      setMessages(finalMessages);

      await dbUpdateMatch({
        ...match,
        messages: finalMessages,
      });
    }, 2000);
  };

  const getAutomaticResponse = () => {
    const responses = [
      "Ravi de faire votre connaissance ! Notre équipe RH vous contactera très prochainement. ☀️",
      "Merci pour votre intérêt ! Nous serions ravis d'échanger avec vous sur nos opportunités.",
      "Super ! Quand seriez-vous disponible pour un entretien téléphonique ?",
      "Excellent ! Nous organisons des portes ouvertes la semaine prochaine. Intéressé(e) ?",
      "Parfait ! Notre responsable médical aimerait vous présenter nos projets. Disponible cette semaine ?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-brand-yellow p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={match.hospital.image_url}
              alt={match.hospital.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-bold text-brand-dark">{match.hospital.name}</h3>
              <p className="text-sm text-gray-700">{match.hospital.location}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-yellow-500 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-brand-dark" />
          </button>
        </div>

        {/* New match celebration */}
        {isNewMatch && (
          <div className="bg-gradient-to-r from-pink-100 to-yellow-100 p-6 text-center border-b">
            <div className="text-5xl mb-2">🎉</div>
            <h4 className="text-xl font-bold text-brand-dark mb-1">C'est un Match !</h4>
            <p className="text-gray-600">
              Vous et {match.hospital.name} êtes désormais connectés
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-6xl mb-4">💬</p>
              <p>Envoyez votre premier message !</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-brand-pink text-white'
                      : 'bg-gray-200 text-brand-dark'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-pink-200' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Écrivez votre message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="bg-brand-pink hover:bg-pink-600 disabled:bg-gray-300 text-white p-3 rounded-full transition-colors"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
