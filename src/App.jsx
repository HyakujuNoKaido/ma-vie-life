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
      try {
        let config = null;
        const rawConfig = import.meta.env?.VITE_FIREBASE_CONFIG;
        
        if (rawConfig) {
          const cleaned = rawConfig.trim().replace(/^['"]|['"]$/g, '');
          config = JSON.parse(cleaned);
        } else if (typeof __firebase_config !== 'undefined') {
          config = JSON.parse(__firebase_config);
        }

        if (!config || !config.apiKey) {
          throw new Error("Config Firebase manquante sur Vercel.");
        }

        const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        setDb(firestore);

        onAuthStateChanged(auth, async (u) => {
          if (!u) {
            try {
              await signInAnonymously(auth);
            } catch (e) {
              setError("Vérifiez que l'Auth Anonyme est activée sur Firebase.");
              setLoading(false);
            }
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
    initFirebase();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'expenses'));
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user, db, appId]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-red-100 max-w-md">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-black text-slate-800 mb-2">Erreur</h2>
        <p className="text-sm text-red-600 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs">Réessayer</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-12 h-12 bg-indigo-600 rounded-[20px] animate-bounce shadow-xl"></div>
      <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Connexion Firebase...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-0 md:pl-72 font-sans antialiased">
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col">
        <div className="text-3xl font-black mb-12 text-indigo-600 tracking-tighter">LIFE.</div>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('accueil')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'accueil' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}><LayoutDashboard size={20}/> Accueil</button>
          <button onClick={() => setActiveTab('budget')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}><Wallet size={20}/> Finances</button>
        </nav>
      </aside>

      <main className="max-w-2xl mx-auto p-4 md:max-w-4xl md:p-12">
        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter">Dashboard</h1>
          <p className="text-slate-500 font-medium text-sm">Bonjour 👋 Bienvenue dans votre app</p>
        </header>

        <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
           <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">Statut</p>
           <h2 className="text-4xl font-black mt-1">Application Connectée 🇨🇭</h2>
           <Wallet className="absolute -right-6 -bottom-6 opacity-10 w-32 h-32 rotate-12" />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-4 md:hidden z-50 rounded-t-[40px] shadow-2xl">
        <button onClick={() => setActiveTab('accueil')} className={`p-4 rounded-[24px] transition-all ${activeTab === 'accueil' ? 'bg-indigo-600 text-white shadow-xl -translate-y-4 scale-110' : 'text-slate-300'}`}><LayoutDashboard size={24}/></button>
        <button onClick={() => setActiveTab('budget')} className={`p-4 rounded-[24px] transition-all ${activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-xl -translate-y-4 scale-110' : 'text-slate-300'}`}><Wallet size={24}/></button>
      </nav>
    </div>
  );
}
