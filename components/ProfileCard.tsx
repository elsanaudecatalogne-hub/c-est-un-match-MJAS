
import React from 'react';
import { HospitalProfile } from '../types';
import { MapPin, Building2, Sun, Clock, Info } from 'lucide-react';

interface ProfileCardProps {
  profile: HospitalProfile;
  onShowDetails: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onShowDetails }) => {
  return (
    <div className="relative w-full h-full bg-white rounded-3xl shadow-xl overflow-hidden select-none border border-gray-100">
      {/* Image Section - Clickable to show details */}
      <div className="h-[68%] w-full relative group cursor-pointer" onClick={onShowDetails}>
        <img 
          src={profile.image_url} 
          alt={profile.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute bottom-5 left-5 text-white right-5">
          <div className="flex items-center justify-between mb-1">
             <h2 className="text-3xl font-bold drop-shadow-md font-sans leading-tight">{profile.name}</h2>
             <span className="bg-brand-yellow text-brand-dark px-3 py-1 rounded-full text-sm font-extrabold shadow-sm transform rotate-3">
               {profile.match_percentage}%
             </span>
          </div>
          <div className="flex items-center text-gray-100 text-sm font-semibold mb-2">
            <MapPin size={16} className="mr-1 text-brand-yellow" />
            {profile.location} ({profile.distance_km} km)
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-5 flex flex-col gap-3 h-[32%] bg-white relative cursor-pointer" onClick={onShowDetails}>
        
        {/* Bio */}
        <div className="text-gray-600 text-[15px] italic leading-snug line-clamp-3">
          "{profile.bio}"
        </div>

        {/* Chips - Vital Stats */}
        <div className="flex flex-wrap gap-2 mt-auto">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg flex items-center border border-blue-100">
            <Building2 size={12} className="mr-1.5" /> {profile.size.join(', ')}
          </span>
          <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-lg flex items-center border border-orange-100">
            <Clock size={12} className="mr-1.5" /> {profile.work_rhythm.join(', ')}
          </span>
          <span className="px-3 py-1 bg-teal-50 text-brand-teal text-xs font-bold rounded-lg flex items-center border border-teal-100">
            <Sun size={12} className="mr-1.5" /> {profile.region_vibe}
          </span>
        </div>
        
        <div 
            className="absolute top-0 right-0 p-4 z-10"
            onClick={(e) => {
                e.stopPropagation();
                onShowDetails();
            }}
        >
             <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-brand-teal hover:text-white transition-colors text-gray-400">
                <Info size={20} />
             </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
