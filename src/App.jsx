import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wallet, Dumbbell as GymIcon, Utensils, Calendar, 
  Plus, Trash2, TrendingDown, TrendingUp, Zap, CheckCircle2, PieChart, 
  CreditCard, ArrowUpCircle, ArrowDownCircle, Activity, History, Library, 
  ChevronRight, Weight, Check, Search, ArrowLeft, CalendarDays, Target, 
  PlusCircle, Settings, AlertCircle, Clock 
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, collection, doc, addDoc, onSnapshot, query, 
  deleteDoc, updateDoc, setDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';

// --- GESTION SÉCURISÉE DE LA CONFIGURATION ---
// Ces variables sont extraites de l'environnement Vercel ou du fallback local
let firebaseConfig = null;
let appId = 'life-dashboard-suisse-v5';
let configError = null;

try {
  // Tentative de récupération depuis import.meta.env (Vite/Vercel)
  const configRaw = import.meta.env?.VITE_FIREBASE_CONFIG;
  const idRaw = import.meta.env?.VITE_APP_ID;

  if (configRaw) {
    const cleaned = configRaw.trim().replace(/^['"]|['"]$/g, '');
    firebaseConfig = JSON.parse(cleaned);
  } else if (typeof __firebase_config !== 'undefined') {
    // Fallback pour l'environnement interne Gemini
    firebaseConfig = JSON.parse(__firebase_config);
  }
  
  if (idRaw) appId = idRaw;

  if (!firebaseConfig || !firebaseConfig.apiKey) {
    configError = "Configuration Firebase manquante. Vérifiez VITE_FIREBASE_CONFIG.";
  }
} catch (e) {
  configError = "Erreur de format JSON dans la configuration : " + e.message;
}

// Initialisation globale des services Firebase
let app, auth, db;
if (!configError) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    configError = "Erreur lors de l'initialisation Firebase : " + e.message;
  }
}

