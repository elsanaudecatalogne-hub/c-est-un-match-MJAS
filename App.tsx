
import React, { useState, useEffect } from 'react';
import { HospitalProfile, Match, UserPreferences, ChatMessage } from './types';
import { fetchHospitalProfiles } from './services/geminiService';
import { 
  dbSaveUser, dbGetUser, dbGetHospitals, dbSaveHospitals, 
  dbUpdateHospital, dbGetMatches, dbSaveMatch, dbUpdateMatch, 
  dbGetSessionUser, dbClearSession, dbAddHospital, dbDeleteHospital, dbGetAllUsers, dbSaveAllUsers,
  dbDeleteUser, dbGetLegalText, dbIncrementStat
} from './services/dbService';
import ProfileCard from './components/ProfileCard';
import ChatScreen from './components/ChatScreen';
import RecruiterDashboard from './components/RecruiterDashboard';
import { Heart, X, MessageCircle, User, Zap, Sparkles, Stethoscope, Palmtree, Coffee, Sliders, RefreshCw, Building, Clock, Sun, MapPin, ChevronLeft, ChevronDown, Briefcase, Youtube, LogIn, UserPlus, Settings, LogOut, Edit2, Save, Check, Lock, Unlock, KeyRound, Mail, Trash2, FileText } from 'lucide-react';

const MEDICAL_SPECIALTIES = [
  'Médecin Généraliste', 'Urgentiste', 'Cardiologue', 'Pédiatre', 'Anesthésiste', 'Gériatre', 
  'Chirurgien Orthopédiste', 'Chirurgien Viscéral', 'Gynécologue-Obstétricien', 'Ophtalmologue',
  'ORL', 'Psychiatre', 'Radiologue', 'Neurologue', 'Dermatologue', 'Gastro-entérologue',
  'Pneumologue', 'Rhumatologue', 'Néphrologue', 'Endocrinologue', 'Oncologue',
  'Médecin du Sport', 'Médecin du Travail', 'Médecin Rééducateur (MPR)', 'Biologiste',
  'Kinésithérapeute', 'Infirmier(e) DE', 'Infirmier(e) Bloc (IBODE)', 'Infirmier(e) Anesthésiste (IADE)',
  'Sage-Femme', 'Aide-Soignant(e)', 'Cadre de Santé', 'Psychologue', 'Autre'
];

const PREFERENCES_DEFAULT: UserPreferences = {
  email: '',
  password: '',
  isAdmin: false,
  name: '',
  yearsExperience: 2,
  specialty: 'Médecin Généraliste',
  preferred_region_vibe: 'Bord de mer et plage',
  leisure: 'Surf, Voile, Rando',
  preferred_size: 'SMR',
  work_life_balance: 'Equilibre parfait',
  status: 'Disponible',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrHouse&clothing=blazerAndShirt&accessories=prescription02',
  bio: "Je cherche une structure à taille humaine où je peux soigner mes patients le matin et profiter du soleil l'après-midi. L'équilibre vie pro/vie perso est ma priorité."
};

const DEFAULT_BIO = "Je cherche une structure à taille humaine où je peux soigner mes patients le matin et profiter du soleil l'après-midi. L'équilibre vie pro/vie perso est ma priorité.";

// Custom "Medical & Fun" Avatars
const AVATARS = [
    // Dr. Blouse Blanche & Lunettes
    'https://api.dicebear.com/7.x/avataaars/svg?seed=DrHouse&clothing=blazerAndShirt&accessories=prescription02',
    // Infirmier(e) Tenue de bloc Bleue & Chignon
    'https://api.dicebear.com/7.x/avataaars/svg?seed=NurseJoy&clothing=shirtVNeck&clotheColor=3c4f5c&top=longHairBun',
    // Le Chirurgien Vert & Sérieux
    'https://api.dicebear.com/7.x/avataaars/svg?seed=SurgeonSam&clothing=overall&clotheColor=26dc88&top=shortFlat',
    // Dr. "Au Soleil" (Lunettes de soleil)
    'https://api.dicebear.com/7.x/avataaars/svg?seed=CoolDoc&accessories=sunglasses&clothing=shirtScoopNeck&clotheColor=ff4d6d',
    // Le Psy (Pull col roulé & Lunettes rondes)
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Freud&clothing=collarAndSweater&accessories=round',
    // Le Pédiatre (Chemise fun)
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedia&clothing=graphicShirt&top=longHairCurvy&accessories=prescription01',
    // L'Urgentiste (Hoodie bleu "Garde de 24h")
    'https://api.dicebear.com/7.x/avataaars/svg?seed=ERDoc&clothing=hoodie&clotheColor=65c9ff&top=shaggyMullet',
    // Cadre de Santé (Blazer chic)
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Boss&clothing=blazerAndSweater&accessories=wayfarers'
];

const LOGO_URL = "https://monjobausoleil.fr/wp-content/uploads/2025/11/cropped-logo-monjobausoleil-4.png";

