import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wallet, Dumbbell as GymIcon, Utensils, Calendar, 
  Plus, Trash2, CheckCircle2, PieChart, CreditCard, ArrowUpCircle, 
  ArrowDownCircle, Clock, Settings, AlertCircle, ChevronRight, Check, Search, PlusCircle, ArrowLeft
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, collection, doc, addDoc, onSnapshot, query, 
  deleteDoc, updateDoc, setDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';

/**
 * LIFE Dashboard - Version 6.5
 * Correction de l'erreur ReactSharedInternals pour l'environnement d'aperçu.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('accueil');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [db, setDb] = useState(null);
  const [appId, setAppId] = useState('life-dashboard-suisse-v5');

  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [budgetGoal, setBudgetGoal] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const initFirebase = async () => {
      // Sécurité : Si après 10 secondes rien ne se passe, on affiche une aide
      const timeout = setTimeout(() => {
        if (loading && !error) {
          setError("La connexion prend trop de temps. Vérifiez que l'authentification 'Anonyme' est activée dans votre console Firebase.");
        }
      }, 10000);

      try {
        let config = null;
        // Tentative de récupération de la config (Vercel ou local)
        const rawConfig = import.meta.env?.VITE_FIREBASE_CONFIG;
        
        if (rawConfig) {
          const cleaned = rawConfig.trim().replace(/^['"]|['"]$/g, '');
          config = JSON.parse(cleaned);
        } else if (typeof __firebase_config !== 'undefined') {
          config = JSON.parse(__firebase_config);
        }

        if (!config || !config.apiKey) {
          throw new Error("Configuration Firebase introuvable. Assurez-vous d'avoir ajouté VITE_FIREBASE_CONFIG dans Vercel.");
        }

        const appInstance = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        const authInstance = getAuth(appInstance);
        const firestoreInstance = getFirestore(appInstance);
        setDb(firestoreInstance);

        onAuthStateChanged(authInstance, async (u) => {
          clearTimeout(timeout);
          if (!u) {
            try {
              await signInAnonymously(authInstance);
            } catch (e) {
              setError("Accès refusé par Firebase. Activez le mode 'Anonyme' dans la console Firebase.");
              setLoading(false);
            }
          } else {
            setUser(u);
            setLoading(false);
          }
        });
      } catch (err) {
        clearTimeout(timeout);
        setError(err.message);
        setLoading(false);
      }
    };
    initFirebase();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'expenses'));
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Erreur Firestore:", err);
    });
    return () => unsub();
  }, [user, db, appId]);

  const stats = useMemo(() => {
    const isCurrent = (d) => {
      if (!d) return false;
      const p = d.includes('.') ? d.split('.') : d.split('/');
      return parseInt(p[1]) - 1 === selectedMonth && parseInt(p[2]) === selectedYear;
    };
    const fExp = expenses.filter(e => isCurrent(e.date));
    const totalExp = fExp.reduce((a, c) => a + Number(c.amount), 0);
    const totalSub = subscriptions.reduce((a, c) => a + Number(c.amount), 0);
    const totalInc = incomes.filter(i => isCurrent(i.date)).reduce((a, c) => a + Number(c.amount), 0);
    const realBalance = totalInc - (totalSub + totalExp);
    const goalRemaining = budgetGoal > 0 ? budgetGoal - totalExp : realBalance;

    return { totalSub, totalExp, realBalance, goalRemaining };
  }, [expenses, incomes, subscriptions, selectedMonth, selectedYear, budgetGoal]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center font-sans">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-red-100 max-w-md">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-black text-slate-800 mb-2">Problème de connexion</h2>
        <p className="text-sm text-red-600 mb-6 leading-relaxed">{error}</p>
        <div className="text-[10px] text-slate-400 bg-slate-50 p-4 rounded-2xl text-left mb-6 font-mono">
          1. Vérifiez Firebase Auth (Anonyme)<br/>
          2. Vérifiez VITE_FIREBASE_CONFIG sur Vercel<br/>
          3. Faites un REDEPLOY sur Vercel
        </div>
        <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Réessayer</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 font-sans text-center px-6">
      <div className="w-16 h-16 bg-indigo-600 rounded-[30px] animate-bounce shadow-2xl shadow-indigo-100 flex items-center justify-center text-white text-2xl font-black">L</div>
      <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest animate-pulse">Connexion à votre espace LIFE...</p>
      <p className="text-slate-400 text-[9px] max-w-[200px]">Si ce chargement dure trop longtemps, vérifiez vos paramètres d'authentification Firebase.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-0 md:pl-72 font-sans antialiased">
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col">
        <div className="text-3xl font-black mb-12 text-indigo-600 tracking-tighter flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">L</div> LIFE.
        </div>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('accueil')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'accueil' ? 'bg-indigo-600 text-white shadow-xl font-bold' : 'text-slate-400 hover:text-indigo-600'}`}><LayoutDashboard size={20}/> Accueil</button>
          <button onClick={() => setActiveTab('budget')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-xl font-bold' : 'text-slate-400 hover:text-indigo-600'}`}><Wallet size={20}/> Finances</button>
        </nav>
      </aside>

      <main className="max-w-2xl mx-auto p-4 md:max-w-4xl md:p-12">
        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter">Dashboard</h1>
          <p className="text-slate-500 font-medium text-sm">Bonjour 👋 Votre application est prête.</p>
        </header>

        <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
           <div className="relative z-10">
             <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">Statut</p>
             <h2 className="text-4xl font-black mt-1">Connecté au Cloud 🇨🇭</h2>
           </div>
           <Wallet className="absolute -right-6 -bottom-6 opacity-10 w-32 h-32 rotate-12" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Solde Réel</p>
             <p className={`text-2xl font-black ${stats.realBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stats.realBalance.toFixed(2)} CHF</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Dépenses</p>
             <p className="text-2xl font-black text-slate-800">{stats.totalExp.toFixed(2)} CHF</p>
           </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-4 md:hidden z-50 rounded-t-[40px] shadow-2xl">
        <button onClick={() => setActiveTab('accueil')} className={`p-4 rounded-[24px] transition-all ${activeTab === 'accueil' ? 'bg-indigo-600 text-white shadow-xl -translate-y-4 scale-110' : 'text-slate-300'}`}><LayoutDashboard size={24}/></button>
        <button onClick={() => setActiveTab('budget')} className={`p-4 rounded-[24px] transition-all ${activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-xl -translate-y-4 scale-110' : 'text-slate-300'}`}><Wallet size={24}/></button>
      </nav>
    </div>
  );
}
