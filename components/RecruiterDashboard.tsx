
import React, { useState, useEffect } from 'react';
import { HospitalProfile, Match, UserPreferences } from '../types';
import { dbGetLegalText, dbSaveLegalText, dbGetStats } from '../services/dbService';
import { Building, MessageSquare, Save, User, MapPin, Clock, Sun, Search, Send, Briefcase, Image as ImageIcon, Video, CheckSquare, Square, Trash2, Plus, Users, Shield, Scale, FileText, BarChart3, TrendingUp, UserPlus, Eye } from 'lucide-react';

interface RecruiterDashboardProps {
  profiles: HospitalProfile[];
  matches: Match[];
  users: UserPreferences[];
  onUpdateProfile: (profile: HospitalProfile) => void;
  onAddProfile: (profile: HospitalProfile) => void;
  onDeleteProfile: (id: string) => void;
  onLogout: () => void;
  onSendMessage: (matchId: string, text: string) => void;
  onToggleAdmin: (email: string) => void;
}

// Complete list of medical specialties
const ALL_SPECIALTIES = [
  'Médecin Généraliste', 'Urgentiste', 'Cardiologue', 'Pédiatre', 'Anesthésiste', 'Gériatre', 
  'Chirurgien Orthopédiste', 'Chirurgien Viscéral', 'Gynécologue-Obstétricien', 'Ophtalmologue',
  'ORL', 'Psychiatre', 'Radiologue', 'Neurologue', 'Dermatologue', 'Gastro-entérologue',
  'Pneumologue', 'Rhumatologue', 'Néphrologue', 'Endocrinologue', 'Oncologue',
  'Médecin du Sport', 'Médecin du Travail', 'Médecin Rééducateur (MPR)', 'Biologiste',
  'Kinésithérapeute', 'Infirmier(e) DE', 'Infirmier(e) Bloc (IBODE)', 'Infirmier(e) Anesthésiste (IADE)',
  'Sage-Femme', 'Aide-Soignant(e)', 'Cadre de Santé', 'Psychologue', 'Autre'
];