export default function App() {
  // Navigation State
  const [view, setView] = useState<'auth' | 'onboarding' | 'deck' | 'matches' | 'chat' | 'profile' | 'settings' | 'detail' | 'recruiter'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('signup'); // Sub-state for auth screen
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Data State
  const [profiles, setProfiles] = useState<HospitalProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(PREFERENCES_DEFAULT);
  const [loading, setLoading] = useState(false);
  
  // UI State
  const [showMatchOverlay, setShowMatchOverlay] = useState<HospitalProfile | null>(null);
  const [detailProfile, setDetailProfile] = useState<HospitalProfile | null>(null);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalText, setLegalText] = useState('');

  // Track if we have already loaded "discovery" items to prevent loop on strict mode
  const [hasLoadedDiscovery, setHasLoadedDiscovery] = useState(false);

  // Initialize from DB on mount
  useEffect(() => {
    // 1. Check if user is logged in
    const sessionUser = dbGetSessionUser();
    if (sessionUser) {
        setPreferences(sessionUser);
        setView('deck');
        refreshData();
    }
    // Load legal text
    setLegalText(dbGetLegalText());
  }, []);

  // Sync function to reload data from DB
  const refreshData = () => {
    // Load Hospitals
    const dbProfiles = dbGetHospitals();
    if (dbProfiles.length > 0) {
        setProfiles(dbProfiles);
    } else {
        // If DB empty, we will load via API later when 'loadProfiles' is called
        setProfiles([]);
    }

    // Load Matches
    const dbMatches = dbGetMatches();
    setMatches(dbMatches);
  };

  // Called when entering Deck
  useEffect(() => {
    if (view === 'deck') {
        const dbProfiles = dbGetHospitals();
        if (dbProfiles.length === 0) {
             // Only fetch from API if DB is empty (first use)
             loadProfilesFromAPI('strict');
        } else {
             setProfiles(dbProfiles);
             // Ensure index is valid
             if (currentIndex >= dbProfiles.length) {
                 setCurrentIndex(0);
             }
        }
    }
  }, [view]);

  // Track Views Statistics when card appears
  useEffect(() => {
      if (view === 'deck' && profiles.length > 0 && currentIndex < profiles.length) {
          const currentId = profiles[currentIndex].id;
          dbIncrementStat('view', currentId);
      }
  }, [view, currentIndex, profiles]);

  const loadProfilesFromAPI = async (mode: 'strict' | 'discovery') => {
    setLoading(true);
    const newProfiles = await fetchHospitalProfiles(preferences, mode);
    
    // Filter out duplicates based on ID
    const currentIds = new Set(profiles.map(p => p.id));
    const uniqueNewProfiles = newProfiles.filter(p => !currentIds.has(p.id));

    const updatedProfiles = [...profiles, ...uniqueNewProfiles];
    
    dbSaveHospitals(updatedProfiles); // PERSISTENCE
    setProfiles(updatedProfiles);
    setLoading(false);
  };

  // Auth Handlers
  const handleAuthSubmit = () => {
    const emailInput = preferences.email.toLowerCase().trim();

    if (!emailInput.includes('@')) {
        alert("Veuillez entrer un email valide.");
        return;
    }

    // Handle Forgot Password Mode separately
    if (authMode === 'forgot-password') {
        const user = dbGetUser(emailInput);
        if (user) {
            alert(`Un email de réinitialisation de mot de passe a été envoyé à ${emailInput}.\n(Simulation: Vérifiez votre boîte mail).`);
            setAuthMode('login');
        } else {
            alert("Aucun compte n'est associé à cette adresse email.");
        }
        return;
    }

    if (!preferences.password || preferences.password.length < 4) {
        alert("Veuillez entrer un mot de passe (min 4 caractères).");
        return;
    }

    // AUTO-ADMIN RULE: cheriet@elsan.care is always admin
    const isSuperAdmin = emailInput === 'cheriet@elsan.care';

    if (authMode === 'signup') {
        // Check if user already exists
        const existingUser = dbGetUser(emailInput);
        if (existingUser) {
             alert("Cette adresse email est déjà utilisée. \nVeuillez vous connecter ou réinitialiser votre mot de passe.");
             setAuthMode('login');
             return;
        }
        
        // Prepare new user
        const newUser: UserPreferences = {
            ...preferences,
            email: emailInput, // ensure cleaned email
            isAdmin: isSuperAdmin // Grant admin if matching email
        };

        // New user -> Go to onboarding
        setView('onboarding');
        // Save minimal user info (including password)
        dbSaveUser(newUser);
        setPreferences(newUser);

        // TRACK REGISTRATION
        dbIncrementStat('registration');

    } else {
        // Login: Try to find user in DB
        let existingUser = dbGetUser(emailInput);
        if (existingUser) {
            // Check password
            if (existingUser.password !== preferences.password) {
                alert("Mot de passe incorrect.");
                return;
            }

            // AUTO-GRANT Admin rights on login if it's the super admin email
            if (isSuperAdmin && !existingUser.isAdmin) {
                existingUser = { ...existingUser, isAdmin: true };
            }

            setPreferences(existingUser);
            dbSaveUser(existingUser); // Updates session and potential admin flag
            
            // TRACK LOGIN
            dbIncrementStat('login');

            setTimeout(() => {
                setView('deck');
                refreshData();
            }, 500);
        } else {
            alert("Utilisateur inconnu. Veuillez créer un compte.");
        }
    }
  };

  const handleFinishOnboarding = () => {
      // Validate Mandatory Fields
      if (!preferences.name || preferences.name.trim() === '') {
          alert("Veuillez renseigner votre prénom.");
          return;
      }
      
      // Check if bio is filled and not default
      if (!preferences.bio || preferences.bio.trim() === '' || preferences.bio === DEFAULT_BIO) {
          alert("Veuillez rédiger une courte bio pour vous présenter aux recruteurs.");
          return;
      }

      if (!preferences.yearsExperience || preferences.yearsExperience <= 0) {
          alert("Veuillez indiquer vos années d'expérience.");
          return;
      }

      dbSaveUser(preferences); // Save full profile
      setView('deck');
  };

  const handleSaveProfileEdit = () => {
      dbSaveUser(preferences);
      setIsEditingProfile(false);
  };

  const handleRecruiterAccess = () => {
      if (!preferences.isAdmin) {
          alert("Accès refusé. Vous n'avez pas les droits d'administrateur/recruteur.");
          return;
      }
      refreshData();
      setView('recruiter');
  };

  const handleLogout = () => {
      dbClearSession();
      setPreferences(PREFERENCES_DEFAULT);
      setProfiles([]);
      setMatches([]);
      setView('auth');
  };

  const handleDeleteAccount = () => {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.")) {
          dbDeleteUser(preferences.email);
          handleLogout();
      }
  };

  // Swipe Logic
  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= profiles.length) return;
    const currentProfile = detailProfile || profiles[currentIndex];
    
    if (direction === 'right') {
      const newMatch: Match = {
        id: Date.now().toString(),
        hospital: currentProfile,
        messages: [],
      };
      // Save to DB
      dbSaveMatch(newMatch);
      // Update Local State
      setMatches(prev => [newMatch, ...prev]);
      
      setShowMatchOverlay(currentProfile);
      setTimeout(() => setShowMatchOverlay(null), 2500); 
    }

    if (detailProfile) {
        setDetailProfile(null);
        setView('deck');
        setCurrentIndex(prev => prev + 1);
    } else {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);

        // INFINITE SCROLL LOGIC
        // If we are near the end (2 items left), trigger fetch for more
        if (!loading && nextIndex >= profiles.length - 2) {
            console.log("Approaching end of list, loading discovery profiles...");
            setHasLoadedDiscovery(true);
            await loadProfilesFromAPI('discovery'); 
        }
    }
  };

  const handleUpdateMatch = (updatedMatch: Match) => {
    dbUpdateMatch(updatedMatch); // DB
    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
  };

  // --- RECRUITER ACTIONS ---
  
  const handleRecruiterUpdateProfile = (updatedProfile: HospitalProfile) => {
      dbUpdateHospital(updatedProfile);
      // Sync local state
      setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
  };

  const handleRecruiterAddProfile = (newProfile: HospitalProfile) => {
      dbAddHospital(newProfile);
      setProfiles(prev => [newProfile, ...prev]);
  };

  const handleRecruiterDeleteProfile = (id: string) => {
      dbDeleteHospital(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const handleRecruiterSendMessage = (matchId: string, text: string) => {
      const match = matches.find(m => m.id === matchId);
      if (match) {
          const newMsg: ChatMessage = {
              id: Date.now().toString(),
              sender: 'hospital',
              text: text,
              timestamp: new Date()
          };
          const updatedMatch = {
              ...match,
              messages: [...match.messages, newMsg],
              lastMessage: text
          };
          dbUpdateMatch(updatedMatch);
          // Sync local
          setMatches(prev => prev.map(m => m.id === matchId ? updatedMatch : m));
          // TRACK MESSAGE
          dbIncrementStat('message');
      }
  };

  // Admin: Toggle user permissions
  const handleToggleAdmin = (targetEmail: string) => {
      const allUsers = dbGetAllUsers();
      const updatedUsers = allUsers.map(u => {
          if (u.email === targetEmail) {
              return { ...u, isAdmin: !u.isAdmin };
          }
          return u;
      });
      dbSaveAllUsers(updatedUsers);
      
      // Update current user state if they modified themselves
      if (preferences.email === targetEmail) {
          setPreferences(prev => ({ ...prev, isAdmin: !prev.isAdmin }));
      }
  };

  const openDetails = (profile: HospitalProfile) => {
      setDetailProfile(profile);
      setView('detail');
  };

  const getYoutubeEmbedUrl = (url: string | undefined) => {
      if (!url) return null;
      try {
          // Handle standard youtube.com/watch?v=ID
          let videoId = '';
          const urlObj = new URL(url);
          if (urlObj.hostname.includes('youtube.com')) {
              videoId = urlObj.searchParams.get('v') || '';
          } else if (urlObj.hostname.includes('youtu.be')) {
              videoId = urlObj.pathname.slice(1);
          }
          
          if (videoId) {
              return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
          }
          return null;
      } catch (e) {
          return null;
      }
  };

  const currentProfile = profiles[currentIndex];
  // Deck is empty if no profile exists at current index AND we are not loading.
  // BUT with infinite scroll, loading might happen in background.
  const isDeckEmpty = !currentProfile && !loading; 

  // Views that show the Bottom Navigation Bar
  const showBottomNav = ['deck', 'matches', 'profile', 'settings'].includes(view);

  // --- RENDER VIEWS ---

  if (view === 'recruiter') {
      return (
          <RecruiterDashboard 
            profiles={profiles}
            matches={matches}
            users={dbGetAllUsers()} // Pass live user list
            onUpdateProfile={handleRecruiterUpdateProfile}
            onAddProfile={handleRecruiterAddProfile}
            onDeleteProfile={handleRecruiterDeleteProfile}
            onLogout={() => setView('profile')}
            onSendMessage={handleRecruiterSendMessage}
            onToggleAdmin={handleToggleAdmin}
          />
      );
  }

  if (view === 'auth') {
      return (
        <div className="min-h-[100dvh] bg-brand-yellow flex items-center justify-center p-4">
             <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center space-y-6 transition-all duration-500 relative overflow-hidden">
                {/* Logo with white background wrapper to fix display issues */}
                <div className="bg-white rounded-3xl p-4 shadow-sm mb-2 z-10 w-full flex justify-center">
                    <img src={LOGO_URL} alt="Mon Job Au Soleil" className="h-16 object-contain animate-in fade-in zoom-in duration-700" />
                </div>
                
                <p className="text-gray-500 font-bold -mt-4 z-10">Le Match Médical 🩺☀️</p>
                
                {authMode === 'forgot-password' ? (
                     /* FORGOT PASSWORD VIEW */
                     <div className="w-full space-y-4 animate-in slide-in-from-right duration-300">
                        <div className="text-left bg-blue-50 p-4 rounded-2xl mb-4">
                            <h3 className="font-bold text-gray-800 text-sm mb-1 flex items-center gap-2"><KeyRound size={16}/> Mot de passe oublié ?</h3>
                            <p className="text-xs text-gray-500">Entrez votre email pour recevoir un lien de réinitialisation.</p>
                        </div>
                         <div className="text-left">
                            <label className="text-xs font-extrabold text-gray-400 uppercase ml-2">Votre Email</label>
                            <input 
                                type="email" 
                                placeholder="docteur@exemple.com"
                                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-teal outline-none font-bold text-gray-700 transition-colors"
                                value={preferences.email}
                                onChange={(e) => setPreferences({...preferences, email: e.target.value})}
                            />
                        </div>
                        <button 
                            onClick={handleAuthSubmit}
                            className="w-full py-4 bg-brand-teal text-white font-extrabold rounded-2xl shadow-xl hover:bg-teal-600 transition-all"
                        >
                            Envoyer le lien <Mail className="inline ml-2" size={18}/>
                        </button>
                        <button 
                            onClick={() => setAuthMode('login')}
                            className="text-gray-400 font-bold text-sm hover:text-brand-dark transition-colors"
                        >
                            Retour à la connexion
                        </button>
                     </div>
                ) : (
                    /* LOGIN / SIGNUP VIEW */
                    <>
                        {/* Tabs Login/Signup */}
                        <div className="flex w-full bg-gray-100 rounded-xl p-1 mb-2">
                            <button 
                                onClick={() => setAuthMode('signup')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'signup' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-400'}`}
                            >
                                Créer un compte
                            </button>
                            <button 
                                onClick={() => setAuthMode('login')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'login' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-400'}`}
                            >
                                Connexion
                            </button>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="text-left">
                                <label className="text-xs font-extrabold text-gray-400 uppercase ml-2">Email Professionnel</label>
                                <input 
                                    type="email" 
                                    placeholder="docteur@exemple.com"
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-teal outline-none font-bold text-gray-700 transition-colors"
                                    value={preferences.email}
                                    onChange={(e) => setPreferences({...preferences, email: e.target.value})}
                                />
                            </div>
                            <div className="text-left">
                                <label className="text-xs font-extrabold text-gray-400 uppercase ml-2">Mot de passe</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••"
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-teal outline-none font-bold text-gray-700 transition-colors"
                                    value={preferences.password || ''}
                                    onChange={(e) => setPreferences({...preferences, password: e.target.value})}
                                />
                            </div>

                            <button 
                                onClick={handleAuthSubmit}
                                disabled={!preferences.email.includes('@')}
                                className="w-full py-4 bg-brand-teal text-white font-extrabold rounded-2xl shadow-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                {authMode === 'signup' ? <UserPlus size={20}/> : <LogIn size={20}/>}
                                {authMode === 'signup' ? "C'est parti !" : "Me reconnecter"}
                            </button>
                            
                            {authMode === 'login' && (
                                <button 
                                    onClick={() => setAuthMode('forgot-password')}
                                    className="text-xs text-gray-400 mt-4 cursor-pointer hover:underline hover:text-brand-teal transition-colors block w-full"
                                >
                                    Mot de passe oublié ?
                                </button>
                            )}

                            <div className="pt-2 border-t border-gray-100 w-full mt-2">
                                <button 
                                    onClick={() => setShowLegalModal(true)}
                                    className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors"
                                >
                                    Mentions Légales
                                </button>
                            </div>
                        </div>
                    </>
                )}
             </div>

             {/* Legal Modal */}
             {showLegalModal && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                     <div className="bg-white rounded-3xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
                         <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
                             <h3 className="font-bold text-gray-800 flex items-center gap-2"><FileText size={18}/> Mentions Légales</h3>
                             <button onClick={() => setShowLegalModal(false)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                                 <X size={20} />
                             </button>
                         </div>
                         <div className="p-6 overflow-y-auto whitespace-pre-wrap text-sm text-gray-600 leading-relaxed">
                             {legalText}
                         </div>
                     </div>
                 </div>
             )}
        </div>
      );
  }

  if (view === 'onboarding') {
    return (
        <div className="min-h-[100dvh] bg-white flex flex-col items-center p-6">
            <div className="w-full max-w-md flex flex-col h-full">
                <div className="flex items-center gap-2 mb-8 mt-4">
                    <button onClick={() => setView('auth')} className="p-2 bg-gray-100 rounded-full mr-2">
                        <ChevronLeft size={20} />
                    </button>
                    <img src={LOGO_URL} alt="Logo" className="h-10 object-contain" />
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto pb-6 hide-scrollbar">
                    
                    <div className="p-4 bg-brand-teal/10 rounded-2xl border border-brand-teal/20 text-brand-dark text-sm font-medium mb-4">
                        👋 Bienvenue Docteur ! Pour vous proposer les meilleurs matchs, nous avons besoin de compléter votre profil à 100%.
                    </div>

                    {/* Nom */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Votre Prénom <span className="text-red-500">*</span></label>
                        <input 
                            type="text"
                            placeholder="Dr. House"
                            value={preferences.name || ''}
                            onChange={(e) => setPreferences({...preferences, name: e.target.value})}
                            className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 focus:ring-brand-teal"
                        />
                    </div>

                     {/* Experience */}
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Années d'expérience <span className="text-red-500">*</span></label>
                        <input 
                            type="number"
                            placeholder="5"
                            value={preferences.yearsExperience || ''}
                            onChange={(e) => setPreferences({...preferences, yearsExperience: parseInt(e.target.value) || 0})}
                            className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 focus:ring-brand-teal"
                        />
                    </div>

                     {/* Specialty */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Votre Spécialité</label>
                        <div className="relative">
                            <select 
                                value={preferences.specialty}
                                onChange={(e) => setPreferences({...preferences, specialty: e.target.value})}
                                className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 appearance-none outline-none focus:ring-2 focus:ring-brand-teal pr-10"
                            >
                                {MEDICAL_SPECIALTIES.map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                    </div>

                    {/* Vibe */}
                    <div className="space-y-2">
                         <label className="text-sm font-bold text-gray-700">Votre Vibe idéale</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['Bord de mer et plage', 'Montagne et nature', 'Centre ville ensoleillé', 'Campagne paisible'].map((vibe) => (
                                <button
                                    key={vibe}
                                    onClick={() => setPreferences({...preferences, preferred_region_vibe: vibe})}
                                    className={`p-3 rounded-xl text-xs font-bold border transition-all ${preferences.preferred_region_vibe === vibe ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white text-gray-600 border-gray-200'}`}
                                >
                                    {vibe}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Votre Bio Express <span className="text-red-500">*</span></label>
                        <textarea 
                           value={preferences.bio}
                           onChange={(e) => setPreferences({...preferences, bio: e.target.value})}
                           rows={3}
                           className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-800 outline-none focus:ring-2 focus:ring-brand-teal text-sm"
                           placeholder="Dites-nous ce que vous cherchez vraiment..."
                        />
                    </div>
                </div>

                <button 
                    onClick={handleFinishOnboarding}
                    className="w-full py-4 bg-brand-yellow text-brand-dark font-extrabold rounded-2xl shadow-lg mt-4 mb-4 hover:scale-105 transition-transform"
                >
                    Voir les matchs 🚀
                </button>
            </div>
        </div>
    );
  }

  if (view === 'chat' && activeMatchId) {
    const match = matches.find(m => m.id === activeMatchId);
    if (match) {
      return (
        <div className="max-w-md mx-auto h-[100dvh] bg-white shadow-2xl overflow-hidden relative">
            <ChatScreen 
                match={match} 
                onBack={() => setView('matches')} 
                onUpdateMatch={handleUpdateMatch}
            />
        </div>
      );
    }
  }

  if (view === 'detail' && detailProfile) {
      const embedUrl = getYoutubeEmbedUrl(detailProfile.video_url);

      return (
        <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center font-sans p-0 sm:p-4">
            <div className="w-full max-w-md h-[100dvh] sm:h-[850px] sm:rounded-[40px] bg-white shadow-2xl relative flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
                    {/* Hero Image */}
                    <div className="relative h-80">
                        <img src={detailProfile.image_url} className="w-full h-full object-cover" alt={detailProfile.name} />
                        <button 
                            onClick={() => setView('deck')}
                            className="absolute top-4 right-4 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-gray-800 transition-all z-20"
                        >
                            <X size={24} strokeWidth={2.5} />
                        </button>
                        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white via-white/80 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="px-6 -mt-16 relative z-10">
                        <div className="flex justify-between items-end mb-4">
                            <h1 className="text-3xl font-bold text-gray-800 leading-tight w-3/4">{detailProfile.name}</h1>
                            <span className="bg-brand-yellow text-brand-dark px-3 py-1 rounded-full text-sm font-extrabold shadow-sm">
                                {detailProfile.match_percentage}%
                            </span>
                        </div>
                        <div className="flex items-center text-gray-500 font-semibold mb-6">
                            <MapPin size={18} className="mr-1 text-brand-yellow" />
                            {detailProfile.location} • {detailProfile.distance_km} km
                        </div>
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-2">Le Pitch</h3>
                                <p className="text-gray-600 text-lg italic leading-relaxed">"{detailProfile.bio}"</p>
                            </section>
                            {embedUrl && (
                                <section>
                                     <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Youtube size={16} className="text-red-500"/> Vidéo de présentation
                                     </h3>
                                     <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-md bg-black">
                                        <iframe width="100%" height="100%" src={embedUrl} title="Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                     </div>
                                </section>
                            )}
                            <section>
                                <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-3">En Bref</h3>
                                <div className="flex flex-wrap gap-2">
                                    {detailProfile.size.map((s,i) => (
                                        <span key={i} className="px-4 py-2 bg-gray-50 text-gray-700 font-bold rounded-xl text-sm border border-gray-100 flex items-center gap-2">
                                            <Building size={16} className="text-blue-500" /> {s}
                                        </span>
                                    ))}
                                    
                                    {detailProfile.work_rhythm.map((r, i) => (
                                        <span key={i} className="px-4 py-2 bg-gray-50 text-gray-700 font-bold rounded-xl text-sm border border-gray-100 flex items-center gap-2">
                                            <Clock size={16} className="text-orange-500" /> {r}
                                        </span>
                                    ))}

                                    <span className="px-4 py-2 bg-gray-50 text-gray-700 font-bold rounded-xl text-sm border border-gray-100 flex items-center gap-2">
                                        <Sun size={16} className="text-brand-yellow" /> {detailProfile.region_vibe}
                                    </span>
                                </div>
                            </section>
                            <section>
                                <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-3">Les + du poste</h3>
                                <ul className="grid grid-cols-1 gap-2">
                                    {detailProfile.perks?.map((perk, i) => (
                                        <li key={i} className="flex items-center gap-3 text-gray-700 font-medium bg-green-50/50 p-3 rounded-xl border border-green-50">
                                            <Sparkles size={16} className="text-brand-teal flex-shrink-0" /> {perk}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                            <section>
                                 <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-3">Loisirs à proximité</h3>
                                 <div className="flex flex-wrap gap-2">
                                    {detailProfile.leisure_activities?.map((l, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{l}</span>
                                    ))}
                                 </div>
                            </section>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-20 flex justify-center gap-8 border-t border-gray-50/50">
                     <button onClick={() => handleSwipe('left')} className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-300 hover:text-brand-pink hover:bg-red-50 transition-all border border-gray-100 transform hover:scale-105">
                          <X size={32} strokeWidth={3} />
                      </button>
                      <button onClick={() => handleSwipe('right')} className="w-16 h-16 bg-brand-teal rounded-full shadow-xl shadow-teal-200 flex items-center justify-center text-white hover:bg-teal-500 transition-all transform hover:scale-105">
                          <Heart size={32} fill="currentColor" />
                      </button>
                </div>
            </div>
        </div>
      );
  }

  // MAIN APP SHELL WITH NAVIGATION
  return (
    <div className="min-h-[100dvh] bg-brand-yellow flex items-center justify-center font-sans p-0 sm:p-4">
      <div className="w-full max-w-md h-[100dvh] sm:h-[850px] sm:rounded-[40px] bg-white shadow-2xl overflow-hidden relative flex flex-col border-4 border-white/50">
        
        {/* Top Bar - Only on Deck/Matches/Settings */}
        <div className="h-16 flex items-center justify-between px-5 bg-white z-20 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2">
             <img src={LOGO_URL} alt="Logo" className="h-10 object-contain" />
          </div>
          {view === 'settings' && (
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
                  <LogOut size={20} />
              </button>
          )}
          {view === 'profile' && !isEditingProfile && (
              <button onClick={() => setIsEditingProfile(true)} className="text-brand-teal hover:text-teal-600 bg-teal-50 p-2 rounded-full">
                  <Edit2 size={20} />
              </button>
          )}
          {view === 'profile' && isEditingProfile && (
              <button onClick={handleSaveProfileEdit} className="text-brand-teal hover:text-teal-600 bg-teal-50 p-2 rounded-full">
                  <Save size={20} />
              </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-50">
            
            {/* View: DECK */}
            {view === 'deck' && (
                <div className="w-full h-full flex flex-col p-3 pb-6 relative">
                   {loading && isDeckEmpty ? (
                     <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                            <div className="w-24 h-24 bg-brand-yellow rounded-full flex items-center justify-center animate-pulse">
                                <Sun size={48} className="text-white animate-spin-slow" />
                            </div>
                        </div>
                        <p className="text-gray-500 font-bold animate-pulse">Recherche des meilleurs spots... 🌴</p>
                     </div>
                   ) : isDeckEmpty ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                            <RefreshCw size={40} className="text-brand-teal" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Plus de profils dispos !</h2>
                        <p className="text-gray-500">Modifie tes critères pour trouver d'autres opportunités au soleil.</p>
                        <button 
                          onClick={() => setView('settings')}
                          className="px-8 py-3 bg-brand-teal text-white rounded-full font-bold shadow-lg hover:bg-teal-600 transition-colors transform hover:scale-105"
                        >
                            Changer mes critères
                        </button>
                        <button 
                          onClick={() => loadProfilesFromAPI('strict')}
                          className="text-brand-yellow font-bold text-sm underline decoration-2 decoration-brand-yellow underline-offset-4"
                        >
                            Recharger la liste
                        </button>
                     </div>
                   ) : (
                     <div className="flex-1 relative mb-20 mt-2 mx-1"> 
                        <div className="absolute inset-0 z-0 bg-white rounded-3xl shadow-md transform scale-90 translate-y-8 opacity-40" />
                        <div className="absolute inset-0 z-0 bg-white rounded-3xl shadow-md transform scale-95 translate-y-4 opacity-70" />
                        <div className="absolute inset-0 z-10">
                            {currentProfile && (
                                <ProfileCard profile={currentProfile} onShowDetails={() => openDetails(currentProfile)} />
                            )}
                        </div>
                     </div>
                   )}
                   {currentProfile && (
                       <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6 z-20">
                          <button onClick={() => handleSwipe('left')} className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-300 hover:text-brand-pink hover:bg-red-50 hover:scale-110 transition-all border border-gray-100">
                              <X size={28} strokeWidth={3} />
                          </button>
                          <button onClick={() => openDetails(currentProfile)} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-brand-yellow hover:scale-110 transition-all border border-gray-100">
                              <Zap size={18} fill="currentColor" />
                          </button>
                          <button onClick={() => handleSwipe('right')} className="w-14 h-14 bg-brand-teal rounded-full shadow-xl shadow-teal-200 flex items-center justify-center text-white hover:bg-teal-500 hover:scale-110 transition-all">
                              <Heart size={28} fill="currentColor" />
                          </button>
                       </div>
                   )}
                </div>
            )}

            {/* View: MATCHES */}
            {view === 'matches' && (
                <div className="w-full h-full flex flex-col bg-white">
                    <div className="p-5 bg-gradient-to-b from-white to-gray-50">
                        <h2 className="text-lg font-bold text-brand-pink mb-4 flex items-center gap-2">
                             Vos Matchs <Heart size={16} fill="currentColor" />
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                           {matches.length === 0 && <p className="text-gray-400 text-sm italic w-full text-center py-4">Swipe à droite pour matcher !</p>}
                           {matches.map(match => (
                               <div key={match.id} className="flex flex-col items-center space-y-2 min-w-[70px] cursor-pointer group" onClick={() => { setActiveMatchId(match.id); setView('chat'); }}>
                                   <div className="w-16 h-16 rounded-full border-2 border-brand-pink p-0.5 group-hover:scale-105 transition-transform">
                                       <img src={match.hospital.image_url} className="w-full h-full rounded-full object-cover" />
                                   </div>
                                   <span className="text-xs font-bold text-gray-700 truncate w-full text-center">{match.hospital.name.split(' ')[0]}</span>
                               </div>
                           ))}
                        </div>
                    </div>
                    <div className="flex-1 border-t border-gray-100 p-0 overflow-y-auto">
                        <div className="p-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-50">
                             <h2 className="text-lg font-bold text-gray-800">Candidatures</h2>
                        </div>
                        <div className="divide-y divide-gray-50 pb-20">
                            {matches.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-40 text-gray-300 gap-2 mt-8">
                                    <MessageCircle size={48} strokeWidth={1.5} />
                                    <p className="font-medium">Aucune discussion en cours</p>
                                </div>
                            )}
                            {matches.map(match => (
                                <div 
                                    key={match.id} 
                                    onClick={() => { setActiveMatchId(match.id); setView('chat'); }}
                                    className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
                                >
                                    <div className="relative">
                                        <img src={match.hospital.image_url} className="w-14 h-14 rounded-full object-cover shadow-sm" />
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-gray-800 truncate">{match.hospital.name}</h3>
                                            <span className="text-xs text-gray-400 font-medium">{new Date(match.messages[match.messages.length - 1]?.timestamp || new Date()).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate font-medium">
                                            {match.lastMessage ? (
                                                <span className={match.messages[match.messages.length-1].sender === 'hospital' ? 'text-gray-800' : 'text-gray-400'}>
                                                    {match.messages[match.messages.length-1].sender === 'user' && 'Vous: '} 
                                                    {match.lastMessage}
                                                </span>
                                            ) : (
                                                <span className="text-brand-teal italic">Candidature initiée...</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* View: SETTINGS (Now FILTERS) */}
            {view === 'settings' && (
                <div className="p-6 space-y-6 overflow-y-auto h-full pb-24 bg-white">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-gray-800">Mes Filtres</h2>
                    </div>
                    
                    {/* Specialty */}
                    <div className="space-y-3">
                        <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Stethoscope size={14} /> Ma Spécialité
                        </label>
                         <div className="relative">
                            <select 
                                value={preferences.specialty}
                                onChange={(e) => setPreferences({...preferences, specialty: e.target.value})}
                                className="w-full p-4 bg-gray-50 border-0 rounded-2xl text-gray-800 font-bold focus:ring-2 focus:ring-brand-teal outline-none appearance-none pr-10"
                            >
                                {MEDICAL_SPECIALTIES.map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                    </div>

                    {/* Facility Size */}
                    <div className="space-y-3">
                        <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Building size={14} /> Taille d'établissement
                        </label>
                        <div className="flex flex-col gap-2">
                            {['Petite clinique de proximité', 'SMR', 'Grand Hôpital privé'].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setPreferences({...preferences, preferred_size: size})}
                                    className={`p-3 rounded-xl text-sm font-bold border transition-all text-left ${preferences.preferred_size === size ? 'bg-brand-teal text-white border-brand-teal shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-teal'}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Vibe */}
                    <div className="space-y-3">
                        <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Palmtree size={14} /> Ambiance & Cadre
                        </label>
                        <select 
                            value={preferences.preferred_region_vibe}
                            onChange={(e) => setPreferences({...preferences, preferred_region_vibe: e.target.value})}
                            className="w-full p-4 bg-gray-50 border-0 rounded-2xl text-gray-800 font-bold focus:ring-2 focus:ring-brand-teal outline-none"
                        >
                            <option>Bord de mer et plage</option>
                            <option>Centre ville ensoleillé</option>
                            <option>Montagne et nature</option>
                            <option>Campagne paisible</option>
                        </select>
                    </div>

                    {/* Work Life Balance */}
                    <div className="space-y-3">
                        <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={14} /> Rythme
                        </label>
                        <select 
                            value={preferences.work_life_balance}
                            onChange={(e) => setPreferences({...preferences, work_life_balance: e.target.value})}
                            className="w-full p-4 bg-gray-50 border-0 rounded-2xl text-gray-800 font-bold focus:ring-2 focus:ring-brand-teal outline-none"
                        >
                            <option>Mi-temps possible</option>
                            <option>Intense et payant</option>
                            <option>Equilibre parfait</option>
                        </select>
                    </div>

                    {/* Leisure */}
                    <div className="space-y-3">
                        <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Coffee size={14} /> Mes Loisirs / Passions
                        </label>
                        <input 
                            type="text"
                            value={preferences.leisure}
                            onChange={(e) => setPreferences({...preferences, leisure: e.target.value})}
                            className="w-full p-4 bg-gray-50 border-0 rounded-2xl text-gray-800 font-bold focus:ring-2 focus:ring-brand-teal outline-none placeholder-gray-300"
                            placeholder="Ex: Surf, Lecture, Vélo, Rando..."
                        />
                    </div>
                </div>
            )}

             {/* View: PROFILE */}
             {view === 'profile' && (
                <div className="flex flex-col h-full bg-white relative overflow-y-auto pb-24">
                     <div className="h-40 bg-brand-yellow w-full rounded-b-[40px] absolute top-0 left-0 z-0"></div>
                     <div className="flex flex-col items-center justify-center pt-24 px-6 relative z-10 text-center space-y-4 w-full">
                         <div className="w-32 h-32 rounded-full bg-white p-1 shadow-xl relative">
                            <img src={preferences.avatar || AVATARS[0]} className="w-full h-full rounded-full object-cover border-4 border-white" />
                            {isEditingProfile && (
                                <div className="absolute bottom-0 right-0 bg-brand-teal p-2 rounded-full text-white cursor-pointer shadow-md animate-bounce">
                                    <Edit2 size={16} />
                                </div>
                            )}
                         </div>
                         
                         {isEditingProfile ? (
                             <div className="w-full space-y-5 mt-2 animate-in fade-in slide-in-from-bottom-4 pb-10">
                                 
                                 {/* Avatar Picker */}
                                 <div className="text-left space-y-2">
                                     <label className="text-xs font-bold text-gray-400 uppercase ml-2">Choisir un avatar</label>
                                     <div className="grid grid-cols-4 gap-2">
                                         {AVATARS.map((avatar, idx) => (
                                             <button 
                                                key={idx}
                                                onClick={() => setPreferences({...preferences, avatar: avatar})}
                                                className={`rounded-full overflow-hidden border-2 transition-all w-14 h-14 mx-auto bg-gray-100 ${preferences.avatar === avatar ? 'border-brand-teal ring-2 ring-teal-100 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                             >
                                                 <img src={avatar} className="w-full h-full object-cover" />
                                             </button>
                                         ))}
                                     </div>
                                 </div>

                                 {/* Identity */}
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="text-left space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase ml-2">Nom</label>
                                        <input 
                                            type="text"
                                            value={preferences.name}
                                            onChange={(e) => setPreferences({...preferences, name: e.target.value})}
                                            className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-brand-teal text-sm"
                                        />
                                     </div>
                                     <div className="text-left space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase ml-2">Expérience (ans)</label>
                                        <input 
                                            type="number"
                                            value={preferences.yearsExperience}
                                            onChange={(e) => setPreferences({...preferences, yearsExperience: parseInt(e.target.value) || 0})}
                                            className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-brand-teal text-sm"
                                        />
                                     </div>
                                 </div>

                                 <div className="text-left space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">Email</label>
                                    <input 
                                        type="email"
                                        value={preferences.email}
                                        disabled={true}
                                        className="w-full p-3 bg-gray-100 rounded-xl font-bold text-gray-500 outline-none text-sm cursor-not-allowed"
                                    />
                                 </div>

                                 {/* Specialty Select */}
                                 <div className="text-left space-y-1">
                                     <label className="text-xs font-bold text-gray-400 uppercase ml-2">Spécialité</label>
                                     <div className="relative">
                                        <select 
                                            value={preferences.specialty}
                                            onChange={(e) => setPreferences({...preferences, specialty: e.target.value})}
                                            className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-brand-teal text-sm appearance-none pr-8"
                                        >
                                            {MEDICAL_SPECIALTIES.map(spec => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                     </div>
                                 </div>

                                 {/* Status Picker */}
                                 <div className="text-left space-y-2">
                                     <label className="text-xs font-bold text-gray-400 uppercase ml-2">Statut Actuel</label>
                                     <div className="flex gap-2">
                                         {['Curieux', 'Disponible', 'En veille'].map(status => (
                                             <button
                                                key={status}
                                                onClick={() => setPreferences({...preferences, status: status as any})}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${preferences.status === status ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white text-gray-500 border-gray-200'}`}
                                             >
                                                 {status}
                                             </button>
                                         ))}
                                     </div>
                                 </div>

                                 {/* Custom Bio */}
                                 <div className="text-left space-y-1">
                                     <label className="text-xs font-bold text-gray-400 uppercase ml-2">Ma Bio (Ce que je cherche)</label>
                                     <textarea 
                                        value={preferences.bio}
                                        onChange={(e) => setPreferences({...preferences, bio: e.target.value})}
                                        rows={4}
                                        className="w-full p-3 bg-gray-50 rounded-xl font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-teal text-sm resize-none"
                                        placeholder="Décrivez votre projet idéal..."
                                     />
                                 </div>

                                 <button 
                                    onClick={handleSaveProfileEdit}
                                    className="w-full py-3 bg-brand-teal text-white font-bold rounded-xl mt-4 shadow-lg active:scale-95 transition-transform"
                                 >
                                    <Check className="inline mr-2" size={18} /> Enregistrer mon profil
                                 </button>
                             </div>
                         ) : (
                            <>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{preferences.name || 'Dr. Vous'}</h2>
                                    <p className="text-gray-500 font-bold">{preferences.specialty}</p>
                                    <p className="text-xs text-brand-teal font-bold">{preferences.email}</p>
                                    {preferences.isAdmin && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-brand-dark text-white text-[10px] rounded-full font-bold uppercase tracking-wider">Admin</span>
                                    )}
                                </div>
                                
                                <div className="w-full grid grid-cols-3 gap-4 mt-6">
                                    <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center">
                                        <span className="font-bold text-xl text-brand-dark">{preferences.yearsExperience || 0}</span>
                                        <span className="text-[10px] uppercase text-gray-400 font-bold">Années Exp.</span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center">
                                        <span className="font-bold text-xl text-brand-pink">85%</span>
                                        <span className="text-[10px] uppercase text-gray-400 font-bold">Réactivité</span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center">
                                        <span className={`font-bold text-xl ${preferences.status === 'Disponible' ? 'text-green-500' : preferences.status === 'En veille' ? 'text-orange-500' : 'text-blue-500'}`}>
                                            {preferences.status === 'Disponible' ? 'Open' : preferences.status === 'En veille' ? 'Veille' : 'Curieux'}
                                        </span>
                                        <span className="text-[10px] uppercase text-gray-400 font-bold truncate w-full text-center">{preferences.status || 'Statut'}</span>
                                    </div>
                                </div>

                                <div className="p-6 bg-brand-yellow/10 border border-brand-yellow/20 text-brand-dark rounded-3xl text-sm font-medium leading-relaxed italic mt-4 w-full text-left relative">
                                    <span className="absolute -top-3 left-6 bg-white px-2 text-2xl text-brand-yellow">"</span>
                                    {preferences.bio || "Je cherche une structure à taille humaine où je peux soigner mes patients le matin et profiter du soleil l'après-midi."}
                                    <span className="absolute -bottom-4 right-6 bg-white px-2 text-2xl text-brand-yellow transform rotate-180">"</span>
                                </div>

                                <div className="w-full pt-6 mt-4">
                                    <button 
                                        onClick={handleRecruiterAccess}
                                        className={`w-full py-4 font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${preferences.isAdmin ? 'bg-brand-dark text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        {preferences.isAdmin ? <Unlock size={16} /> : <Lock size={16} />} 
                                        Espace Recruteur
                                    </button>
                                    {!preferences.isAdmin && <p className="text-center text-[10px] text-gray-400 mt-2">Accès réservé aux administrateurs</p>}
                                </div>

                                <div className="mt-8 mb-2 w-full text-center">
                                    <button 
                                        onClick={handleDeleteAccount}
                                        className="text-xs text-gray-300 hover:text-red-500 transition-colors flex items-center justify-center gap-1 mx-auto"
                                    >
                                        <Trash2 size={12} /> Supprimer mon compte
                                    </button>
                                </div>
                            </>
                         )}
                     </div>
                </div>
            )}
        </div>

        {/* PERSISTENT BOTTOM NAVIGATION BAR */}
        {showBottomNav && (
            <div className="h-20 bg-white border-t border-gray-100 flex justify-around items-center px-2 z-30 pb-2 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] flex-shrink-0">
                <button 
                    onClick={() => setView('deck')}
                    className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-300 ${view === 'deck' ? 'text-brand-teal' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    <Sparkles size={24} strokeWidth={view === 'deck' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold mt-1">Swipe</span>
                </button>
                <button 
                    onClick={() => setView('matches')}
                    className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-300 relative ${view === 'matches' ? 'text-brand-pink' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    <div className="relative">
                        <MessageCircle size={24} strokeWidth={view === 'matches' ? 2.5 : 2} />
                        {matches.length > 0 && view !== 'matches' && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-pink rounded-full ring-2 ring-white"></span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold mt-1">Matchs</span>
                </button>
                <button 
                    onClick={() => setView('profile')}
                    className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-300 ${view === 'profile' ? 'text-brand-yellow' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    <User size={24} strokeWidth={view === 'profile' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold mt-1">Profil</span>
                </button>
                <button 
                    onClick={() => setView('settings')}
                    className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-300 ${view === 'settings' ? 'text-brand-dark' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    <Sliders size={24} strokeWidth={view === 'settings' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold mt-1">Filtres</span>
                </button>
            </div>
        )}

        {/* Match Overlay */}
        {showMatchOverlay && (
            <div className="absolute inset-0 z-50 bg-brand-yellow/95 flex flex-col items-center justify-center text-brand-dark backdrop-blur-sm animate-in fade-in duration-300">
                <div className="font-display text-6xl text-white transform -rotate-6 mb-8 drop-shadow-[0_4px_0_rgba(0,0,0,0.1)]">
                    It's a Match!
                </div>
                <div className="text-center space-y-1 mb-8 px-8">
                    <p className="text-2xl font-bold">{showMatchOverlay.name}</p>
                    <p className="text-brand-dark/70 font-medium">veut votre CV !</p>
                </div>
                
                <div className="flex items-center gap-4 mb-12 scale-110">
                     <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-2xl relative z-10 bg-white">
                        <img src={preferences.avatar || AVATARS[0]} className="w-full h-full object-cover" />
                     </div>
                     <div className="z-20 bg-white p-2 rounded-full shadow-xl">
                        <Heart className="text-brand-pink fill-brand-pink animate-pulse" size={32} />
                     </div>
                     <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-2xl relative z-10">
                        <img src={showMatchOverlay.image_url} className="w-full h-full object-cover" />
                     </div>
                </div>

                <div className="flex flex-col gap-3 w-3/4">
                    <button 
                        onClick={() => {
                            setActiveMatchId(matches[0].id); // Most recent is first
                            setView('chat');
                            setShowMatchOverlay(null);
                        }}
                        className="w-full py-4 bg-white text-brand-dark rounded-full font-bold shadow-xl hover:scale-105 transition-transform"
                    >
                        Envoyer mon CV 📄
                    </button>
                    <button 
                        onClick={() => setShowMatchOverlay(null)}
                        className="w-full py-4 bg-transparent border-2 border-white/50 text-white rounded-full font-bold hover:bg-white/10 transition-colors"
                    >
                        Continuer à swiper
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
