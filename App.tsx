
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { HospitalProfile, Match, UserPreferences } from './types';
import { 
  dbGetHospitals, dbSaveHospitals, dbUpdateHospital, dbAddHospital, dbDeleteHospital,
  dbGetMatches, dbSaveMatch, dbUpdateMatch, dbGetSessionUser, dbSaveUser,
  dbGetAllUsers, dbIncrementStat
} from './services/dbService';

// Les 9 établissements ELSAN
const HOSPITALS_DATA: Omit<HospitalProfile, 'match_percentage' | 'distance_km'>[] = [
  {
    id: 'SRO',
    name: 'Clinique SMR Supervaltech',
    location: 'Saint-Estève (66)',
    region_vibe: 'Moderne et dynamique',
    size: ['Grande'],
    specialty_focus: ['SSR', 'Rééducation'],
    bio: '🏥 Établissement moderne au cœur des Pyrénées-Orientales. On allie innovation médicale et qualité de vie catalane !',
    leisure_activities: ['Plage à 20min', 'Randonnée', 'Culture catalane'],
    work_rhythm: ['Équilibré', 'Pluridisciplinaire'],
    perks: ['Plateau technique moderne', 'Formation continue', 'Parking gratuit'],
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop',
    video_url: 'https://www.youtube.com/watch?v=F_Sj8d94W2k',
  },
  {
    id: 'SPI',
    name: 'Clinique Saint-Pierre',
    location: 'Perpignan (66)',
    region_vibe: 'Centre-ville excellence',
    size: ['Moyenne'],
    specialty_focus: ['Chirurgie', 'Médecine', 'MCO'],
    bio: '⚕️ Au cœur de Perpignan depuis 1920. Tradition d\'excellence et modernité avec l\'accent du Sud !',
    leisure_activities: ['Centre-ville', 'Festivals', 'Mer à 15km'],
    work_rhythm: ['Soutenu', 'Polyvalent'],
    perks: ['Réputation établie', 'Centre-ville', 'Spécialités variées'],
    image_url: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=800&auto=format&fit=crop',
    video_url: 'https://www.youtube.com/watch?v=F_Sj8d94W2k',
  },
  {
    id: 'SMI',
    name: 'Clinique Saint-Michel',
    location: 'Prades (66)',
    region_vibe: 'Nature montagne',
    size: ['Familiale'],
    specialty_focus: ['SSR', 'Gériatrie'],
    bio: '🏔️ Au pied du Canigou. Pour ceux qui rêvent de soigner en respirant l\'air pur de la montagne !',
    leisure_activities: ['Randonnée', 'Ski', 'VTT'],
    work_rhythm: ['Tranquille', 'Humain'],
    perks: ['Cadre exceptionnel', 'Petite équipe', 'Qualité de vie'],
    image_url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800&auto=format&fit=crop',
    video_url: 'https://www.youtube.com/watch?v=F_Sj8d94W2k',
  },
  {
    id: 'NDE',
    name: 'Polyclinique Méditerranée',
    location: 'Perpignan (66)',
    region_vibe: 'Familial proximité',
    size: ['Moyenne'],
    specialty_focus: ['Chirurgie ambulatoire', 'Médecine'],
    bio: '🌊 L\'esprit méditerranéen ! Structure à taille humaine, on déjeune en terrasse quand il fait beau.',
    leisure_activities: ['Plages', 'Voile', 'Marchés'],
    work_rhythm: ['Équilibré', 'Convivial'],
    perks: ['Ambiance familiale', 'Flexibilité', 'Esprit d\'équipe'],
    image_url: 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?q=80&w=800&auto=format&fit=crop',
    video_url: 'https://www.youtube.com/watch?v=F_Sj8d94W2k',
  },
  {
    id: 'CER',
    name: 'Clinique du Vallespir',
    location: 'Céret (66)',
    region_vibe: 'Ville d\'art charme',
    size: ['Familiale'],
    specialty_focus: ['Médecine', 'SSR'],
    bio: '🎨 Dans la ville des cerises et de Picasso ! L\'art de vivre catalan rencontre l\'excellence médicale.',
    leisure_activities: ['Musées', 'Festivals', 'Patrimoine'],
    work_rhythm: ['Posé', 'Culturel'],
    perks: ['Cadre unique', 'Vie culturelle', 'Proximité Espagne'],
    image_url: 'https://images.unsplash.com/photo-1519167758481-83f29da8c313?q=80&w=800&auto=format&fit=crop',
    video_url: 'https://www.youtube.com/watch?v=F_Sj8d94W2k',
  },
  {
    id: 'FLO',
    name: 'Clinique SMR Le Floride',
    location: 'Le Barcarès (66)',
    region_vibe: 'Bord de mer',
    size: ['Moyenne'],
    specialty_focus: ['SSR', 'Rééducation'],
    bio: '🏖️ Les pieds dans l\'eau ! Nos patients se réveillent face à la mer. Rééducation en mode vacances !',
    leisure_activities: ['Plage privée', 'Sports nautiques', 'Kitesurf'],
    work_rhythm: ['Saisonnier', 'Détendu'],
    perks: ['Vue mer', 'Cadre unique', 'Activités nautiques'],
    image_url: 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?q=80&w=800&auto=format&fit=crop',
    video_url: 'https://www.youtube.com/watch?v=F_Sj8d94W2k',
  },
  {
    id: 'SPV',
    name: 'Polyclinique Médipôle Saint-Roch',
    location: 'Cabestany (66)',
    region_vibe: 'Référence régionale',
    size: ['Grande'],
    specialty_focus: ['Chirurgie', 'Urgences', 'Toutes spécialités'],
    bio: '🚀 Le mastodonte ! Plateau de pointe, activité soutenue. L\'adrénaline médicale sous le soleil !',
    leisure_activities: ['Sport', 'Vie urbaine', 'Mer proche'],
    work_rhythm: ['Intense', 'Dynamique'],
    perks: ['Équipements pointe', 'Formation permanente', 'Carrière évolutive'],
    image_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=800&auto=format&fit=crop',
    video_url: 'https://www.youtube.com/watch?v=F_Sj8d94W2k',
  },
  {
    id: 'HPGN',
    name: 'Hôpital Privé du Grand Narbonne',
    location: 'Narbonne (11)',
    region_vibe: 'Dynamique urgences',
    size: ['Grande'],
    specialty_focus: ['Urgences', 'Chirurgie', 'Maternité'],
    bio: '⚡ Le cœur battant de l\'Aude ! Urgences 24/7, activité dense. Du rythme et du rosé local après !',
    leisure_activities: ['Canal du Midi', 'Vignobles', 'Plages'],
    work_rhythm: ['Soutenu', 'Urgences'],
    perks: ['Plateau complet', 'Urgences', 'Région viticole'],
    image_url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800&auto=format&fit=crop',
    video_url: 'https://www.youtube.com/watch?v=F_Sj8d94W2k',
  },
  {
    id: 'SUD',
    name: 'Clinique SMR Sud',
    location: 'Carcassonne (11)',
    region_vibe: 'Historique détente',
    size: ['Moyenne'],
    specialty_focus: ['SSR', 'Rééducation'],
    bio: '🏰 À l\'ombre de la cité médiévale ! Équilibre entre professionnalisme et art de vivre du Sud-Ouest.',
    leisure_activities: ['Cité médiévale', 'UNESCO', 'Canal du Midi'],
    work_rhythm: ['Équilibré', 'Patrimoine'],
    perks: ['Cadre historique', 'Qualité de vie', 'Gastronomie'],
    image_url: 'https://images.unsplash.com/photo-1571772996211-2f02c9727629?q=80&w=800&auto=format&fit=crop',
    video_url: 'https://www.youtube.com/watch?v=F_Sj8d94W2k',
  },
]; 
  dbGetHospitals, dbSaveHospitals, dbUpdateHospital, dbAddHospital, dbDeleteHospital,
  dbGetMatches, dbSaveMatch, dbUpdateMatch, dbGetSessionUser, dbSaveUser,
  dbGetAllUsers, dbIncrementStat
} from './services/dbService';

