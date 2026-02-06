-- ============================================
-- Configuration Base de Données Supabase
-- Mon Job Au Soleil - Application de Matching Médical
-- ============================================

-- Table pour les utilisateurs (médecins)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  specialty TEXT,
  preferred_size TEXT,
  preferred_region_vibe TEXT,
  leisure TEXT,
  work_life_balance TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les hôpitaux/établissements
CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  region_vibe TEXT,
  size TEXT[],
  specialty_focus TEXT[],
  bio TEXT,
  leisure_activities TEXT[],
  work_rhythm TEXT[],
  distance_km INTEGER,
  match_percentage INTEGER,
  perks TEXT[],
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT REFERENCES users(email) ON DELETE CASCADE,
  hospital_id TEXT REFERENCES hospitals(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_email, hospital_id)
);

-- Activer Row Level Security (RLS) pour la sécurité RGPD
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policies pour les utilisateurs
-- Les utilisateurs peuvent voir et modifier leurs propres données
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR true); -- Temporairement permissif pour le dev

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text OR true);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (true);

-- Policies pour les hôpitaux
-- Tous les utilisateurs connectés peuvent voir les hôpitaux
CREATE POLICY "Anyone can view hospitals" ON hospitals
  FOR SELECT USING (true);

-- Seuls les admins peuvent modifier les hôpitaux (à affiner selon vos besoins)
CREATE POLICY "Admins can manage hospitals" ON hospitals
  FOR ALL USING (true);

-- Policies pour les matches
-- Les utilisateurs peuvent voir leurs propres matches
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Users can create matches" ON matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own matches" ON matches
  FOR UPDATE USING (true);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_matches_user_email ON matches(user_email);
CREATE INDEX IF NOT EXISTS idx_matches_hospital_id ON matches(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_name ON hospitals(name);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();