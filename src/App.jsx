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

// --- BIBLIOTHÈQUE D'EXERCICES ---
const STATIC_EXERCICES = [
  { id: 'p1', name: 'Développé Couché (Barre)', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', equipment: 'Barre & Banc', cat: 'Pectoraux' },
  { id: 'p2', name: 'Développé Couché (Haltères)', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', equipment: 'Haltères', cat: 'Pectoraux' },
  { id: 'd1', name: 'Tractions Pronation', img: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400', equipment: 'Barre fixe', cat: 'Dos' },
  { id: 'j1', name: 'Squat Arrière', img: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=400', equipment: 'Cage à squat', cat: 'Jambes' },
  { id: 'b1', name: 'Curl Biceps EZ', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', equipment: 'Barre EZ', cat: 'Bras' },
  { id: 'a1', name: 'Crunch Abdominaux', img: 'https://images.unsplash.com/photo-1571019613531-fbea97494436?w=400', equipment: 'Tapis', cat: 'Abdos' },
];

const CAT_DEPENSES = ['Nourriture', 'Loisirs', 'Transport', 'Santé', 'Shopping', 'Cadeaux', 'Autres'];
const CAT_ABONNEMENTS = ['Loyer', 'Assurance Maladie', 'Télécom', 'Streaming', 'Fitness', 'Autres'];
const CAT_REVENUS = ['Salaire', 'Bonus', 'Freelance', 'Cadeau', 'Remboursement', 'Autres'];

/**
 * Application LIFE Dashboard
 * Gère les finances, le sport, la nutrition et l'agenda.
 */
export default function App() {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('accueil');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  
  const [db, setDb] = useState(null);
  const [appId, setAppId] = useState('life-dashboard-suisse-v5');

  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [menus, setMenus] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [budgetGoal, setBudgetGoal] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- INITIALISATION FIREBASE ---
  useEffect(() => {
    const startApp = async () => {
      try {
        let config = null;

        // 1. Lecture des variables Vercel (Vite)
        try {
          if (typeof import.meta !== 'undefined' && import.meta.env) {
            const vConfig = import.meta.env.VITE_FIREBASE_CONFIG;
            const vId = import.meta.env.VITE_APP_ID;
            
            if (vConfig) {
              const cleanedConfig = vConfig.trim().replace(/^['"]|['"]$/g, '');
              config = JSON.parse(cleanedConfig);
            }
            if (vId) setAppId(vId);
          }
        } catch (e) {
          console.warn("Variables d'environnement non détectées ou mal formatées.");
        }

        // 2. Fallback pour l'aperçu local Gemini (Canvas)
        if (!config && typeof __firebase_config !== 'undefined') {
          config = JSON.parse(__firebase_config);
        }

        // 3. Vérification finale
        if (!config || !config.apiKey) {
          throw new Error("Configuration Firebase introuvable. Vérifiez VITE_FIREBASE_CONFIG sur Vercel.");
        }

        const firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        const firebaseAuth = getAuth(firebaseApp);
        const firebaseDb = getFirestore(firebaseApp);

        setDb(firebaseDb);

        onAuthStateChanged(firebaseAuth, (u) => {
          if (!u) {
            signInAnonymously(firebaseAuth).catch(err => setInitError("Erreur d'authentification : " + err.message));
          } else {
            setUser(u);
            setLoading(false);
          }
        });
      } catch (err) {
        setInitError(err.message);
        setLoading(false);
      }
    };
    startApp();
  }, []);

  // --- SYNCHRONISATION DES DONNÉES ---
  useEffect(() => {
    if (!user || !db) return;

    const collections = [
      { n: 'expenses', s: setExpenses },
      { n: 'subscriptions', s: setSubscriptions },
      { n: 'incomes', s: setIncomes },
      { n: 'workouts', s: setWorkouts },
      { n: 'menus', s: setMenus },
      { n: 'tasks', s: setTasks },
      { n: 'customExercises', s: setCustomExercises }
    ];

    const unsubs = collections.map(({ n, s }) => 
      onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, n)), 
      (snap) => s(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error(`Erreur synchro ${n}:`, err))
    );

    const unsubGoal = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budget'), (d) => {
      if(d.exists()) setBudgetGoal(d.data().monthlyGoal || 0);
    });

    return () => { unsubs.forEach(u => u()); unsubGoal(); };
  }, [user, db, appId]);

  // --- CALCULS STATISTIQUES ---
  const financeStats = useMemo(() => {
    const isCurrent = (d) => {
      if (!d) return false;
      const p = d.includes('.') ? d.split('.') : d.split('/');
      if (p.length < 3) return false;
      return parseInt(p[1]) - 1 === selectedMonth && parseInt(p[2]) === selectedYear;
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

    const catTotals = fExp.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + Number(c.amount);
      return acc;
    }, {});

    return { totalSub, totalExp, realBalance, goalRemaining, journal, catTotals };
  }, [expenses, incomes, subscriptions, selectedMonth, selectedYear, budgetGoal]);

  const fullLibrary = useMemo(() => [...STATIC_EXERCICES, ...customExercises], [customExercises]);

  // --- ACTIONS ---
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

  // --- RENDUS D'ÉTATS ---
  if (initError) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-red-100 max-w-md text-center">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-black text-slate-800 mb-2">Presque prêt !</h2>
        <p className="text-sm text-red-600 mb-6">{initError}</p>
        <div className="text-left bg-slate-50 p-4 rounded-2xl text-[10px] font-mono text-slate-400 mb-6 leading-relaxed">
          1. Sur Vercel, allez dans <strong>Settings {' > '} Env Variables</strong>.<br/>
          2. Vérifiez <strong>VITE_FIREBASE_CONFIG</strong>.<br/>
          3. Faites un nouveau <strong>Commit</strong> sur GitHub pour forcer le build.
        </div>
        <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold shadow-lg">Rafraîchir la page</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 font-sans text-center px-4">
      <div className="w-12 h-12 bg-indigo-600 rounded-[24px] animate-bounce shadow-2xl shadow-indigo-100"></div>
      <p className="font-black text-indigo-600 text-[10px] uppercase tracking-widest animate-pulse">Initialisation LIFE Dashboard</p>
    </div>
  );

  // --- VUES ---

  const ViewAccueil = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">LIFE.</h1>
          <p className="text-slate-500 font-medium text-sm">Bonjour 👋 Votre dashboard 🇨🇭</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Réel</p>
          <p className={`text-2xl font-black ${financeStats.realBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {financeStats.realBalance.toFixed(2)} CHF
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-indigo-200 text-xs font-black uppercase">Reste à dépenser</p>
            <h2 className="text-4xl font-black mt-1">
              {financeStats.goalRemaining.toFixed(2)} <span className="text-xl">CHF</span>
            </h2>
            {budgetGoal > 0 && (
              <div className="mt-3 bg-indigo-500/30 rounded-full h-1.5 w-full overflow-hidden">
                <div className="bg-white h-full transition-all duration-700" style={{ width: `${Math.min(100, (financeStats.totalExp / budgetGoal) * 100)}%` }} />
              </div>
            )}
            <p className="text-[10px] text-indigo-100 font-bold mt-2 opacity-80 uppercase tracking-wider">
              {budgetGoal > 0 ? `Objectif : ${budgetGoal} CHF` : "Fixez un objectif dans Finances"}
            </p>
          </div>
          <Wallet className="absolute -right-6 -bottom-6 opacity-10 w-32 h-32 rotate-12" />
        </div>
        
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Charges Fixes</p><h2 className="text-2xl font-black mt-1 text-slate-800">{financeStats.totalSub.toFixed(2)} CHF</h2></div>
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
            {subscriptions.map(s => <span key={s.id} className="bg-slate-50 px-3 py-1 rounded-full text-[9px] font-bold text-slate-500 whitespace-nowrap border border-slate-100">{s.name} (le {s.day})</span>)}
            {subscriptions.length === 0 && <span className="text-[10px] text-slate-300 italic">Aucun abonnement</span>}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><PieChart size={14}/> Top Dépenses</h3>
          <div className="space-y-4">
            {Object.entries(financeStats.catTotals).sort((a,b) => b[1]-a[1]).slice(0, 3).map(([cat, val]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs font-bold mb-1"><span>{cat}</span><span>{val.toFixed(2)} CHF</span></div>
                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full transition-all duration-1000" style={{width: `${(val/financeStats.totalExp)*100}%`}}></div></div>
              </div>
            ))}
            {Object.keys(financeStats.catTotals).length === 0 && <p className="text-xs italic text-slate-300 py-4 text-center">Aucune dépense ce mois.</p>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><GymIcon size={14}/> Dernier Training</h3>
           {workouts.length > 0 ? (
             <div className="text-center py-2">
               <p className="font-black text-slate-800">{workouts[workouts.length-1].sessionName}</p>
               <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{workouts[workouts.length-1].date}</p>
             </div>
           ) : <p className="text-xs italic text-slate-300 text-center py-4">Prêt pour une séance ?</p>}
        </div>
      </div>
    </div>
  );

  const ViewBudget = () => {
    const [view, setView] = useState('journal');
    const [form, setForm] = useState({ amount: '', label: '', cat: 'Nourriture', type: 'variable', day: '1' });

    const handleAdd = () => {
      if(!form.amount) return;
      const data = { amount: form.amount, name: form.label || form.cat, category: form.cat, date: new Date().toLocaleDateString('fr-CH') };
      if (form.type === 'fixed' || form.type === 'income') data.day = form.day;
      addItem(form.type === 'income' ? 'incomes' : (form.type === 'fixed' ? 'subscriptions' : 'expenses'), data);
      setForm({ amount: '', label: '', cat: 'Nourriture', type: 'variable', day: '1' });
      setView('journal');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center text-slate-800">
          <h2 className="text-2xl font-black">Mes Finances</h2>
          <select className="bg-white border-none rounded-xl text-[10px] font-black p-2 shadow-sm outline-none" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
            {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>

        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => setView('journal')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'journal' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Journal</button>
          <button onClick={() => setView('ajouter')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'ajouter' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Ajouter</button>
          <button onClick={() => setView('settings')} className={`p-2.5 rounded-xl transition-all ${view === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><Settings size={18}/></button>
        </div>

        {view === 'settings' && (
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[32px] text-slate-700 animate-in slide-in-from-right-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2"><Target size={16}/> Objectif Dépenses Variables</h3>
            <div className="flex gap-2">
              <input type="number" placeholder="Budget Max (ex: 800)" className="flex-1 p-4 rounded-2xl font-black text-lg outline-none focus:border-indigo-500 bg-white shadow-sm" value={budgetGoal || ''} onChange={e => updateBudgetGoal(e.target.value)} />
              <div className="bg-indigo-600 text-white p-4 rounded-2xl flex items-center justify-center font-black text-xs">CHF</div>
            </div>
          </div>
        )}

        {view === 'ajouter' ? (
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4 animate-in slide-in-from-bottom-6">
            <div className="flex gap-1 bg-slate-50 p-1 rounded-2xl">
              {[['variable', 'Dépense'], ['fixed', 'Fixe'], ['income', 'Revenu']].map(([id, label]) => (
                <button key={id} onClick={() => setForm({...form, type: id})} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${form.type === id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>{label}</button>
              ))}
            </div>
            <input type="number" placeholder="Montant CHF" className="w-full p-4 rounded-2xl border-2 border-slate-50 font-black text-xl outline-none focus:border-indigo-500" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            <select className="w-full p-4 rounded-2xl border-2 border-slate-50 font-bold outline-none" value={form.cat} onChange={e => setForm({...form, cat: e.target.value})}>
              {form.type === 'income' ? CAT_REVENUS.map(c => <option key={c} value={c}>{c}</option>) :
               form.type === 'fixed' ? CAT_ABONNEMENTS.map(c => <option key={c} value={c}>{c}</option>) :
               CAT_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" placeholder="Commentaire..." className="w-full p-4 rounded-2xl border-2 border-slate-50 outline-none" value={form.label} onChange={e => setForm({...form, label: e.target.value})} />
            <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm" onClick={handleAdd}>Valider l'entrée</button>
          </div>
        ) : view !== 'settings' && (
          <div className="space-y-3 pb-12">
            {financeStats.journal.map((item, idx) => (
              <div key={item.id || idx} className={`flex justify-between items-center p-5 rounded-[28px] border shadow-sm transition-all ${item.type === 'fixed' ? 'bg-slate-50/80 border-dashed border-slate-300' : 'bg-white border-slate-50'}`}>
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
                  <span className={`font-black ${item.type === 'income' ? 'text-green-600' : item.type === 'fixed' ? 'text-slate-500' : 'text-red-500'}`}>{item.type === 'income' ? '+' : '-'}{Number(item.amount).toFixed(2)}</span>
                  {!item.isPlanned && <button onClick={() => deleteItem(item.type === 'income' ? 'incomes' : 'expenses', item.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ViewSport = () => {
    const [view, setView] = useState('bibliotheque');
    const [selectedIds, setSelectedIds] = useState([]);
    const [exerciseDetails, setExerciseDetails] = useState({});

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-800">Sport Pro 💪</h2>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => setView('bibliotheque')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'bibliotheque' || view === 'configurer' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Bibliothèque</button>
          <button onClick={() => setView('historique')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'historique' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Historique</button>
        </div>

        {view === 'bibliotheque' && (
          <div className="grid grid-cols-2 gap-3 pb-24">
            {fullLibrary.map(ex => {
              const selected = selectedIds.includes(ex.id);
              return (
                <div key={ex.id} onClick={() => setSelectedIds(prev => selected ? prev.filter(i => i !== ex.id) : [...prev, ex.id])} className={`bg-white rounded-[32px] overflow-hidden border transition-all relative ${selected ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-50 shadow-sm'}`}>
                  <div className="h-32 relative">
                    <img src={ex.img} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white"><p className="text-[8px] font-black uppercase opacity-70 mb-0.5">{ex.equipment}</p><p className="text-xs font-black truncate">{ex.name}</p></div>
                  </div>
                  {selected && <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1.5 shadow-xl"><Check size={12} strokeWidth={4}/></div>}
                </div>
              );
            })}
            <button onClick={() => {
              const initial = {}; selectedIds.forEach(id => { initial[id] = { weight: '', reps: '12', sets: '4' }; });
              setExerciseDetails(initial); setView('configurer');
            }} disabled={selectedIds.length === 0} className="fixed bottom-28 left-4 right-4 md:static md:bottom-0 z-40 bg-indigo-600 text-white p-4 rounded-3xl font-black text-sm uppercase shadow-2xl disabled:opacity-50">Démarrer séance ({selectedIds.length})</button>
          </div>
        )}

        {view === 'configurer' && (
          <div className="space-y-4 pb-20 animate-in slide-in-from-right-8">
            {fullLibrary.filter(ex => selectedIds.includes(ex.id)).map(ex => (
              <div key={ex.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex gap-4 items-center"><img src={ex.img} className="w-12 h-12 rounded-xl object-cover" alt="" /><h4 className="font-black text-sm text-slate-800">{ex.name}</h4></div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" placeholder="Kg" className="p-3 bg-slate-50 rounded-xl text-center font-bold" value={exerciseDetails[ex.id]?.weight} onChange={e => setExerciseDetails({...exerciseDetails, [ex.id]: {...exerciseDetails[ex.id], weight: e.target.value}})} />
                  <input type="number" placeholder="Séries" className="p-3 bg-slate-50 rounded-xl text-center font-bold" value={exerciseDetails[ex.id]?.sets} onChange={e => setExerciseDetails({...exerciseDetails, [ex.id]: {...exerciseDetails[ex.id], sets: e.target.value}})} />
                  <input type="number" placeholder="Reps" className="p-3 bg-slate-50 rounded-xl text-center font-bold" value={exerciseDetails[ex.id]?.reps} onChange={e => setExerciseDetails({...exerciseDetails, [ex.id]: {...exerciseDetails[ex.id], reps: e.target.value}})} />
                </div>
              </div>
            ))}
            <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm shadow-xl" onClick={() => {
              const payload = fullLibrary.filter(ex => selectedIds.includes(ex.id)).map(ex => ({ ...ex, ...exerciseDetails[ex.id] }));
              addItem('workouts', { sessionName: 'Entraînement LIFE', date: new Date().toLocaleDateString('fr-CH'), exercises: payload });
              setSelectedIds([]); setView('historique');
            }}>Sauvegarder la séance</button>
          </div>
        )}

        {view === 'historique' && (
          <div className="space-y-4 pb-12 animate-in fade-in">
            {workouts.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)).map(session => (
              <div key={session.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm border-l-8 border-indigo-600">
                <div className="flex justify-between items-start mb-4"><div><h3 className="font-black text-slate-800">{session.sessionName}</h3><p className="text-[10px] text-slate-400 font-bold uppercase">{session.date}</p></div><button onClick={() => deleteItem('workouts', session.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></div>
                <div className="space-y-2">{session.exercises?.map((ex, idx) => (<div key={idx} className="flex justify-between items-center text-xs border-t border-slate-50 pt-2 text-slate-600"><span className="font-bold">{ex.name}</span><span>{ex.sets} × {ex.reps} {ex.weight && `(${ex.weight}kg)`}</span></div>))}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ViewNutrition = () => {
    const [name, setName] = useState('');
    const [img, setImg] = useState('');
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-800">Ma Nutrition 🍱</h2>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-3">
          <input type="text" placeholder="Nom du plat..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={name} onChange={e => setName(e.target.value)} />
          <input type="text" placeholder="Lien image (URL)..." className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs" value={img} onChange={e => setImg(e.target.value)} />
          <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm" onClick={() => { if(!name) return; addItem('menus', { name, image: img }); setName(''); setImg(''); }}>Ajouter au catalogue</button>
        </div>
        <div className="grid grid-cols-2 gap-4 pb-12">{menus.map(m => (<div key={m.id} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm"><img src={m.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} className="w-full h-40 object-cover" alt="" /><div className="p-4 flex justify-between items-center"><p className="text-sm font-black text-slate-800 truncate">{m.name}</p><button onClick={() => deleteItem('menus', m.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button></div></div>))}</div>
      </div>
    );
  };

  const ViewAgenda = () => {
    const [task, setTask] = useState('');
    const [energy, setEnergy] = useState('Moyenne');
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-800">Mon Agenda 📅</h2>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-2"><input type="text" placeholder="Action du jour..." className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={task} onChange={e => setTask(e.target.value)} /><button onClick={() => { if(!task) return; addItem('tasks', { title: task, energy, completed: false }); setTask(''); }} className="bg-indigo-600 text-white p-4 rounded-2xl"><Plus/></button></div>
          <div className="flex gap-2">{['Basse', 'Moyenne', 'Haute'].map(lvl => (<button key={lvl} onClick={() => setEnergy(lvl)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${energy === lvl ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Énergie {lvl}</button>))}</div>
        </div>
        <div className="space-y-3 pb-12">{tasks.map(t => (<div key={t.id} className={`flex items-center justify-between p-5 rounded-[28px] border transition-all ${t.completed ? 'opacity-40 grayscale bg-slate-50' : 'bg-white shadow-sm border-slate-50'}`}><div className="flex items-center gap-4"><button onClick={async () => { if(!user) return; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', t.id), { completed: !t.completed }); }}>{t.completed ? <CheckCircle2 className="text-green-500 w-7 h-7"/> : <div className="w-7 h-7 rounded-full border-2 border-slate-200"/>}</button><div><p className={`font-black text-slate-800 ${t.completed ? 'line-through text-slate-400' : ''}`}>{t.title}</p><span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Énergie {t.energy}</span></div></div><button onClick={() => deleteItem('tasks', t.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></div>))}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-0 md:pl-72 font-sans antialiased">
      {/* Sidebar Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col">
        <div className="text-3xl font-black mb-12 text-indigo-600 tracking-tighter flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">L</div> LIFE.
        </div>
        <nav className="space-y-2 flex-1">
          <SidebarItem active={activeTab === 'accueil'} onClick={() => setActiveTab('accueil')} icon={<LayoutDashboard size={20}/>} label="Accueil" />
          <SidebarItem active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} icon={<Wallet size={20}/>} label="Finances" />
          <SidebarItem active={activeTab === 'sport'} onClick={() => setActiveTab('sport')} icon={<GymIcon size={20}/>} label="Sport Pro" />
          <SidebarItem active={activeTab === 'alimentation'} onClick={() => setActiveTab('alimentation')} icon={<Utensils size={20}/>} label="Nutrition" />
          <SidebarItem active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} icon={<Calendar size={20}/>} label="Agenda" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-4 md:max-w-4xl md:p-12">
        {activeTab === 'accueil' && <ViewAccueil />}
        {activeTab === 'budget' && <ViewBudget />}
        {activeTab === 'sport' && <ViewSport />}
        {activeTab === 'alimentation' && <ViewNutrition />}
        {activeTab === 'agenda' && <ViewAgenda />}
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-4 md:hidden z-50 rounded-t-[40px] shadow-2xl">
        <MobileItem active={activeTab === 'accueil'} onClick={() => setActiveTab('accueil')} icon={<LayoutDashboard size={24}/>} />
        <MobileItem active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} icon={<Wallet size={24}/>} />
        <MobileItem active={activeTab === 'sport'} onClick={() => setActiveTab('sport')} icon={<GymIcon size={24}/>} />
        <MobileItem active={activeTab === 'alimentation'} onClick={() => setActiveTab('alimentation')} icon={<Utensils size={24}/>} />
        <MobileItem active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} icon={<Calendar size={24}/>} />
      </nav>
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
    </div>
  );
}

const SidebarItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-xl font-bold translate-x-1' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
    {icon} {label}
  </button>
);

const MobileItem = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-4 rounded-[24px] transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 -translate-y-4 scale-110' : 'text-slate-300'}`}>
    {icon}
  </button>
);
