import { supabase } from './supabaseClient';
import { HospitalProfile, Match, UserPreferences, AppStats } from '../types';

// --- STATS (fallback local) ---
const DEFAULT_STATS: AppStats = {
  totalLogins: 0,
  totalRegistrations: 0,
  totalMessages: 0,
  hospitalViews: {}
};

export const dbGetStats = async (): Promise<AppStats> => {
  try {
    const { data, error } = await supabase.from('app_stats').select('*').single();
    if (error || !data) {
      const stored = localStorage.getItem('mjas_stats');
      return stored ? JSON.parse(stored) : DEFAULT_STATS;
    }
    return data as AppStats;
  } catch (err) {
    console.warn("Failed to fetch stats from DB, using local storage", err);
    const stored = localStorage.getItem('mjas_stats');
    return stored ? JSON.parse(stored) : DEFAULT_STATS;
  }
};

export const dbIncrementStat = async (
  type: 'login' | 'registration' | 'message' | 'view',
  entityId?: string
) => {
  try {
    const stats = await dbGetStats();

    switch (type) {
      case 'login':
        stats.totalLogins += 1;
        break;
      case 'registration':
        stats.totalRegistrations += 1;
        break;
      case 'message':
        stats.totalMessages += 1;
        break;
      case 'view':
        if (entityId) stats.hospitalViews[entityId] = (stats.hospitalViews[entityId] || 0) + 1;
        break;
    }

    localStorage.setItem('mjas_stats', JSON.stringify(stats));
    await supabase.from('app_stats').upsert({ id: 1, ...stats });
  } catch (err) {
    console.error("Failed to increment stat:", err);
  }
};

// --- AUTH HELPERS ---
const getSessionUser = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session?.user ?? null;
  } catch (err) {
    console.error("Session fetch failed:", err);
    return null;
  }
};

const requireUser = async () => {
  const user = await getSessionUser();
  if (!user) throw new Error('No active session');
  return user;
};

// --- USERS = PROFILES ---
export const dbSaveUser = async (user: UserPreferences) => {
  try {
    const authUser = await requireUser();

    const payload = {
      id: authUser.id,
      email: authUser.email,
      name: user.name ?? null,
      years_experience: user.yearsExperience ?? null,
      specialty: user.specialty ?? null,
      preferred_size: user.preferred_size ?? null,
      preferred_region_vibe: user.preferred_region_vibe ?? null,
      leisure: user.leisure ?? null,
      work_life_balance: user.work_life_balance ?? null,
      is_admin: user.isAdmin ?? false,
      status: user.status ?? null,
      avatar: user.avatar ?? null,
      bio: user.bio ?? null
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'email' });
    if (error) throw error;
  } catch (err) {
    console.error('Error saving profile:', err);
    throw err;
  }
};

export const dbGetUser = async (email: string): Promise<UserPreferences | undefined> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return undefined;

    return {
      email: data.email,
      password: '',
      isAdmin: data.is_admin ?? false,
      name: data.name ?? '',
      yearsExperience: data.years_experience ?? 0,
      specialty: data.specialty ?? 'Autre',
      preferred_region_vibe: data.preferred_region_vibe ?? '',
      leisure: data.leisure ?? '',
      preferred_size: data.preferred_size ?? '',
      work_life_balance: data.work_life_balance ?? '',
      status: data.status ?? 'Disponible',
      avatar: data.avatar ?? '',
      bio: data.bio ?? ''
    };
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return undefined;
  }
};

export const dbGetAllUsers = async (): Promise<UserPreferences[]> => {
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error || !data) return [];

    return data.map(d => ({
      email: d.email,
      password: '',
      isAdmin: d.is_admin ?? false,
      name: d.name ?? '',
      yearsExperience: d.years_experience ?? 0,
      specialty: d.specialty ?? 'Autre',
      preferred_region_vibe: d.preferred_region_vibe ?? '',
      leisure: d.leisure ?? '',
      preferred_size: d.preferred_size ?? '',
      work_life_balance: d.work_life_balance ?? '',
      status: d.status ?? 'Disponible',
      avatar: d.avatar ?? '',
      bio: d.bio ?? ''
    }));
  } catch (err) {
    console.error("Error fetching all users:", err);
    return [];
  }
};

export const dbDeleteUser = async (email: string) => {
  const { error } = await supabase.from('profiles').delete().eq('email', email);
  if (error) throw error;
};

// --- SESSION (Supabase) ---
export const dbGetSessionUser = async (): Promise<UserPreferences | null> => {
  const u = await getSessionUser();
  if (!u?.email) return null;
  const profile = await dbGetUser(u.email);
  return profile || null;
};

export const dbClearSession = async () => {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout failed:", err);
  }
};

// --- HOSPITALS ---
export const dbGetHospitals = async (): Promise<HospitalProfile[]> => {
  try {
    const { data, error } = await supabase.from('hospitals').select('*');
    if (error || !data) return [];
    return data as HospitalProfile[];
  } catch (err) {
    console.error("Error fetching hospitals:", err);
    return [];
  }
};

export const dbSaveHospitals = async (profiles: HospitalProfile[]) => {
  const { error } = await supabase.from('hospitals').upsert(profiles);
  if (error) throw error;
};

export const dbUpdateHospital = async (updatedProfile: HospitalProfile) => {
  const { error } = await supabase.from('hospitals').update(updatedProfile).eq('id', updatedProfile.id);
  if (error) throw error;
};

export const dbAddHospital = async (newProfile: HospitalProfile) => {
  const { error } = await supabase.from('hospitals').insert(newProfile);
  if (error) throw error;
};

export const dbDeleteHospital = async (id: string) => {
  const { error } = await supabase.from('hospitals').delete().eq('id', id);
  if (error) throw error;
};

// --- MATCHES ---
export const dbGetMatches = async (): Promise<Match[]> => {
  try {
    const user = await getSessionUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('matches')
      .select('*, hospital:hospitals(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      hospital: d.hospital,
      messages: d.messages || [],
      lastMessage: d.last_message || ''
    }));
  } catch (err) {
    console.error("Error fetching matches:", err);
    return [];
  }
};

export const dbSaveMatch = async (match: Match) => {
  try {
    const user = await requireUser();

    const { error, data } = await supabase
      .from('matches')
      .insert({
        hospital_id: match.hospital.id,
        user_id: user.id,
        user_email: user.email,
        messages: match.messages ?? [],
        last_message: match.lastMessage ?? null
      })
      .select('id')
      .single();

    if (error) throw error;
    match.id = data?.id;
  } catch (err) {
    console.error("Error saving match:", err);
    throw err;
  }
};


export const dbUpdateMatch = async (match: Match) => {
  try {
    const { error } = await supabase
      .from('matches')
      .update({
        messages: match.messages,
        last_message: match.lastMessage ?? null
      })
      .eq('id', match.id);

    if (error) throw error;
  } catch (err) {
    console.error("Error updating match:", err);
  }
};

// --- LEGAL (local pour le moment) ---
export const dbGetLegalText = (): string => {
  return localStorage.getItem('mjas_legal') || 'Mentions Légales Mon Job Au Soleil...';
};

export const dbSaveLegalText = (text: string) => {
  localStorage.setItem('mjas_legal', text);
};
