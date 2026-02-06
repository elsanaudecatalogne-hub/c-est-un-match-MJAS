
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const LOGO_URL = "https://monjobausoleil.fr/wp-content/uploads/2025/11/cropped-logo-monjobausoleil-4.png";

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('signup');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Inscription réussie ! Vérifie tes emails (ou connecte-toi si déjà confirmé).");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-brand-yellow flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-sm w-full flex flex-col items-center space-y-6">
        <img src={LOGO_URL} alt="Mon Job Au Soleil" className="h-16 object-contain" />
        <p className="text-gray-500 font-bold -mt-4">Le Match Médical 🩺☀️</p>
        
        <div className="flex w-full bg-gray-100 rounded-xl p-1">
          <button 
            onClick={() => setMode('signup')} 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'signup' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
          >
            Sign Up
          </button>
          <button 
            onClick={() => setMode('login')} 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'login' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleAuth} className="w-full space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-teal outline-none transition-all" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Mot de passe" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-teal outline-none transition-all" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-brand-teal text-white font-extrabold rounded-2xl shadow-xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            {loading ? 'Chargement...' : mode === 'signup' ? "C'est parti !" : "Connexion"}
          </button>
        </form>
        
        <p className="text-[10px] text-gray-400 text-center px-4">
          En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité solaire.
        </p>
      </div>
    </div>
  );
};

export default Auth;