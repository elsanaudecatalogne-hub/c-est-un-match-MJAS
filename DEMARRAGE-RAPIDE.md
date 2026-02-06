# 🚀 Démarrage Rapide - 5 Minutes

## ⚡ Ce que vous devez faire MAINTENANT

### Étape 1: Base de Données Supabase (2 min)

1. Ouvrez Supabase: https://supabase.com
2. Connectez-vous à votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche
4. Ouvrez le fichier `database-setup.sql` de ce projet
5. Copiez TOUT le contenu
6. Collez dans SQL Editor
7. Cliquez sur "Run" ▶️
8. Attendez le message "Success"

### Étape 2: Variables Vercel (2 min)

1. Ouvrez Vercel: https://vercel.com
2. Allez dans votre projet "c-est-un-match"
3. Cliquez sur "Settings" en haut
4. Cliquez sur "Environment Variables" dans le menu gauche
5. Vérifiez que vous avez ces 3 variables:
   - ✅ `GEMINI_API_KEY`
   - ✅ `VITE_SUPABASE_URL`
   - ✅ `VITE_SUPABASE_ANON_KEY`

**Si elles manquent, ajoutez-les:**
- Pour VITE_SUPABASE_URL: Allez dans Supabase > Project Settings > API > Project URL
- Pour VITE_SUPABASE_ANON_KEY: Même endroit > anon public

### Étape 3: Redéployer (1 min)

1. Dans Vercel, cliquez sur "Deployments"
2. Sur le dernier déploiement, cliquez sur les 3 points (...)
3. Cliquez "Redeploy"
4. Attendez la fin (1-2 minutes)

### Étape 4: Tester ✅

1. Ouvrez votre application (le lien Vercel)
2. Créez un compte de test
3. Regardez si ça fonctionne !

## ❓ Ça ne marche pas?

### Erreur 404 ou page blanche
→ Vérifiez les variables d'environnement dans Vercel
→ Redéployez

### "Failed to fetch"
→ Vérifiez que les tables existent dans Supabase (Table Editor)
→ Relancez le script SQL si nécessaire

### L'inscription ne marche pas
→ Ouvrez la console (F12 dans le navigateur)
→ Regardez les erreurs rouges
→ Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont corrects

## 📞 Support

Si vraiment rien ne marche:
1. Consultez `GUIDE-DEPLOIEMENT.md` pour le guide détaillé
2. Consultez `MODIFICATIONS.md` pour voir ce qui a changé
3. Vérifiez les logs dans Vercel > Deployments > Runtime Logs

## ✅ Checklist Finale

- [ ] Tables créées dans Supabase (3 tables: users, hospitals, matches)
- [ ] Variables d'environnement dans Vercel (3 variables)
- [ ] Application redéployée
- [ ] Test de création de compte réussi
- [ ] Données visibles dans Supabase Table Editor

**Une fois tout coché, votre application est en PRODUCTION! 🎉**
