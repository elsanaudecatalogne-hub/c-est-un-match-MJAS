import { createClient } from '@supabase/supabase-js';

// Remplacez ces valeurs par vos vraies clés Supabase
const SUPABASE_URL = 'https://qgcurkqiemtdadlhakwi.supabase.co'; // Ex: https://xxxxx.supabase.co
const SUPABASE_KEY = 'sb_publishable_sQPrF6dpcmYIGVECc7trrw_7ohac8PR'; // La clé sb_publishable_...

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);