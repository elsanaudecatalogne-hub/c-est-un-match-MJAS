# 📋 Configuration - À Remplir

## Supabase

**Où trouver:** Supabase Dashboard > Project Settings > API

```
Project URL:
[Collez ici - ex: https://xxxxx.supabase.co]

anon public key:
[Collez ici - commence par eyJ...]
```

## Google Gemini

**Où trouver:** Google AI Studio > Get API Key

```
API Key:
[Collez ici - commence par AIza...]
```

## Vercel (Variables d'Environnement)

**Où configurer:** Vercel > Votre Projet > Settings > Environment Variables

Ajouter ces 3 variables:

1. **Nom:** GEMINI_API_KEY
   **Valeur:** [API Key Gemini ci-dessus]
   **Environnements:** ✅ Production ✅ Preview ✅ Development

2. **Nom:** VITE_SUPABASE_URL
   **Valeur:** [Project URL Supabase ci-dessus]
   **Environnements:** ✅ Production ✅ Preview ✅ Development

3. **Nom:** VITE_SUPABASE_ANON_KEY
   **Valeur:** [anon public key Supabase ci-dessus]
   **Environnements:** ✅ Production ✅ Preview ✅ Development

## URLs de votre Application

**URL Vercel Production:**
[Sera automatiquement générée - ex: https://c-est-un-match.vercel.app]

**URL AI Studio (dev):**
https://ai.studio/apps/drive/1efO7II_FWou3dnr6xX2FL1Soypxgc1aS

## Checklist Configuration

- [ ] Projet Supabase créé (région EU)
- [ ] Tables créées via database-setup.sql
- [ ] Project URL Supabase copiée
- [ ] anon public key Supabase copiée
- [ ] API Key Gemini copiée
- [ ] 3 variables ajoutées dans Vercel
- [ ] Application redéployée sur Vercel
- [ ] Test de création de compte réussi

## Notes

- **Sécurité:** Ne partagez JAMAIS ces clés publiquement
- **Région:** Données hébergées en Europe (RGPD ✅)
- **Support:** Voir GUIDE-DEPLOIEMENT.md pour aide détaillée
