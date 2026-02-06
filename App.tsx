
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { HospitalProfile, Match, UserPreferences } from './types';
import { fetchHospitalProfiles } from './services/geminiService';
import { 
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
    const dbProfiles = await dbGetHospitals();
    setProfiles(dbProfiles);
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
