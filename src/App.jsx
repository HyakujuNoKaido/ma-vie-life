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

/**
 * LIFE Dashboard - Version 6.1
 * Correction pour l'affichage dans le Canvas.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('accueil');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [db, setDb] = useState(null);
  const [appId, setAppId] = useState('life-dashboard-suisse-v5');

  // États des données
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [budgetGoal, setBudgetGoal] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- 1. INITIALISATION SÉCURISÉE ---
  useEffect(() => {
    const init = async () => {
      try {
        let config = null;

        // Lecture des variables Vercel (si disponibles)
        const rawConfig = import.meta.env?.VITE_FIREBASE_CONFIG;
        const customId = import.meta.env?.VITE_APP_ID;

        if (customId) setAppId(customId);

        if (rawConfig) {
          try {
            const cleaned = rawConfig.trim().replace(/^['"]|['"]$/g, '');
            config = JSON.parse(cleaned);
          } catch (e) {
            throw new Error("JSON invalide dans VITE_FIREBASE_CONFIG sur Vercel.");
          }
        } 
        // Fallback pour l'aperçu local Canvas (Gemini)
        else if (typeof __firebase_config !== 'undefined') {
          config = JSON.parse(__firebase_config);
        }

        if (!config || !config.apiKey) {
          throw new Error("Config Firebase manquante. L'app attend les clés VITE_FIREBASE_CONFIG sur Vercel.");
        }

        const firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        const firebaseAuth = getAuth(firebaseApp);
        const firebaseDb = getFirestore(firebaseApp);

        setDb(firebaseDb);

        onAuthStateChanged(firebaseAuth, (u) => {
          if (!u) {
            signInAnonymously(firebaseAuth).catch(err => setError("Auth Error: " + err.message));
          } else {
            setUser(u);
            setLoading(false);
          }
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    init();
  }, []);

  // --- 2. SYNCHRONISATION ---
  useEffect(() => {
    if (!user || !db) return;
    const collections = [
      { n: 'expenses', s: setExpenses },
      { n: 'subscriptions', s: setSubscriptions },
      { n: 'incomes', s: setIncomes },
      { n: 'workouts', s: setWorkouts }
    ];
    const unsubs = collections.map(({ n, s }) => 
      onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, n)), 
      (snap) => s(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error(err))
    );
    const unsubGoal = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budget'), (d) => {
      if(d.exists()) setBudgetGoal(d.data().monthlyGoal || 0);
    });
    return () => { unsubs.forEach(u => u()); unsubGoal(); };
  }, [user, db, appId]);

  // --- 3. CALCULS ---
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

    const journal = [
      ...incomes.filter(i => isCurrent(i.date)).map(i => ({ ...i, type: 'income' })),
      ...fExp.map(e => ({ ...e, type: 'expense' })),
      ...subscriptions.map(s => ({
        ...s, type: 'fixed', isPlanned: true,
        date: `${String(s.day || '01').padStart(2, '0')}.${String(selectedMonth + 1).padStart(2, '0')}.${selectedYear}`
      }))
    ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return { totalSub, totalExp, realBalance, goalRemaining, journal };
  }, [expenses, incomes, subscriptions, selectedMonth, selectedYear, budgetGoal]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-red-100 max-w-md">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-black text-slate-800 mb-2">Erreur Détectée</h2>
        <p className="text-sm text-red-600 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs">Réessayer</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 font-sans">
      <div className="w-16 h-16 bg-indigo-600 rounded-[32px] animate-bounce flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-100">L</div>
      <p className="font-black text-indigo-600 text-[10px] uppercase tracking-widest animate-pulse">Chargement LIFE Dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-0 md:pl-72 font-sans antialiased">
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col shadow-sm">
        <div className="text-3xl font-black mb-12 text-indigo-600 tracking-tighter flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">L</div> LIFE.
        </div>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('accueil')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'accueil' ? 'bg-indigo-600 text-white shadow-xl font-bold' : 'text-slate-400 hover:text-slate-900'}`}><LayoutDashboard size={20}/> Accueil</button>
          <button onClick={() => setActiveTab('budget')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-xl font-bold' : 'text-slate-400 hover:text-slate-900'}`}><Wallet size={20}/> Finances</button>
        </nav>
      </aside>

      <main className="max-w-2xl mx-auto p-4 md:max-w-4xl md:p-12 text-slate-800">
        <header className="flex justify-between items-end mb-8">
          <div><h1 className="text-4xl font-black tracking-tighter">Dashboard</h1><p className="text-slate-500 font-medium text-sm">Bonjour 👋 État des comptes</p></div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Réel</p>
             <p className={`text-2xl font-black ${stats.realBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stats.realBalance.toFixed(2)} CHF</p>
          </div>
        </header>

        {activeTab === 'accueil' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
               <div className="relative z-10">
                 <p className="text-indigo-200 text-xs font-black uppercase">Reste à dépenser</p>
                 <h2 className="text-4xl font-black mt-1">{stats.goalRemaining.toFixed(2)} <span className="text-lg">CHF</span></h2>
                 <p className="text-[10px] text-indigo-100 font-bold mt-2 opacity-80 uppercase tracking-wider">{budgetGoal > 0 ? `Objectif : ${budgetGoal} CHF` : "Fixez un objectif dans Finances"}</p>
               </div>
               <Wallet className="absolute -right-6 -bottom-6 opacity-10 w-32 h-32 rotate-12" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
                <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Charges Fixes</p><h2 className="text-2xl font-black mt-1 text-slate-800">{stats.totalSub.toFixed(2)} CHF</h2></div>
                <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
                  {subscriptions.map(s => <span key={s.id} className="bg-slate-50 px-3 py-1 rounded-full text-[9px] font-bold text-slate-500 whitespace-nowrap border border-slate-100">{s.name} (le {s.day})</span>)}
                </div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Dépenses ce mois</p>
                <h2 className="text-2xl font-black mt-1 text-slate-800">{stats.totalExp.toFixed(2)} CHF</h2>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-12">
            {stats.journal.map((item, idx) => (
              <div key={item.id || idx} className={`flex justify-between items-center p-5 rounded-[28px] border shadow-sm transition-all ${item.type === 'fixed' ? 'bg-slate-50/80 border-dashed border-slate-300' : 'bg-white border-slate-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'income' ? 'bg-green-100 text-green-600' : item.type === 'fixed' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}`}>
                    {item.type === 'income' ? <ArrowUpCircle size={20}/> : item.type === 'fixed' ? <Clock size={20}/> : <ArrowDownCircle size={20}/>}
                  </div>
                  <div><p className="font-black text-sm">{item.name}</p><p className="text-[10px] text-slate-400 font-black uppercase">{item.date}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-black ${item.type === 'income' ? 'text-green-600' : item.type === 'fixed' ? 'text-slate-500' : 'text-red-500'}`}>{item.type === 'income' ? '+' : '-'}{Number(item.amount).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 rounded-t-[40px] shadow-2xl">
        <button onClick={() => setActiveTab('accueil')} className={`p-4 rounded-[24px] transition-all ${activeTab === 'accueil' ? 'bg-indigo-600 text-white shadow-2xl -translate-y-4 scale-110' : 'text-slate-300'}`}><LayoutDashboard size={24}/></button>
        <button onClick={() => setActiveTab('budget')} className={`p-4 rounded-[24px] transition-all ${activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-2xl -translate-y-4 scale-110' : 'text-slate-300'}`}><Wallet size={24}/></button>
      </nav>
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
    </div>
  );
}