/**
 * Composant principal de l'application LIFE Dashboard.
 * Gère l'authentification anonyme et la synchronisation Firestore en temps réel.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('accueil');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(configError);

  // États locaux pour stocker les données provenant de Firestore
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [budgetGoal, setBudgetGoal] = useState(0);
  
  // Gestion de la période sélectionnée (Mois/Année)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- EFFET 1 : GESTION DE L'AUTHENTIFICATION ---
  useEffect(() => {
    if (error || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        try {
          // On tente une connexion anonyme pour accéder aux données sécurisées
          await signInAnonymously(auth);
        } catch (err) {
          setError("Échec de la connexion anonyme : " + err.message);
          setLoading(false);
        }
      } else {
        setUser(u);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [error]);

  // --- EFFET 2 : SYNCHRONISATION FIRESTORE ---
  useEffect(() => {
    if (!user || !db) return;

    // Définition des collections à écouter
    const collectionsToTrack = [
      { name: 'expenses', setter: setExpenses },
      { name: 'subscriptions', setter: setSubscriptions },
      { name: 'incomes', setter: setIncomes },
      { name: 'workouts', setter: setWorkouts }
    ];

    // Mise en place des écouteurs temps réel (onSnapshot)
    const unsubs = collectionsToTrack.map(({ name, setter }) => 
      onSnapshot(
        query(collection(db, 'artifacts', appId, 'users', user.uid, name)), 
        (snap) => setter(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => console.error(`Erreur sur ${name}:`, err)
      )
    );

    // Écouteur spécifique pour l'objectif de budget
    const unsubGoal = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budget'), (d) => {
      if(d.exists()) setBudgetGoal(d.data().monthlyGoal || 0);
    });

    return () => {
      unsubs.forEach(u => u());
      unsubGoal();
    };
  }, [user, db, appId]);

  // --- CALCUL DES STATISTIQUES FINANCIÈRES ---
  const stats = useMemo(() => {
    const isCurrentPeriod = (dateStr) => {
      if (!dateStr) return false;
      const parts = dateStr.includes('.') ? dateStr.split('.') : dateStr.split('/');
      // Format attendu: DD.MM.YYYY ou DD/MM/YYYY
      return parseInt(parts[1]) - 1 === selectedMonth && parseInt(parts[2]) === selectedYear;
    };

    const currentExpenses = expenses.filter(e => isCurrentPeriod(e.date));
    const totalExp = currentExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalSub = subscriptions.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalInc = incomes.filter(i => isCurrentPeriod(i.date)).reduce((sum, item) => sum + Number(item.amount), 0);
    
    const realBalance = totalInc - (totalSub + totalExp);
    const goalRemaining = budgetGoal > 0 ? budgetGoal - totalExp : realBalance;

    // Journal chronologique
    const journal = [
      ...incomes.filter(i => isCurrentPeriod(i.date)).map(i => ({ ...i, type: 'income' })),
      ...currentExpenses.map(e => ({ ...e, type: 'expense' })),
      ...subscriptions.map(s => ({
        ...s, 
        type: 'fixed', 
        isPlanned: true,
        date: `${String(s.day || '01').padStart(2, '0')}.${String(selectedMonth + 1).padStart(2, '0')}.${selectedYear}`
      }))
    ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return { totalSub, totalExp, realBalance, goalRemaining, journal };
  }, [expenses, incomes, subscriptions, selectedMonth, selectedYear, budgetGoal]);

  // --- FONCTION DE SUPPRESSION ---
  const deleteItem = async (colName, id) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, colName, id));
    } catch (e) {
      console.error("Erreur suppression:", e);
    }
  };

  // --- AFFICHAGE DES ERREURS ---
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center font-sans">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-red-100 max-w-md">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={56} />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Erreur de connexion</h2>
        <p className="text-sm text-red-600 mb-6 leading-relaxed">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-transform"
        >
          Réessayer
        </button>
      </div>
    </div>
  );

  // --- ÉCRAN DE CHARGEMENT ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 font-sans">
      <div className="w-16 h-16 bg-indigo-600 rounded-[32px] animate-bounce flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-100">L</div>
      <p className="font-black text-indigo-600 text-[10px] uppercase tracking-widest animate-pulse">Initialisation de LIFE...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-0 md:pl-72 font-sans antialiased">
      {/* Sidebar Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col shadow-sm">
        <div className="text-3xl font-black mb-12 text-indigo-600 tracking-tighter flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">L</div> 
          LIFE.
        </div>
        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('accueil')} 
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab === 'accueil' ? 'bg-indigo-600 text-white shadow-xl font-bold translate-x-1' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={20}/> Accueil
          </button>
          <button 
            onClick={() => setActiveTab('budget')} 
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-xl font-bold translate-x-1' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <Wallet size={20}/> Finances
          </button>
        </nav>
      </aside>

      {/* Contenu Principal */}
      <main className="max-w-2xl mx-auto p-4 md:max-w-4xl md:p-12 text-slate-800">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">Dashboard</h1>
            <p className="text-slate-500 font-medium text-sm">Bonjour 👋 État de vos comptes</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Réel</p>
             <p className={`text-2xl font-black ${stats.realBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
               {stats.realBalance.toFixed(2)} <span className="text-sm opacity-60">CHF</span>
             </p>
          </div>
        </header>

        {activeTab === 'accueil' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Carte Balance */}
            <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
               <div className="relative z-10">
                 <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">Reste à dépenser</p>
                 <h2 className="text-5xl font-black mt-1">
                   {stats.goalRemaining.toFixed(2)} <span className="text-xl font-medium opacity-60">CHF</span>
                 </h2>
                 <p className="mt-2 text-[10px] text-indigo-100 font-bold uppercase tracking-wider opacity-80">
                   {budgetGoal > 0 ? `Objectif mensuel: ${budgetGoal} CHF` : "Aucun objectif défini"}
                 </p>
               </div>
               <Wallet className="absolute -right-6 -bottom-6 opacity-10 w-32 h-32 rotate-12" />
            </div>

            {/* Grille d'infos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                 <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Charges Fixes</h3>
                 <p className="text-2xl font-black text-slate-800">{stats.totalSub.toFixed(2)} CHF</p>
                 <div className="mt-4 flex flex-wrap gap-2">
                   {subscriptions.map(s => (
                     <span key={s.id} className="text-[9px] font-black bg-slate-50 text-slate-500 px-3 py-1.5 rounded-full border border-slate-100">
                       {s.name} (le {s.day})
                     </span>
                   ))}
                 </div>
               </div>
               <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
                 <div>
                   <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Statut</h3>
                   <div className="flex items-center gap-2 text-green-500 font-black">
                     <CheckCircle2 size={16} /> Application Active
                   </div>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-4 leading-relaxed italic">
                   Connecté à la base de données 🇨🇭
                 </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black">Historique</h2>
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex gap-2">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent border-none text-[10px] font-black uppercase p-2 outline-none"
                >
                  {["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"].map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 pb-12">
              {stats.journal.map((item, idx) => (
                <div 
                  key={item.id || idx} 
                  className={`flex justify-between items-center p-5 rounded-[28px] border shadow-sm transition-all group ${
                    item.type === 'fixed' 
                      ? 'bg-slate-50/80 border-dashed border-slate-300' 
                      : 'bg-white border-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      item.type === 'income' ? 'bg-green-100 text-green-600' : 
                      item.type === 'fixed' ? 'bg-slate-100 text-slate-600' : 
                      'bg-red-50 text-red-600'
                    }`}>
                      {item.type === 'income' ? <ArrowUpCircle size={24}/> : 
                       item.type === 'fixed' ? <Clock size={24}/> : 
                       <ArrowDownCircle size={24}/>}
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-black text-lg ${
                      item.type === 'income' ? 'text-green-600' : 
                      item.type === 'fixed' ? 'text-slate-500' : 
                      'text-red-500'
                    }`}>
                      {item.type === 'income' ? '+' : '-'}{Number(item.amount).toFixed(2)}
                    </span>
                    {!item.isPlanned && (
                      <button 
                        onClick={() => deleteItem(item.type === 'income' ? 'incomes' : 'expenses', item.id)} 
                        className="text-slate-300 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18}/>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {stats.journal.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 text-sm font-medium italic">Aucune transaction pour cette période.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-4 md:hidden z-50 rounded-t-[40px] shadow-2xl">
        <button 
          onClick={() => setActiveTab('accueil')} 
          className={`p-4 rounded-[24px] transition-all duration-300 ${activeTab === 'accueil' ? 'bg-indigo-600 text-white shadow-xl -translate-y-4 scale-110' : 'text-slate-300 hover:text-indigo-400'}`}
        >
          <LayoutDashboard size={26}/>
        </button>
        <button 
          onClick={() => setActiveTab('budget')} 
          className={`p-4 rounded-[24px] transition-all duration-300 ${activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-xl -translate-y-4 scale-110' : 'text-slate-300 hover:text-indigo-400'}`}
        >
          <Wallet size={26}/>
        </button>
      </nav>

      {/* Styles globaux */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; } 
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
    </div>
  );
}
