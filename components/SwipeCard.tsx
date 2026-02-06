import React, { useState, useRef } from 'react';
import { HospitalProfile } from '../types';
import { Heart, X, MapPin, Users, Briefcase } from 'lucide-react';

interface SwipeCardProps {
  hospital: HospitalProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  style?: React.CSSProperties;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ hospital, onSwipe, style }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showEmoji, setShowEmoji] = useState<'heart' | 'sad' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - startPos.current.x;
    const newY = e.clientY - startPos.current.y;
    setDragOffset({ x: newX, y: newY });

    // Show emoji based on drag direction
    if (newX > 100) {
      setShowEmoji('heart');
    } else if (newX < -100) {
      setShowEmoji('sad');
    } else {
      setShowEmoji(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Trigger swipe if dragged far enough
    if (dragOffset.x > 150) {
      onSwipe('right');
    } else if (dragOffset.x < -150) {
      onSwipe('left');
    } else {
      // Reset position
      setDragOffset({ x: 0, y: 0 });
    }
    setShowEmoji(null);
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    setShowEmoji(direction === 'right' ? 'heart' : 'sad');
    const targetX = direction === 'right' ? 400 : -400;
    setDragOffset({ x: targetX, y: 0 });
    
    setTimeout(() => {
      onSwipe(direction);
      setShowEmoji(null);
      setDragOffset({ x: 0, y: 0 });
    }, 300);
  };

  const rotation = dragOffset.x * 0.1;
  const opacity = 1 - Math.abs(dragOffset.x) / 400;

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 select-none"
      style={{
        ...style,
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        opacity,
        transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Emoji overlay */}
      {showEmoji && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-9xl animate-pulse">
            {showEmoji === 'heart' ? '❤️' : '😢'}
          </div>
        </div>
      )}

      {/* Card content */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative h-96 overflow-hidden">
          <img
            src={hospital.image_url}
            alt={hospital.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-brand-pink text-white px-4 py-2 rounded-full font-bold text-lg">
            {hospital.match_percentage}% Match
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-3xl font-bold text-brand-dark mb-2">{hospital.name}</h2>
          
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin className="w-5 h-5" />
            <span>{hospital.location}</span>
            <span className="mx-2">•</span>
            <span>{hospital.distance_km} km</span>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">{hospital.bio}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {hospital.size.map((s, i) => (
              <span key={i} className="flex items-center gap-1 bg-brand-yellow/20 text-brand-dark px-3 py-1 rounded-full text-sm">
                <Users className="w-4 h-4" />
                {s}
              </span>
            ))}
            {hospital.specialty_focus.slice(0, 2).map((spec, i) => (
              <span key={i} className="flex items-center gap-1 bg-brand-teal/20 text-brand-dark px-3 py-1 rounded-full text-sm">
                <Briefcase className="w-4 h-4" />
                {spec}
              </span>
            ))}
          </div>

          {/* Perks */}
          <div className="mb-4">
            <h3 className="font-semibold text-brand-dark mb-2">Avantages :</h3>
            <ul className="space-y-1">
              {hospital.perks.slice(0, 4).map((perk, i) => (
                <li key={i} className="text-gray-600 flex items-start gap-2">
                  <span className="text-brand-teal">✓</span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-6 flex justify-center gap-6 border-t">
          <button
            onClick={() => handleButtonSwipe('left')}
            className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <X className="w-8 h-8 text-gray-600" />
          </button>
          <button
            onClick={() => handleButtonSwipe('right')}
            className="w-16 h-16 rounded-full bg-brand-pink hover:bg-pink-600 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <Heart className="w-8 h-8 text-white" fill="white" />
          </button>
        </div>
      </div>
    </div>
  );
};
