# 🚀 Guide de Déploiement - Mon Job Au Soleil

## ✅ Checklist Complète

### 1. Configuration Supabase (Base de Données)

**a) Créer le projet Supabase**
- ✅ Déjà fait - Région: Europe West (Paris)
- URL du projet: Voir dans Supabase > Project Settings > API

**b) Créer les tables**
1. Aller dans Supabase Dashboard
2. Cliquer sur "SQL Editor"
3. Copier-coller le contenu du fichier `database-setup.sql`
4. Cliquer sur "Run"
5. Vérifier dans "Table Editor" que les 3 tables existent :
   - users
   - hospitals
   - matches

**c) Récupérer les clés**
1. Aller dans Project Settings > API
2. Copier:
   - **Project URL** (ex: https://xxxxx.supabase.co)
   - **anon public key** (commence par eyJ...)

### 2. Configuration Vercel (Hébergement)

**a) Connecter GitHub à Vercel**
- ✅ Déjà fait

**b) Configurer les variables d'environnement**
1. Aller dans Project Settings > Environment Variables
2. Ajouter ces 3 variables:
   ```
   Nom: GEMINI_API_KEY
   Valeur: [Votre clé API Gemini]
   
   Nom: VITE_SUPABASE_URL
   Valeur: [URL Supabase copiée à l'étape 1c]
   
   Nom: VITE_SUPABASE_ANON_KEY
   Valeur: [Clé publique Supabase copiée à l'étape 1c]
   ```
3. **IMPORTANT**: Cocher "Production", "Preview" et "Development"

**c) Redéployer**
1. Aller dans "Deployments"
2. Cliquer sur les 3 points (...) du dernier déploiement
3. Cliquer sur "Redeploy"
4. Attendre la fin du build (environ 1-2 minutes)

### 3. Vérification

**a) Tester l'application**
1. Ouvrir le lien de votre application Vercel
2. Essayer de créer un compte
3. Essayer de se connecter
4. Vérifier que les profils d'hôpitaux s'affichent

**b) Vérifier les données dans Supabase**
1. Retourner dans Supabase > Table Editor
2. Cliquer sur la table "users"
3. Vous devriez voir votre compte créé

### 4. Problèmes courants

**Erreur "Failed to fetch" ou "Network error"**
- Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont bien configurés dans Vercel
- Vérifiez qu'il n'y a pas de faute de frappe dans les clés
- Redéployez après avoir ajouté/modifié les variables

**L'application affiche un écran jaune vide**
- Ouvrez la console développeur (F12)
- Regardez les erreurs
- Vérifiez que toutes les variables d'environnement sont présentes

**"No rows" ou pas de données**
- Vérifiez que les tables ont bien été créées dans Supabase
- Relancez le script `database-setup.sql`

### 5. Développement local (optionnel)

Si vous voulez tester en local sur votre ordinateur:

1. Créer un fichier `.env.local` à la racine du projet
2. Ajouter:
   ```
   GEMINI_API_KEY=votre_clé
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. Lancer: `npm install` puis `npm run dev`

## 📱 Résultat Final

Une fois tout configuré, votre application sera:
- ✅ En ligne sur Vercel
- ✅ Avec base de données sécurisée (Supabase)
- ✅ Conforme RGPD (données en Europe)
- ✅ Accessible depuis n'importe où
- ✅ Avec authentification fonctionnelle

## 🆘 Besoin d'aide?

Si quelque chose ne fonctionne pas:
1. Vérifiez les logs dans Vercel > Deployments > Runtime Logs
2. Vérifiez la console navigateur (F12) pour les erreurs JavaScript
3. Vérifiez que les 3 tables existent dans Supabase
