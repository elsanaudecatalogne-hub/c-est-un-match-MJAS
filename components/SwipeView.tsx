import React, { useState, useEffect } from 'react';
import { HospitalProfile, UserPreferences } from '../types';
import { SwipeCard } from './SwipeCard';
import { HOSPITALS_DATA } from '../services/hospitalsData';
import { dbSaveMatch } from '../services/dbService';

interface SwipeViewProps {
  userPrefs: UserPreferences;
  onMatch: (hospital: HospitalProfile) => void;
}

export const SwipeView: React.FC<SwipeViewProps> = ({ userPrefs, onMatch }) => {
  const [hospitals, setHospitals] = useState<HospitalProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHospitals();
  }, [userPrefs]);

  const loadHospitals = () => {
    // Calculate match percentage and distance based on user preferences
    const hospitalsWithScores = HOSPITALS_DATA.map((hospital) => {
      let matchScore = 50; // Base score

      // Size match
      if (userPrefs.preferred_size && hospital.size.includes(userPrefs.preferred_size)) {
        matchScore += 20;
      }

      // Region vibe match
      if (userPrefs.preferred_region_vibe) {
        const vibe = userPrefs.preferred_region_vibe.toLowerCase();
        const hospitalVibe = hospital.region_vibe.toLowerCase();
        if (hospitalVibe.includes(vibe) || vibe.includes(hospitalVibe.split(',')[0])) {
          matchScore += 15;
        }
      }

      // Specialty match
      if (userPrefs.specialty && hospital.specialty_focus.some(s => 
        s.toLowerCase().includes(userPrefs.specialty.toLowerCase())
      )) {
        matchScore += 15;
      }

      // Random distance (for demo purposes)
      const distance_km = Math.floor(Math.random() * 50) + 5;

      return {
        ...hospital,
        match_percentage: Math.min(matchScore, 99),
        distance_km,
      } as HospitalProfile;
    });

    // Sort by match percentage
    hospitalsWithScores.sort((a, b) => b.match_percentage - a.match_percentage);

    setHospitals(hospitalsWithScores);
    setLoading(false);
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentHospital = hospitals[currentIndex];

    if (direction === 'right') {
      // It's a match!
      await dbSaveMatch({
        id: crypto.randomUUID(),
        hospital: currentHospital,
        messages: [],
      });
      
      // Notify parent component
      onMatch(currentHospital);
    }

    // Move to next card
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin-slow text-6xl mb-4">☀️</div>
          <p className="text-brand-dark text-lg">Chargement des établissements...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= hospitals.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-8xl mb-6">🎉</div>
        <h2 className="text-3xl font-bold text-brand-dark mb-4">
          Vous avez tout vu !
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Vous avez parcouru tous les établissements. De nouveaux profils arrivent bientôt !
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="bg-brand-yellow hover:bg-yellow-500 text-brand-dark px-8 py-3 rounded-full font-bold transition-colors"
        >
          Recommencer
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full max-w-2xl mx-auto p-4">
      {/* Card stack - show current and next 2 cards */}
      {hospitals.slice(currentIndex, currentIndex + 3).map((hospital, index) => (
        <SwipeCard
          key={hospital.id}
          hospital={hospital}
          onSwipe={index === 0 ? handleSwipe : () => {}}
          style={{
            zIndex: 3 - index,
            transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
            pointerEvents: index === 0 ? 'auto' : 'none',
          }}
        />
      ))}

      {/* Counter */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-10">
        <span className="font-semibold text-brand-dark">
          {currentIndex + 1} / {hospitals.length}
        </span>
      </div>
    </div>
  );
};