const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ 
  profiles, 
  matches, 
  users,
  onUpdateProfile, 
  onAddProfile, 
  onDeleteProfile,
  onLogout,
  onSendMessage,
  onToggleAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'clinics' | 'inbox' | 'team' | 'legal' | 'stats'>('clinics');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  
  // Legal Text State
  const [legalText, setLegalText] = useState('');

  // Stats State
  const [stats, setStats] = useState(dbGetStats());

  // Editing State
  const [editForm, setEditForm] = useState<HospitalProfile | null>(null);

  useEffect(() => {
      // Load legal text and stats on mount
      setLegalText(dbGetLegalText());
      setStats(dbGetStats());
      
      // Refresh stats every time we enter the dashboard to be sure
      const interval = setInterval(() => {
          setStats(dbGetStats());
      }, 5000); // Polling for live updates
      return () => clearInterval(interval);
  }, []);

  const handleEditClick = (profile: HospitalProfile) => {
    setSelectedProfileId(profile.id);
    setEditForm({ ...profile });
  };

  const handleCreateNew = () => {
    const newId = Date.now().toString();
    const newProfile: HospitalProfile = {
      id: newId,
      name: "Nouvel Établissement",
      location: "Ville, Dépt",
      region_vibe: "Centre ville ensoleillé",
      size: ["SMR"],
      specialty_focus: [],
      bio: "Rédigez une bio accrocheuse...",
      leisure_activities: [],
      work_rhythm: ["Equilibre parfait"],
      distance_km: 0,
      match_percentage: 100,
      perks: [],
      image_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop",
      video_url: ""
    };
    onAddProfile(newProfile);
    // Auto select the new profile
    setSelectedProfileId(newId);
    setEditForm(newProfile);
  };

  const handleDelete = () => {
    if (editForm && window.confirm("Êtes-vous sûr de vouloir supprimer cet établissement ?")) {
      onDeleteProfile(editForm.id);
      setEditForm(null);
      setSelectedProfileId(null);
    }
  };

  const handleSave = () => {
    if (editForm) {
      onUpdateProfile(editForm);
      alert("Fiche établissement mise à jour et sauvegardée en base !");
    }
  };
  
  const handleSaveLegal = () => {
      dbSaveLegalText(legalText);
      alert("Mentions légales mises à jour !");
  };

  const handleSendReply = () => {
    if (selectedMatchId && replyText.trim()) {
      onSendMessage(selectedMatchId, replyText);
      setReplyText('');
    }
  };

  const toggleArrayItem = (field: 'specialty_focus' | 'perks' | 'size' | 'work_rhythm', value: string) => {
    if (!editForm) return;
    const currentArray = editForm[field] || [];
    const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
    setEditForm({ ...editForm, [field]: newArray });
  };

  const addCustomTag = () => {
    if (editForm && newTagInput.trim()) {
      setEditForm({
        ...editForm,
        perks: [...(editForm.perks || []), newTagInput.trim()]
      });
      setNewTagInput('');
    }
  };

  // Predefined lists for multiselect
  const ALL_SIZES = ['Petite clinique de proximité', 'SMR', 'Grand Hôpital privé'];
  const ALL_RHYTHMS = ['Mi-temps possible', 'Intense et payant', 'Equilibre parfait'];
  const ALL_PERKS = ['Logement offert', 'Vue mer', 'Salaire attractif', 'Crèche', 'Parking', 'Tickets resto', 'Prime installation', 'Formation continue'];

  const activeMatch = matches.find(m => m.id === selectedMatchId);

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-brand-dark text-white flex flex-col shadow-xl z-20 hidden md:flex">
        <div className="p-6 border-b border-gray-700 flex items-center gap-3">
           <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center text-brand-dark">
             <Briefcase size={20} />
           </div>
           <div>
             <h1 className="font-bold text-lg leading-tight">Espace Recruteur</h1>
             <p className="text-xs text-gray-400">ELSAN / Mon Job Au Soleil</p>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'stats' ? 'bg-brand-teal text-white font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <BarChart3 size={20} /> Statistiques
          </button>
          <button 
            onClick={() => setActiveTab('clinics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'clinics' ? 'bg-brand-teal text-white font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Building size={20} /> Mes Cliniques
          </button>
          <button 
            onClick={() => setActiveTab('inbox')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${activeTab === 'inbox' ? 'bg-brand-teal text-white font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <MessageSquare size={20} /> Messagerie
            {matches.length > 0 && (
                <span className="absolute right-4 bg-brand-pink text-white text-xs font-bold px-2 py-0.5 rounded-full">{matches.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${activeTab === 'team' ? 'bg-brand-teal text-white font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Users size={20} /> Équipe & Accès
          </button>
          <button 
            onClick={() => setActiveTab('legal')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${activeTab === 'legal' ? 'bg-brand-teal text-white font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Scale size={20} /> Mentions Légales
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button onClick={onLogout} className="text-gray-400 hover:text-white text-sm font-medium w-full text-left px-4">
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
            <h2 className="text-xl font-bold text-gray-800">
                {activeTab === 'stats' && 'Tableau de Bord Statistiques'}
                {activeTab === 'clinics' && 'Gestion des Établissements'}
                {activeTab === 'inbox' && 'Candidatures & Messages'}
                {activeTab === 'team' && 'Gestion de l\'Équipe'}
                {activeTab === 'legal' && 'Édition Mentions Légales'}
            </h2>
            <div className="flex items-center gap-4">
                 <button onClick={onLogout} className="md:hidden text-gray-500 text-sm font-bold">Déconnexion</button>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-gray-800">Compte Admin</p>
                    <p className="text-xs text-gray-500">Responsable RH</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center text-white font-bold">
                    RH
                </div>
            </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden p-6 relative">
            
            {/* VIEW: STATS */}
            {activeTab === 'stats' && (
                <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-3xl font-extrabold text-gray-800">{stats.totalLogins}</span>
                            <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Connexions</span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                <UserPlus size={24} />
                            </div>
                            <span className="text-3xl font-extrabold text-gray-800">{stats.totalRegistrations}</span>
                            <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Inscriptions</span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                             <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mb-3">
                                <MessageSquare size={24} />
                            </div>
                            <span className="text-3xl font-extrabold text-gray-800">{stats.totalMessages}</span>
                            <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Messages Chat</span>
                        </div>
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                             <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
                                <Eye size={24} />
                            </div>
                            <span className="text-3xl font-extrabold text-gray-800">
                                {Object.values(stats.hospitalViews).reduce((a: number, b: number) => a + b, 0)}
                            </span>
                            <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Vues Totales</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                             <BarChart3 size={20} className="text-brand-teal"/> Popularité des Établissements (Vues)
                        </h3>
                        <div className="space-y-4">
                            {profiles.length === 0 ? (
                                <p className="text-gray-400 italic">Aucune donnée de clinique disponible.</p>
                            ) : (
                                profiles
                                .sort((a, b) => (stats.hospitalViews[b.id] || 0) - (stats.hospitalViews[a.id] || 0))
                                .map(profile => {
                                    const views = stats.hospitalViews[profile.id] || 0;
                                    const viewValues = Object.values(stats.hospitalViews) as number[];
                                    const maxViews = Math.max(...viewValues, 1);
                                    const percentage = (views / maxViews) * 100;
                                    
                                    return (
                                        <div key={profile.id} className="flex items-center gap-4">
                                            <div className="w-1/4 min-w-[150px] truncate font-medium text-gray-700 text-sm">{profile.name}</div>
                                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-brand-teal rounded-full transition-all duration-1000" 
                                                    style={{ width: `${percentage}%` }} 
                                                />
                                            </div>
                                            <div className="w-12 text-right font-bold text-gray-800">{views}</div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* VIEW: CLINICS */}
            {activeTab === 'clinics' && (
                <div className="flex h-full gap-6 flex-col md:flex-row">
                    {/* List */}
                    <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-1/3 md:h-full">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Vos structures ({profiles.length})</h3>
                            <button onClick={handleCreateNew} className="p-2 bg-brand-teal text-white rounded-full hover:bg-teal-600 transition-colors" title="Ajouter un établissement">
                                <Plus size={18} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {profiles.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">Aucun profil. Créez-en un ou activez l'IA.</p>}
                            {profiles.map(profile => (
                                <div 
                                    key={profile.id}
                                    onClick={() => handleEditClick(profile)}
                                    className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-colors ${selectedProfileId === profile.id ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50 border border-transparent'}`}
                                >
                                    <img src={profile.image_url} className="w-12 h-12 rounded-lg object-cover" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm text-gray-800 truncate">{profile.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{profile.location}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-y-auto h-2/3 md:h-full">
                        {editForm ? (
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start sticky top-0 bg-white z-10 py-2 border-b border-gray-50">
                                    <h3 className="text-2xl font-bold text-gray-800">Éditer la fiche</h3>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleDelete}
                                            className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors"
                                            title="Supprimer la fiche"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button 
                                            onClick={handleSave}
                                            className="flex items-center gap-2 bg-brand-teal text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-600 transition-colors"
                                        >
                                            <Save size={18} /> Sauvegarder
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Nom de l'établissement</label>
                                        <input 
                                            value={editForm.name} 
                                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 font-bold text-gray-700 focus:border-brand-teal outline-none" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><MapPin size={12}/> Localisation</label>
                                        <input 
                                            value={editForm.location} 
                                            onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                                            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 focus:border-brand-teal outline-none" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Pitch / Bio (Style "Rencontre")</label>
                                    <textarea 
                                        value={editForm.bio} 
                                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                        rows={3}
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 focus:border-brand-teal outline-none" 
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                     <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Building size={12}/> Taille(s)</label>
                                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto p-1">
                                            {ALL_SIZES.map(size => (
                                                <div 
                                                    key={size} 
                                                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50"
                                                    onClick={() => toggleArrayItem('size', size)}
                                                >
                                                    {editForm.size?.includes(size) 
                                                        ? <CheckSquare size={16} className="text-brand-teal" /> 
                                                        : <Square size={16} className="text-gray-300" />
                                                    }
                                                    <span className="text-xs text-gray-700">{size}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Clock size={12}/> Rythme(s)</label>
                                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto p-1">
                                            {ALL_RHYTHMS.map(r => (
                                                <div 
                                                    key={r} 
                                                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50"
                                                    onClick={() => toggleArrayItem('work_rhythm', r)}
                                                >
                                                    {editForm.work_rhythm?.includes(r) 
                                                        ? <CheckSquare size={16} className="text-brand-teal" /> 
                                                        : <Square size={16} className="text-gray-300" />
                                                    }
                                                    <span className="text-xs text-gray-700">{r}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Sun size={12}/> Vibe</label>
                                        <input 
                                            value={editForm.region_vibe} 
                                            onChange={(e) => setEditForm({...editForm, region_vibe: e.target.value})}
                                            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 outline-none" 
                                        />
                                    </div>
                                </div>

                                {/* Multi-select Specialties */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Spécialités recherchées (Cochez)</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        {ALL_SPECIALTIES.map(spec => (
                                            <div 
                                                key={spec} 
                                                className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors"
                                                onClick={() => toggleArrayItem('specialty_focus', spec)}
                                            >
                                                {editForm.specialty_focus?.includes(spec) 
                                                    ? <CheckSquare size={18} className="text-brand-teal" /> 
                                                    : <Square size={18} className="text-gray-300" />
                                                }
                                                <span className="text-xs text-gray-700">{spec}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Multi-select Perks + Custom */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Avantages (Perks)</label>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        {ALL_PERKS.map(perk => (
                                            <div 
                                                key={perk} 
                                                className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                                                onClick={() => toggleArrayItem('perks', perk)}
                                            >
                                                {editForm.perks?.includes(perk) 
                                                    ? <CheckSquare size={18} className="text-brand-pink" /> 
                                                    : <Square size={18} className="text-gray-300" />
                                                }
                                                <span className="text-sm text-gray-700">{perk}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input 
                                            type="text"
                                            value={newTagInput}
                                            onChange={(e) => setNewTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                                            placeholder="Ajouter un avantage personnalisé..."
                                            className="flex-1 p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm outline-none"
                                        />
                                        <button onClick={addCustomTag} className="p-2 bg-gray-200 rounded-lg text-gray-600 font-bold text-xs">
                                            Ajouter
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {editForm.perks?.filter(p => !ALL_PERKS.includes(p)).map((customPerk, i) => (
                                            <span key={i} className="px-2 py-1 bg-brand-pink/10 text-brand-pink text-xs rounded-lg flex items-center gap-1">
                                                {customPerk}
                                                <button onClick={() => toggleArrayItem('perks', customPerk)} className="hover:text-red-600">×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><ImageIcon size={12}/> URL Image</label>
                                    <div className="flex gap-4">
                                        <input 
                                            value={editForm.image_url} 
                                            onChange={(e) => setEditForm({...editForm, image_url: e.target.value})}
                                            className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-brand-teal outline-none" 
                                        />
                                        <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                                            <img src={editForm.image_url} alt="preview" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Video size={12}/> URL Vidéo Youtube</label>
                                    <input 
                                        value={editForm.video_url || ''} 
                                        onChange={(e) => setEditForm({...editForm, video_url: e.target.value})}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-brand-teal outline-none" 
                                    />
                                    <p className="text-[10px] text-gray-400">Copiez le lien complet de la vidéo YouTube.</p>
                                </div>

                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                                    <strong>Note :</strong> Cette fiche est visible par tous les candidats correspondant à vos critères de spécialité.
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Search size={48} className="mb-4 text-gray-200" />
                                <p>Sélectionnez un établissement pour l'éditer</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW: INBOX */}
            {activeTab === 'inbox' && (
                <div className="flex h-full gap-6 flex-col md:flex-row">
                    {/* Conversations List */}
                    <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-1/3 md:h-full">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Boîte de réception</h3>
                        </div>
                        <div className="overflow-y-auto flex-1 p-0 divide-y divide-gray-50">
                            {matches.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">Aucune candidature pour le moment.</p>}
                            {matches.map(match => (
                                <div 
                                    key={match.id}
                                    onClick={() => setSelectedMatchId(match.id)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMatchId === match.id ? 'bg-blue-50 border-l-4 border-brand-teal' : 'border-l-4 border-transparent'}`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-gray-800">{match.hospital.name}</span>
                                        <span className="text-xs text-gray-400">{new Date(match.messages[match.messages.length - 1]?.timestamp || new Date()).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                         <User size={12} className="text-gray-400"/>
                                         <span className="text-xs font-bold text-brand-dark">Candidat Intéressé</span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {match.lastMessage || "Nouveau Match !"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-2/3 md:h-full">
                        {activeMatch ? (
                            <>
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">
                                            DR
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">Candidature Spontanée</h3>
                                            <p className="text-xs text-brand-teal flex items-center gap-1">
                                                Concerne : {activeMatch.hospital.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                                    {activeMatch.messages.map((msg) => (
                                        <div 
                                            key={msg.id} 
                                            className={`flex ${msg.sender === 'hospital' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-sm ${
                                                msg.sender === 'hospital' 
                                                ? 'bg-brand-dark text-white rounded-br-none' 
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                            }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-white border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                            placeholder="Répondre au candidat..."
                                            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-teal outline-none"
                                        />
                                        <button 
                                            onClick={handleSendReply}
                                            disabled={!replyText.trim()}
                                            className="p-3 bg-brand-teal text-white rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <MessageSquare size={48} className="mb-4 text-gray-200" />
                                <p>Sélectionnez une conversation pour répondre</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW: TEAM MANAGEMENT */}
            {activeTab === 'team' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Shield size={24} className="text-brand-teal" /> 
                            Membres de l'application
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Gérez les droits d'accès au Back-Office. Seuls les "Admins" peuvent accéder à cet espace.</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Spécialité</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Accès Recruteur</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(user => (
                                    <tr key={user.email} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar} className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200" alt="avatar" />
                                                <div>
                                                    <div className="font-bold text-gray-800">{user.name || 'Sans Nom'}</div>
                                                    <div className="text-xs text-gray-400">{user.status || 'Inconnu'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-600">
                                            {user.specialty}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {user.email}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => onToggleAdmin(user.email)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${user.isAdmin ? 'bg-brand-teal' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.isAdmin ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                            <span className="ml-2 text-xs font-bold text-gray-400 w-12 inline-block text-right">
                                                {user.isAdmin ? 'ADMIN' : 'USER'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* VIEW: LEGAL */}
            {activeTab === 'legal' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FileText size={24} className="text-brand-teal" /> 
                                Édition des Mentions Légales
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">Ce texte sera visible par tous les utilisateurs dans l'application.</p>
                        </div>
                        <button 
                            onClick={handleSaveLegal}
                            className="flex items-center gap-2 bg-brand-teal text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-600 transition-colors"
                        >
                            <Save size={18} /> Sauvegarder
                        </button>
                    </div>
                    
                    <div className="flex-1 p-6 bg-gray-50">
                        <textarea 
                            value={legalText}
                            onChange={(e) => setLegalText(e.target.value)}
                            className="w-full h-full p-6 rounded-xl border border-gray-200 outline-none focus:border-brand-teal focus:ring-2 focus:ring-teal-100 transition-all font-mono text-sm leading-relaxed"
                            placeholder="Rédigez les mentions légales ici..."
                        />
                    </div>
                </div>
            )}

        </main>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