// Correction de l'import ici
import Auth from './components/Auth';

import ProfileCard from './components/ProfileCard';
import ChatScreen from './components/ChatScreen';
import RecruiterDashboard from './components/RecruiterDashboard';
import { Heart, X, MessageCircle, User, Sparkles, Sun, MapPin, Building, ChevronLeft, Briefcase, Settings, LogOut, ChevronDown } from 'lucide-react';

const LOGO_URL = "https://monjobausoleil.fr/wp-content/uploads/2025/11/cropped-logo-monjobausoleil-4.png";

const MEDICAL_SPECIALTIES = [
  'Médecin Généraliste', 'Urgentiste', 'Cardiologue', 'Pédiatre', 'Anesthésiste', 'Gériatre', 
  'Chirurgien Orthopédiste', 'Chirurgien Viscéral', 'Gynécologue-Obstétricien', 'Ophtalmologue',
  'Autre'
];

const AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=DrHouse&clothing=blazerAndShirt&accessories=prescription02',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=NurseJoy&clothing=shirtVNeck&clotheColor=3c4f5c&top=longHairBun',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=SurgeonSam&clothing=overall&clotheColor=26dc88&top=shortFlat',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=CoolDoc&accessories=sunglasses&clothing=shirtScoopNeck&clotheColor=ff4d6d'
];

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'onboarding' | 'deck' | 'matches' | 'chat' | 'profile' | 'detail' | 'recruiter'>('deck');
  const [loading, setLoading] = useState(true);
  
  const [profiles, setProfiles] = useState<HospitalProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  
  const [showMatchOverlay, setShowMatchOverlay] = useState<HospitalProfile | null>(null);
  const [detailProfile, setDetailProfile] = useState<HospitalProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserPreferences[]>([]);

  useEffect(() => {
    if (!supabase) {
        setLoading(false);
        return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) initUserData();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) initUserData();
      else {
          setPreferences(null);
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initUserData = async () => {
    setLoading(true);
    const userPref = await dbGetSessionUser();
    if (userPref) {
      setPreferences(userPref);
      if (!userPref.name) setView('onboarding');
      await refreshData(userPref);
    } else {
      setView('onboarding');
    }
    setLoading(false);
  };

  const refreshData = async (prefs: UserPreferences) => {
    // Use fixed hospitals data instead of database
    const hospitalsWithScores = HOSPITALS_DATA.map((hospital) => {
      let matchScore = 50;

      if (prefs.preferred_size && hospital.size.includes(prefs.preferred_size)) {
        matchScore += 20;
      }

      if (prefs.preferred_region_vibe) {
        const vibe = prefs.preferred_region_vibe.toLowerCase();
        const hospitalVibe = hospital.region_vibe.toLowerCase();
        if (hospitalVibe.includes(vibe)) {
          matchScore += 15;
        }
      }

      if (prefs.specialty && hospital.specialty_focus.some(s => 
        s.toLowerCase().includes(prefs.specialty.toLowerCase())
      )) {
        matchScore += 15;
      }

      const distance_km = Math.floor(Math.random() * 50) + 5;

      return {
        ...hospital,
        match_percentage: Math.min(matchScore, 99),
        distance_km,
      } as HospitalProfile;
    });

    // Sort by match percentage
    hospitalsWithScores.sort((a, b) => b.match_percentage - a.match_percentage);
    
    setProfiles(hospitalsWithScores);
    const dbMatches = await dbGetMatches();
    setMatches(dbMatches);
    if (prefs.isAdmin) {
        const users = await dbGetAllUsers();
        setAllUsers(users);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= profiles.length) return;
    const current = profiles[currentIndex];
    
    if (direction === 'right') {
      const newMatch: Match = { id: Date.now().toString(), hospital: current, messages: [] };
      await dbSaveMatch(newMatch);
      setMatches(prev => [newMatch, ...prev]);
      setShowMatchOverlay(current);
      setTimeout(() => setShowMatchOverlay(null), 2000);
    }
    setCurrentIndex(prev => prev + 1);
  };

  const handleUpdateMatch = async (updatedMatch: Match) => {
    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    await dbUpdateMatch(updatedMatch);
  };

  if (!supabase) return <div className="p-10">Configuration Supabase manquante.</div>;
  if (loading) return <div className="min-h-screen bg-brand-yellow flex items-center justify-center font-bold">Chargement solaire...</div>;
  if (!session) return <Auth />;

  // --- VIEWS ---

  if (view === 'onboarding' && preferences) {
      return (
        <div className="min-h-[100dvh] bg-white flex flex-col p-6 overflow-y-auto font-sans">
            <h1 className="text-3xl font-extrabold text-brand-dark mb-2">Presque prêt... 🩺</h1>
            <p className="text-gray-500 mb-8">Trouvons ton match idéal au soleil.</p>
            <div className="space-y-6 flex-1">
                <input type="text" placeholder="Ton nom" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={preferences.name} onChange={e => setPreferences({...preferences, name: e.target.value})} />
                <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={preferences.specialty} onChange={e => setPreferences({...preferences, specialty: e.target.value})}>
                    {MEDICAL_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <textarea placeholder="Ta bio de médecin solaire..." rows={3} className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={preferences.bio} onChange={e => setPreferences({...preferences, bio: e.target.value})} />
            </div>
            <button onClick={async () => { await dbSaveUser(preferences); setView('deck'); }} className="w-full py-4 bg-brand-yellow text-brand-dark font-extrabold rounded-2xl mt-8 shadow-lg">C'est parti ! ☀️</button>
        </div>
      );
  }

  if (view === 'recruiter' && preferences?.isAdmin) {
      return (
          <RecruiterDashboard 
            profiles={profiles} matches={matches} users={allUsers}
            onUpdateProfile={async p => { await dbUpdateHospital(p); refreshData(preferences); }}
            onAddProfile={async p => { await dbAddHospital(p); refreshData(preferences); }}
            onDeleteProfile={async id => { await dbDeleteHospital(id); refreshData(preferences); }}
            onLogout={() => supabase.auth.signOut()}
            onSendMessage={async (mid, txt) => {
                const m = matches.find(x => x.id === mid);
                if (m) {
                    const updated: Match = { ...m, messages: [...m.messages, { id: Date.now().toString(), sender: 'hospital', text: txt, timestamp: new Date() }], lastMessage: txt };
                    await dbUpdateMatch(updated);
                    refreshData(preferences);
                }
            }}
            onToggleAdmin={async email => {
                const u = allUsers.find(x => x.email === email);
                if (u) {
                    const updated = { ...u, isAdmin: !u.isAdmin };
                    await dbSaveUser(updated);
                    refreshData(preferences);
                }
            }}
          />
      );
  }

  return (
    <div className="min-h-[100dvh] bg-brand-yellow flex items-center justify-center font-sans p-0 sm:p-4 overflow-hidden">
      <div className="w-full max-w-md h-[100dvh] sm:h-[850px] sm:rounded-[40px] bg-white shadow-2xl overflow-hidden relative flex flex-col border-4 border-white/50">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 bg-white z-20 border-b border-gray-50">
             <img src={LOGO_URL} alt="Logo" className="h-10 object-contain" onClick={() => setView('deck')} />
             <div className="flex gap-4 items-center">
                 {preferences?.isAdmin && <button onClick={() => setView('recruiter')} className="text-brand-teal"><Briefcase size={22}/></button>}
                 <button onClick={() => setView('profile')} className="text-gray-400">
                     <img src={preferences?.avatar || AVATARS[0]} className="w-8 h-8 rounded-full border border-gray-200" />
                 </button>
             </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-gray-50">
            {view === 'deck' && (
                <div className="w-full h-full p-4 relative">
                    {profiles.length > 0 && currentIndex < profiles.length ? (
                        <>
                            <ProfileCard profile={profiles[currentIndex]} onShowDetails={() => {setDetailProfile(profiles[currentIndex]); setView('detail');}} />
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-10">
                                <button onClick={() => handleSwipe('left')} className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-300"><X size={32}/></button>
                                <button onClick={() => handleSwipe('right')} className="w-16 h-16 bg-brand-teal rounded-full shadow-xl flex items-center justify-center text-white"><Heart size={32} fill="currentColor"/></button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <Sparkles size={48} className="text-brand-yellow" />
                            <h2 className="text-xl font-bold">C'est le désert ?</h2>
                            <p className="text-gray-500 text-sm">Tu as vu tous les profils correspondant à tes critères.</p>
                            <button onClick={() => setView('deck')} className="px-6 py-3 bg-brand-teal text-white rounded-full font-bold">Actualiser 🌴</button>
                        </div>
                    )}
                </div>
            )}

            {view === 'detail' && detailProfile && (
                <div className="h-full overflow-y-auto bg-white">
                    <div className="relative h-80">
                        <img src={detailProfile.image_url} className="w-full h-full object-cover" />
                        <button onClick={() => setView('deck')} className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white"><ChevronLeft/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <h2 className="text-3xl font-extrabold">{detailProfile.name}</h2>
                            <div className="bg-brand-yellow px-3 py-1 rounded-full font-bold">{detailProfile.match_percentage}% Match</div>
                        </div>
                        <p className="text-gray-600 italic">"{detailProfile.bio}"</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-500"><MapPin size={16}/> {detailProfile.location}</div>
                            <div className="flex items-center gap-2 text-gray-500"><Building size={16}/> {detailProfile.size.join(', ')}</div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'matches' && (
                <div className="h-full flex flex-col bg-white">
                    <h2 className="p-6 text-2xl font-extrabold border-b">Tes Matches 🔥</h2>
                    <div className="flex-1 overflow-y-auto">
                        {matches.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                                <Heart size={48} className="mb-4 opacity-20" />
                                <p>Pas encore de match...</p>
                            </div>
                        ) : (
                            matches.map(m => (
                                <div key={m.id} onClick={() => { setActiveMatchId(m.id); setView('chat'); }} className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer border-b">
                                    <img src={m.hospital.image_url} className="w-16 h-16 rounded-full object-cover border-2 border-brand-teal" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold truncate">{m.hospital.name}</h3>
                                        <p className="text-sm text-gray-500 truncate">{m.lastMessage || "Nouveau Match !"}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {view === 'chat' && activeMatchId && (
                <ChatScreen 
                    match={matches.find(m => m.id === activeMatchId)!} 
                    onBack={() => setView('matches')} 
                    onUpdateMatch={handleUpdateMatch} 
                />
            )}

            {view === 'profile' && preferences && (
                <div className="h-full bg-white flex flex-col p-8 overflow-y-auto">
                    <div className="flex flex-col items-center mb-8">
                        <img src={preferences.avatar || AVATARS[0]} className="w-24 h-24 rounded-full border-4 border-brand-yellow shadow-lg mb-4" />
                        <h2 className="text-2xl font-extrabold">{preferences.name}</h2>
                        <span className="text-brand-teal font-bold">{preferences.specialty}</span>
                    </div>
                    <div className="space-y-6">
                        <button onClick={() => setView('onboarding')} className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl font-bold">
                             <span className="flex items-center gap-3"><Settings size={20}/> Paramètres Profil</span>
                             <ChevronDown size={20} className="-rotate-90 text-gray-400" />
                        </button>
                        <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-3 p-4 text-red-500 font-bold">
                            <LogOut size={20}/> Déconnexion
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Bottom Nav */}
        {['deck', 'matches', 'profile'].includes(view) && (
            <div className="h-20 bg-white border-t flex justify-around items-center z-20">
                <button onClick={() => setView('deck')} className={view === 'deck' ? 'text-brand-teal' : 'text-gray-300'}><Sparkles size={24}/></button>
                <button onClick={() => setView('matches')} className={view === 'matches' ? 'text-brand-pink' : 'text-gray-300'}><MessageCircle size={24}/></button>
                <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-brand-yellow' : 'text-gray-300'}><User size={24}/></button>
            </div>
        )}

        {/* Match Overlay */}
        {showMatchOverlay && (
            <div className="absolute inset-0 z-50 bg-brand-yellow/95 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                <div className="font-display text-5xl text-white -rotate-6 mb-8 drop-shadow-lg font-sans">It's a Match!</div>
                <div className="flex gap-4 mb-8">
                    <img src={preferences?.avatar || AVATARS[0]} className="w-24 h-24 rounded-full border-4 border-white shadow-xl" />
                    <img src={showMatchOverlay.image_url} className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover" />
                </div>
                <button onClick={() => setShowMatchOverlay(null)} className="bg-brand-dark text-white px-10 py-4 rounded-full font-bold shadow-xl">Super ! ☀️</button>
            </div>
        )}
      </div>
    </div>
  );
}
