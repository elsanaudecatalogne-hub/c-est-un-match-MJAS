import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { MessageCircle, MapPin } from 'lucide-react';
import { dbGetMatches } from '../services/dbService';
import { ChatWindow } from './ChatWindow';

export const MatchesList: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    const fetchedMatches = await dbGetMatches();
    setMatches(fetchedMatches);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin-slow text-6xl mb-4">☀️</div>
          <p className="text-brand-dark text-lg">Chargement de vos matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-8xl mb-6">💔</div>
        <h2 className="text-3xl font-bold text-brand-dark mb-4">
          Aucun match pour l'instant
        </h2>
        <p className="text-gray-600 max-w-md">
          Commencez à swiper les établissements pour créer vos premiers matches !
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-3xl font-bold text-brand-dark mb-6">
        Mes Matches ❤️
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match) => (
          <div
            key={match.id}
            onClick={() => setSelectedMatch(match)}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
          >
            <div className="flex">
              {/* Image */}
              <div className="w-32 h-32 flex-shrink-0">
                <img
                  src={match.hospital.image_url}
                  alt={match.hospital.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-brand-dark mb-1">
                    {match.hospital.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{match.hospital.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-brand-pink">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">
                      {match.messages.length} message{match.messages.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="bg-brand-yellow px-3 py-1 rounded-full text-sm font-semibold">
                    {match.hospital.match_percentage}% Match
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat window */}
      {selectedMatch && (
        <ChatWindow
          match={selectedMatch}
          onClose={() => {
            setSelectedMatch(null);
            loadMatches(); // Reload to get updated messages
          }}
        />
      )}
    </div>
  );
};
