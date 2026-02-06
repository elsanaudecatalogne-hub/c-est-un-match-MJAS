
import { GoogleGenAI, Type } from "@google/genai";
import { HospitalProfile, UserPreferences } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_PROFILES = `
Tu es l'algorithme de matching de "Mon Job Au Soleil", l'application de rencontre entre médecins et établissements de santé (ELSAN).
Ton ton est :
- Solaire, fun, séducteur (codes Tinder/Meetic) mais professionnel sur le fond.
- Tu mets en avant le CADRE DE VIE (Soleil, Mer, Montagne) comme atout majeur de séduction.

CONTEXTE - ÉTABLISSEMENTS PARTENAIRES (A privilégier absolument) :
Voici la liste des établissements réels. Utilise ces noms et localisations.
1. Clinique SMR Supervaltech (66 - Saint-Estève). Vibe: Moderne, Dynamique, Proche Perpignan.
2. Clinique SMR Sud (11 - Carcassonne). Vibe: Rééducation, Historique, Détente.
3. Clinique Saint-Pierre (66 - Perpignan). Vibe: Historique, Centre-ville, Excellence.
4. Clinique Saint-Michel (66 - Prades). Vibe: Nature, Montagne, Calme.
5. Hôpital Privé du Grand Narbonne (11 - Narbonne). Vibe: Dynamique, Gros plateau technique, Urgences.
6. Clinique SMR Le Floride (66 - Le Barcarès). Vibe: Les pieds dans l'eau, Cadre vacances.
7. Polyclinique Médipôle Saint-Roch (66 - Cabestany). Vibe: Référence régionale, Pluridisciplinaire, Intense.
8. Clinique du Vallespir (66 - Céret). Vibe: Charme, Ville d'art, Taille humaine.
9. Polyclinique Méditerranée (66 - Perpignan). Vibe: Familial, Proximité.

Génère des données JSON valides.
`;

// Helper to map establishment names to specific "Mon Job Au Soleil" style images
const getHospitalImage = (name: string, index: number): string => {
  const normalized = name.toLowerCase();
  // Using Unsplash source URLs to simulate the specific establishment photos requested
  if (normalized.includes("floride")) return "https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?q=80&w=800&auto=format&fit=crop"; // Pool/Palm
  if (normalized.includes("supervaltech")) return "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop"; // Modern Tech
  if (normalized.includes("narbonne")) return "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800&auto=format&fit=crop"; // Large Hospital
  if (normalized.includes("michel")) return "https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800&auto=format&fit=crop"; // Mountain/Nature
  if (normalized.includes("roch")) return "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=800&auto=format&fit=crop"; // Big Complex
  if (normalized.includes("sud")) return "https://images.unsplash.com/photo-1571772996211-2f02c9727629?q=80&w=800&auto=format&fit=crop"; // Sunny Rehabilitation
  
  // Default fallbacks with sun/medical vibe
  return `https://images.unsplash.com/photo-${index % 2 === 0 ? '1538108149393-fbbd81895907' : '1629909613654-28e377c37b09'}?q=80&w=800&auto=format&fit=crop`;
};

export const fetchHospitalProfiles = async (prefs: UserPreferences, mode: 'strict' | 'discovery' = 'strict'): Promise<HospitalProfile[]> => {
  try {
    let prompt = "";
    
    if (mode === 'strict') {
         prompt = `Génère 5 profils d'établissements de santé pour un utilisateur avec les critères suivants :
        
        LE MÉDECIN (Candidat) :
        - Spécialité : ${prefs.specialty}
        - Recherche (Taille structure) : ${prefs.preferred_size}
        - Vibe idéale : ${prefs.preferred_region_vibe}
        - Passions (Loisirs) : ${prefs.leisure}
        - Attente (Rythme) : ${prefs.work_life_balance}

        INSTRUCTIONS :
        1. Pioche en priorité dans la liste des ÉTABLISSEMENTS PARTENAIRES.
        2. Rédige une BIO de "rencontre" courte et fun.
        3. Respecte le JSON Schema.
        `;
    } else {
        // Discovery mode: Broaden criteria, ignore specific filters to ensure fallback content
        prompt = `Génère 5 profils d'établissements de santé situés dans le SUD DE LA FRANCE pour le mode "Découverte".
        
        LE MÉDECIN (Candidat) :
        - Spécialité : ${prefs.specialty}
        
        INSTRUCTIONS :
        1. Propose des établissements variés (mer, montagne, ville) même s'ils ne correspondent pas parfaitement à la vibe "${prefs.preferred_region_vibe}".
        2. Le but est de faire découvrir d'autres opportunités au soleil.
        3. Rédige une BIO accrocheuse type "Laissez-vous tenter par...".
        4. Assure toi que les IDs générés soient aléatoires pour éviter les doublons.
        `;
    }

    // Fix: Use 'gemini-3-flash-preview' for basic text tasks as per latest SDK guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PROFILES,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              location: { type: Type.STRING },
              region_vibe: { type: Type.STRING },
              size: { type: Type.ARRAY, items: { type: Type.STRING } },
              specialty_focus: { type: Type.ARRAY, items: { type: Type.STRING } },
              bio: { type: Type.STRING },
              leisure_activities: { type: Type.ARRAY, items: { type: Type.STRING } },
              work_rhythm: { type: Type.ARRAY, items: { type: Type.STRING } },
              distance_km: { type: Type.INTEGER },
              match_percentage: { type: Type.INTEGER },
              perks: { type: Type.ARRAY, items: { type: Type.STRING } },
              video_url: { type: Type.STRING },
            },
            required: ['id', 'name', 'location', 'bio', 'size', 'match_percentage', 'work_rhythm', 'leisure_activities', 'perks'],
          },
        },
      },
    });

    const profiles = JSON.parse(response.text || "[]");
    
    // Add images based on name matching logic and ensure a default video URL if missing
    return profiles.map((p: any, index: number) => ({
      ...p,
      // Ensure IDs are unique in discovery mode to prevent key collisions if API returns same hardcoded IDs
      id: mode === 'discovery' ? `${p.id}-${Date.now()}-${index}` : p.id,
      // Normalize single strings to arrays if the AI slipped up, to match new Type definition
      size: Array.isArray(p.size) ? p.size : [p.size],
      work_rhythm: Array.isArray(p.work_rhythm) ? p.work_rhythm : [p.work_rhythm],
      image_url: getHospitalImage(p.name, index),
      // Default ELSAN video if none provided by AI
      video_url: p.video_url || "https://www.youtube.com/watch?v=F_Sj8d94W2k" 
    }));

  } catch (error) {
    console.error("Error generating profiles:", error);
    return [];
  }
};
