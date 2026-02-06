
export interface HospitalProfile {
  id: string;
  name: string;
  location: string;
  region_vibe: string;
  size: string[];
  specialty_focus: string[];
  bio: string; // The "dating" bio
  leisure_activities: string[];
  work_rhythm: string[]; 
  image_url: string;
  video_url?: string; // New field for YouTube video
  distance_km: number;
  match_percentage: number;
  perks: string[]; // e.g., "Logement offert", "Vue mer"
}

export interface UserPreferences {
  name?: string; // Added for onboarding
  yearsExperience?: number; // Added for onboarding
  email: string; // Captured at login
  password?: string; // Added for security
  isAdmin?: boolean; // Access control for Back Office
  specialty: string;
  preferred_region_vibe: string;
  leisure: string;
  preferred_size: string;
  work_life_balance: string;
  // New fields
  status?: 'Curieux' | 'Disponible' | 'En veille';
  avatar?: string;
  bio?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'hospital';
  text: string;
  timestamp: string; // ISO string for easier database storage
}

export interface Match {
  id: string;
  hospital: HospitalProfile;
  messages: ChatMessage[];
  lastMessage?: string;
}

export interface AppStats {
    totalLogins: number;
    totalRegistrations: number;
    totalMessages: number;
    hospitalViews: Record<string, number>; // map hospitalId -> view count
}
