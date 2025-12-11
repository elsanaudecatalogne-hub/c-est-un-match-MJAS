
import { HospitalProfile, Match, UserPreferences, AppStats } from '../types';

const DB_KEYS = {
  USERS: 'mjas_users',
  HOSPITALS: 'mjas_hospitals',
  MATCHES: 'mjas_matches',
  CURRENT_USER_EMAIL: 'mjas_current_session',
  LEGAL_TEXT: 'mjas_legal_text',
  STATS: 'mjas_stats'
};

// --- HELPER ---
const getStorage = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const setStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// --- STATS ---
const DEFAULT_STATS: AppStats = {
    totalLogins: 0,
    totalRegistrations: 0,
    totalMessages: 0,
    hospitalViews: {}
};

export const dbGetStats = (): AppStats => {
    return getStorage<AppStats>(DB_KEYS.STATS, DEFAULT_STATS);
};

export const dbIncrementStat = (type: 'login' | 'registration' | 'message' | 'view', entityId?: string) => {
    const stats = dbGetStats();
    
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
            if (entityId) {
                stats.hospitalViews[entityId] = (stats.hospitalViews[entityId] || 0) + 1;
            }
            break;
    }
    
    setStorage(DB_KEYS.STATS, stats);
};

// --- USERS ---
export const dbSaveUser = (user: UserPreferences) => {
  const users = getStorage<UserPreferences[]>(DB_KEYS.USERS, []);
  const existingIndex = users.findIndex(u => u.email === user.email);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
    // New registration tracked here if it wasn't explicitly called elsewhere
    // But we prefer calling it in App.tsx for better control
  }
  
  setStorage(DB_KEYS.USERS, users);
  // Persist session
  setStorage(DB_KEYS.CURRENT_USER_EMAIL, user.email);
};

export const dbGetUser = (email: string): UserPreferences | undefined => {
  const users = getStorage<UserPreferences[]>(DB_KEYS.USERS, []);
  return users.find(u => u.email === email);
};

export const dbDeleteUser = (email: string) => {
    let users = getStorage<UserPreferences[]>(DB_KEYS.USERS, []);
    users = users.filter(u => u.email !== email);
    setStorage(DB_KEYS.USERS, users);
    
    // Also clear session if it was the logged in user
    const currentSession = getStorage<string | null>(DB_KEYS.CURRENT_USER_EMAIL, null);
    if (currentSession === email) {
        localStorage.removeItem(DB_KEYS.CURRENT_USER_EMAIL);
    }
};

export const dbGetAllUsers = (): UserPreferences[] => {
  return getStorage<UserPreferences[]>(DB_KEYS.USERS, []);
};

export const dbSaveAllUsers = (users: UserPreferences[]) => {
  setStorage(DB_KEYS.USERS, users);
};

export const dbGetSessionUser = (): UserPreferences | null => {
  const email = getStorage<string | null>(DB_KEYS.CURRENT_USER_EMAIL, null);
  if (!email) return null;
  return dbGetUser(email) || null;
};

export const dbClearSession = () => {
  localStorage.removeItem(DB_KEYS.CURRENT_USER_EMAIL);
};

// --- HOSPITALS ---
export const dbGetHospitals = (): HospitalProfile[] => {
  return getStorage<HospitalProfile[]>(DB_KEYS.HOSPITALS, []);
};

export const dbSaveHospitals = (profiles: HospitalProfile[]) => {
  setStorage(DB_KEYS.HOSPITALS, profiles);
};

export const dbUpdateHospital = (updatedProfile: HospitalProfile) => {
  const profiles = dbGetHospitals();
  const index = profiles.findIndex(p => p.id === updatedProfile.id);
  if (index >= 0) {
    profiles[index] = updatedProfile;
    setStorage(DB_KEYS.HOSPITALS, profiles);
  }
};

export const dbAddHospital = (newProfile: HospitalProfile) => {
  const profiles = dbGetHospitals();
  profiles.unshift(newProfile); // Add to top
  setStorage(DB_KEYS.HOSPITALS, profiles);
};

export const dbDeleteHospital = (id: string) => {
  let profiles = dbGetHospitals();
  profiles = profiles.filter(p => p.id !== id);
  setStorage(DB_KEYS.HOSPITALS, profiles);
};

// --- MATCHES & MESSAGES ---
export const dbGetMatches = (): Match[] => {
  return getStorage<Match[]>(DB_KEYS.MATCHES, []);
};

export const dbSaveMatch = (match: Match) => {
  const matches = dbGetMatches();
  // Check if match already exists (prevent duplicates)
  const exists = matches.find(m => m.hospital.id === match.hospital.id);
  if (!exists) {
    matches.unshift(match);
    setStorage(DB_KEYS.MATCHES, matches);
  }
};

export const dbUpdateMatch = (updatedMatch: Match) => {
  const matches = dbGetMatches();
  const index = matches.findIndex(m => m.id === updatedMatch.id);
  if (index >= 0) {
    matches[index] = updatedMatch;
    setStorage(DB_KEYS.MATCHES, matches);
  }
};

// --- LEGAL ---
export const dbGetLegalText = (): string => {
    return getStorage<string>(DB_KEYS.LEGAL_TEXT, `
**Mentions Légales - Mon Job Au Soleil**

**1. Éditeur du site**
L'application "Mon Job Au Soleil" est éditée par le groupe ELSAN.

**2. Hébergement**
L'hébergement est assuré par [Nom de l'hébergeur].

**3. Données Personnelles**
Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
Les données collectées servent uniquement au matching entre professionnels de santé et établissements.

**4. Contact**
Pour toute question : contact@elsan.care
    `.trim());
};

export const dbSaveLegalText = (text: string) => {
    setStorage(DB_KEYS.LEGAL_TEXT, text);
};
