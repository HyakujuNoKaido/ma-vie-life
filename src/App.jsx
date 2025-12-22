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

// --- Listes de Catégories ---
const CAT_DEPENSES = ['Nourriture', 'Loisirs', 'Transport', 'Santé', 'Shopping', 'Cadeaux', 'Autres'];
const CAT_ABONNEMENTS = ['Loyer', 'Assurance Maladie', 'Télécom', 'Streaming', 'Fitness', 'Autres'];
const CAT_REVENUS = ['Salaire', 'Bonus', 'Freelance', 'Cadeau', 'Remboursement', 'Autres'];

// --- Composants UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false }) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 shadow-md",
    secondary: "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-white",
    outline: "border-2 border-slate-100 text-slate-500 hover:border-indigo-500 hover:text-indigo-600",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-slate-400 hover:text-red-500 transition-colors"
  };
  return (
    <button disabled={disabled} onClick={onClick} className={`px-4 py-2.5 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('accueil');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Firebase instances
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [appId, setAppId] = useState('life-dashboard-suisse-v5');

  // Données
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [budgetGoal, setBudgetGoal] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 1. Initialisation sécurisée au chargement
  useEffect(() => {
    try {
      // Récupération prudente des variables d'environnement
      const configStr = import.meta.env?.VITE_FIREBASE_CONFIG;
      const customAppId = import.meta.env?.VITE_APP_ID;

      if (!configStr && typeof __firebase_config === 'undefined') {
        throw new Error("Configuration Firebase introuvable. Vérifiez VITE_FIREBASE_CONFIG.");
      }

      const config = JSON.parse(configStr || __firebase_config);
      
      if (!config.apiKey) {
        throw new Error("Clé API Firebase manquante dans la configuration.");
      }

      if (customAppId) setAppId(customAppId);

      const firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
      const firebaseAuth = getAuth(firebaseApp);
      const firebaseDb = getFirestore(firebaseApp);

      setAuth(firebaseAuth);
      setDb(firebaseDb);

      const unsubAuth = onAuthStateChanged(firebaseAuth, (u) => {
        if (!u) {
          signInAnonymously(firebaseAuth).catch(e => setError("Échec connexion anonyme: " + e.message));
        } else {
          setUser(u);
          setLoading(false);
        }
      });

      return () => unsubAuth();
    } catch (e) {
      console.error(e);
      setError(e.message);
      setLoading(false);
    }
  }, []);

  // 2. Synchronisation des données (seulement si Firebase est prêt)
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
      (err) => console.error(`Erreur sur ${n}:`, err))
    );

    const unsubGoal = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budget'), (d) => {
      if(d.exists()) setBudgetGoal(d.data().monthlyGoal || 0);
    });

    return () => { unsubs.forEach(u => u()); unsubGoal(); };
  }, [user, db, appId]);

  // 3. Logique Finance
  const stats = useMemo(() => {
    const parseDate = (d) => {
      if (!d) return null;
      const p = d.includes('.') ? d.split('.') : d.split('/');
      if (p.length < 3) return null;
      return { month: parseInt(p[1]) - 1, year: parseInt(p[2]) };
    };

    const isCurrent = (d) => {
      const p = parseDate(d);
      return p && p.month === selectedMonth && p.year === selectedYear;
    };

    const fInc = incomes.filter(i => isCurrent(i.date));
    const fExp = expenses.filter(e => isCurrent(e.date));
    
    const totalInc = fInc.reduce((a, c) => a + Number(c.amount), 0);
    const totalSub = subscriptions.reduce((a, c) => a + Number(c.amount), 0);
    const totalExp = fExp.reduce((a, c) => a + Number(c.amount), 0);
    
    const realBalance = totalInc - (totalSub + totalExp);
    const goalRemaining = budgetGoal > 0 ? budgetGoal - totalExp : realBalance;

    const journal = [
      ...fInc.map(i => ({ ...i, type: 'income' })),
      ...fExp.map(e => ({ ...e, type: 'expense' })),
      ...subscriptions.map(s => ({
        ...s, type: 'fixed', isPlanned: true,
        date: `${String(s.day || '01').padStart(2, '0')}.${String(selectedMonth + 1).padStart(2, '0')}.${selectedYear}`
      }))
    ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return { totalInc, totalSub, totalExp, realBalance, goalRemaining, journal };
  }, [expenses, incomes, subscriptions, selectedMonth, selectedYear, budgetGoal]);

  // Actions
  const addItem = async (col, data) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, col), { ...data, createdAt: Date.now() });
  };

  const deleteItem = async (col, id) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, col, id));
  };

  const updateBudgetGoal = async (val) => {
    if (!user || !db) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budget'), { monthlyGoal: Number(val) });
  };

  // --- RENDUS SPÉCIAUX ---

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <Card className="max-w-md border-red-200 bg-red-50 text-center">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-black text-red-700 mb-2">Erreur Fatale</h2>
        <p className="text-sm text-red-600 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} className="w-full">Réessayer</Button>
      </Card>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 font-sans">
      <div className="w-12 h-12 bg-indigo-600 rounded-[24px] animate-bounce shadow-2xl"></div>
      <p className="font-black text-indigo-600 text-[10px] uppercase tracking-widest animate-pulse">Chargement LIFE</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-0 md:pl-72 font-sans antialiased">
      {/* Sidebar Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col">
        <div className="text-3xl font-black text-indigo-600 tracking-tighter mb-12">LIFE.</div>
        <nav className="space-y-2 flex-1 text-slate-800">
          <button onClick={() => setActiveTab('accueil')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'accueil' ? 'bg-indigo-600 text-white shadow-xl font-bold' : 'text-slate-400 hover:text-slate-900'}`}><LayoutDashboard size={20}/> Accueil</button>
          <button onClick={() => setActiveTab('budget')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-xl font-bold' : 'text-slate-400 hover:text-slate-900'}`}><Wallet size={20}/> Finances</button>
        </nav>
      </aside>

      {/* Main View */}
      <main className="max-w-2xl mx-auto p-4 md:max-w-4xl md:p-12 text-slate-800">
        {activeTab === 'accueil' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div><h1 className="text-4xl font-black tracking-tighter text-slate-900">LIFE.</h1><p className="text-slate-500 font-medium text-sm italic">Mon tableau de bord 🇨🇭</p></div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Réel</p>
                <p className={`text-2xl font-black ${stats.realBalance >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>{stats.realBalance.toFixed(2)} CHF</p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-indigo-600 text-white border-none shadow-xl shadow-indigo-100 overflow-hidden relative">
                <div className="z-10 relative">
                  <p className="text-indigo-200 text-xs font-black uppercase">Reste à dépenser</p>
                  <h2 className="text-4xl font-black mt-1">{stats.goalRemaining.toFixed(2)} CHF</h2>
                  <p className="text-[10px] text-indigo-100 font-bold mt-2 opacity-80 uppercase">{budgetGoal > 0 ? `Objectif : ${budgetGoal} CHF` : "Fixez un objectif dans Finances"}</p>
                </div>
                <Wallet className="absolute -right-6 -bottom-6 opacity-10 w-32 h-32 rotate-12" />
              </Card>
              <Card className="border-slate-100 shadow-sm flex flex-col justify-between bg-white">
                <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Charges Fixes</p><h2 className="text-2xl font-black mt-1">{stats.totalSub.toFixed(2)} CHF</h2></div>
                <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
                  {subscriptions.length > 0 ? subscriptions.map(s => <span key={s.id} className="bg-slate-50 px-3 py-1 rounded-full text-[9px] font-bold text-slate-500 whitespace-nowrap border border-slate-100">{s.name} (le {s.day})</span>) : <p className="text-[10px] text-slate-300 italic">Aucune charge fixe</p>}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800">Finances</h2>
              <select className="bg-white border-none rounded-xl text-[10px] font-black p-2 shadow-sm outline-none" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>

            <Card className="bg-indigo-50 border-indigo-100 text-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 mb-2"><Target size={18}/><h3 className="text-xs font-black uppercase tracking-widest">Objectif Mensuel</h3></div>
              <div className="flex gap-2">
                <input type="number" placeholder="Budget Max (ex: 800)" className="flex-1 p-3 rounded-xl border-none font-black text-lg outline-none focus:ring-2 focus:ring-indigo-500" value={budgetGoal || ''} onChange={e => updateBudgetGoal(e.target.value)} />
                <div className="bg-indigo-600 text-white px-6 py-3 rounded-xl flex items-center font-black">CHF</div>
              </div>
            </Card>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-8">Journal & Prévisions</h3>
              <div className="flex gap-2 bg-white p-1.5 rounded-2xl mb-4 shadow-sm border border-slate-100">
                 <button onClick={() => setActiveTab('add_expense')} className="flex-1 py-2 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">Ajouter Dépense</button>
              </div>
              
              {stats.journal.map((item, idx) => (
                <div key={item.id || idx} className={`flex justify-between items-center p-5 rounded-[28px] border shadow-sm ${item.type === 'fixed' ? 'bg-slate-50/80 border-dashed border-slate-300' : 'bg-white border-slate-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'income' ? 'bg-green-100 text-green-600' : item.type === 'fixed' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}`}>
                      {item.type === 'income' ? <ArrowUpCircle size={20}/> : item.type === 'fixed' ? <Clock size={20}/> : <ArrowDownCircle size={20}/>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-800"><p className="font-black text-sm">{item.name}</p>{item.isPlanned && <span className="bg-indigo-100 text-indigo-700 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">Prévu</span>}</div>
                      <p className="text-[10px] text-slate-400 font-black uppercase">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-black ${item.type === 'income' ? 'text-green-600' : item.type === 'fixed' ? 'text-slate-500' : 'text-red-600'}`}>{item.type === 'income' ? '+' : '-'}{Number(item.amount).toFixed(2)}</span>
                    {!item.isPlanned && <Button variant="ghost" onClick={() => deleteItem(item.type === 'income' ? 'incomes' : 'expenses', item.id)}><Trash2 size={16}/></Button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-4 md:hidden z-50 rounded-t-[40px] shadow-2xl">
        <button onClick={() => setActiveTab('accueil')} className={`p-4 rounded-[24px] transition-all ${activeTab === 'accueil' ? 'bg-indigo-600 text-white shadow-2xl -translate-y-4 scale-110' : 'text-slate-300'}`}><LayoutDashboard size={24}/></button>
        <button onClick={() => setActiveTab('budget')} className={`p-4 rounded-[24px] transition-all ${activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-2xl -translate-y-4 scale-110' : 'text-slate-300'}`}><Wallet size={24}/></button>
      </nav>
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
    </div>
  );
}
