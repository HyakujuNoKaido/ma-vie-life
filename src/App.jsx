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

// --- GESTION SÉCURISÉE DE LA CONFIGURATION (POUR ÉVITER L'ÉCRAN BLANC) ---
let firebaseConfig = null;
let appId = 'life-dashboard-suisse-v5';
let initError = null;

try {
  // Détection sécurisée des variables d'environnement Vite
  const configRaw = import.meta.env?.VITE_FIREBASE_CONFIG;
  const idRaw = import.meta.env?.VITE_APP_ID;

  if (configRaw) {
    firebaseConfig = JSON.parse(configRaw);
  } else {
    // Si on est dans l'aperçu Gemini, on utilise les variables globales
    if (typeof __firebase_config !== 'undefined') {
      firebaseConfig = JSON.parse(__firebase_config);
    }
  }
  
  if (idRaw) appId = idRaw;

  if (!firebaseConfig || !firebaseConfig.apiKey) {
    initError = "Configuration Firebase manquante. Vérifiez VITE_FIREBASE_CONFIG sur Vercel.";
  }
} catch (e) {
  initError = "Erreur de lecture de la config : " + e.message;
}

// Initialisation sécurisée
let app, auth, db;
if (!initError) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    initError = "Erreur d'initialisation Firebase : " + e.message;
  }
}

// --- Données Statiques Sport ---
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
const CAT_REVENUS = ['Salaire', 'Bonus', 'Freelance', 'Cadeau', 'Autres'];

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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // États des données
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [menus, setMenus] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [budgetGoal, setBudgetGoal] = useState(0);

  // Écran d'erreur si la config est absente (Évite l'écran blanc)
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <Card className="max-w-md border-red-200 bg-red-50">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-black text-red-700 mb-2">Erreur de Configuration</h2>
          <p className="text-sm text-red-600 mb-6">{initError}</p>
          <div className="text-left bg-white p-4 rounded-xl text-[10px] font-mono text-slate-500 break-all">
            Key: VITE_FIREBASE_CONFIG <br/>
            Value: {"{...}"}
          </div>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) {
        signInAnonymously(auth).catch(err => console.error("Auth Error", err));
      } else {
        setUser(u);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const collections = [
      { n: 'expenses', s: setExpenses },
      { n: 'subscriptions', s: setSubscriptions },
      { n: 'incomes', s: setIncomes },
      { n: 'workouts', s: setWorkouts },
      { n: 'menus', s: setMenus },
      { n: 'tasks', s: setTasks },
      { n: 'customExercises', s: setCustomExercises }
    ];
    const unsubscribes = collections.map(({ n, s }) => 
      onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, n)), 
      (snap) => s(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error(err))
    );
    const unsubGoal = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budget'), (d) => {
      if(d.exists()) setBudgetGoal(d.data().monthlyGoal || 0);
    });
    return () => { unsubscribes.forEach(u => u()); unsubGoal(); };
  }, [user]);

  const addItem = async (col, data) => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, col), { ...data, createdAt: Date.now() });
  };

  const deleteItem = async (col, id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, col, id));
  };

  const updateBudgetGoal = async (val) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'budget'), { monthlyGoal: Number(val) });
  };

  // --- LOGIQUE FINANCIÈRE AVANCÉE ---
  const financeStats = useMemo(() => {
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.includes('.') ? dateStr.split('.') : dateStr.split('/');
      if (parts.length === 3) return { day: parseInt(parts[0]), month: parseInt(parts[1]) - 1, year: parseInt(parts[2]) };
      return null;
    };

    const isCurrentMonth = (dStr) => {
      const p = parseDate(dStr);
      return p && p.month === selectedMonth && p.year === selectedYear;
    };
    
    const fIncomes = incomes.filter(i => isCurrentMonth(i.date));
    const fExpenses = expenses.filter(e => isCurrentMonth(e.date));
    
    const totalInc = fIncomes.reduce((acc, c) => acc + Number(c.amount), 0);
    const totalSubs = subscriptions.reduce((acc, c) => acc + Number(c.amount), 0);
    const totalExp = fExpenses.reduce((acc, c) => acc + Number(c.amount), 0);
    
    // Balance réelle
    const realBalance = totalInc - (totalSubs + totalExp);
    
    // Reste à dépenser = Objectif Budget - Dépenses Variables effectuées
    const goalRemaining = budgetGoal > 0 ? budgetGoal - totalExp : realBalance;
    
    const journalEntries = [
      ...fIncomes.map(i => ({ ...i, type: 'income' })),
      ...fExpenses.map(e => ({ ...e, type: 'expense' })),
      // Injection des abonnements fixes en "Prévu"
      ...subscriptions.map(s => ({
        ...s, 
        type: 'fixed', 
        isPlanned: true,
        date: `${String(s.day || '01').padStart(2, '0')}.${String(selectedMonth + 1).padStart(2, '0')}.${selectedYear}`
      }))
    ].sort((a, b) => b.createdAt - a.createdAt);
    
    const catTotals = fExpenses.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + Number(c.amount);
      return acc;
    }, {});

    return { totalInc, totalSubs, totalExp, realBalance, goalRemaining, journalEntries, catTotals };
  }, [expenses, incomes, subscriptions, selectedMonth, selectedYear, budgetGoal]);

  const fullLibrary = useMemo(() => [...STATIC_EXERCICES, ...customExercises], [customExercises]);

  // --- COMPOSANTS DE VUE ---

  const ViewAccueil = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">LIFE.</h1>
          <p className="text-slate-500 font-medium text-sm">Bonjour 👋 Votre dashboard 🇨🇭</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Réelle</p>
          <p className={`text-2xl font-black ${financeStats.realBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {financeStats.realBalance.toFixed(2)} CHF
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-indigo-600 text-white border-none shadow-xl shadow-indigo-100 overflow-hidden relative">
          <div className="z-10 relative">
            <p className="text-indigo-200 text-xs font-black uppercase tracking-wider">Reste à dépenser</p>
            <h2 className="text-4xl font-black mt-1">
              {financeStats.goalRemaining.toFixed(2)} <span className="text-xl">CHF</span>
            </h2>
            {budgetGoal > 0 && (
              <div className="mt-3 bg-indigo-500/30 rounded-full h-1.5 w-full overflow-hidden">
                <div className="bg-white h-full transition-all duration-700" style={{ width: `${Math.min(100, (financeStats.totalExp / budgetGoal) * 100)}%` }} />
              </div>
            )}
            <p className="text-[10px] text-indigo-100 font-bold mt-2 opacity-80 uppercase tracking-wider">
              {budgetGoal > 0 ? `Objectif : ${budgetGoal} CHF` : "Définissez un objectif dans Finances"}
            </p>
          </div>
          <Wallet className="absolute -right-6 -bottom-6 opacity-10 w-32 h-32 rotate-12" />
        </Card>
        
        <Card className="flex flex-col justify-between border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Charges Fixes ce mois</p>
              <h2 className="text-2xl font-black mt-1 text-slate-800">{financeStats.totalSubs.toFixed(2)} CHF</h2>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400"><CreditCard size={20} /></div>
          </div>
          <div className="mt-4 space-y-1 text-slate-600">
             {subscriptions.slice(0, 2).map(s => (
               <div key={s.id} className="flex justify-between text-[10px] font-bold">
                 <span>{s.name} (prévu le {s.day || '1'})</span>
                 <span>{Number(s.amount).toFixed(2)}</span>
               </div>
             ))}
             {subscriptions.length > 2 && <p className="text-[9px] text-indigo-600 font-black uppercase mt-1">+{subscriptions.length - 2} autres</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><PieChart size={14}/> Dépenses Variables</h3>
          <div className="space-y-4">
            {Object.entries(financeStats.catTotals).sort((a,b) => b[1]-a[1]).slice(0, 3).map(([cat, val]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs font-bold mb-1"><span>{cat}</span><span>{val.toFixed(2)} CHF</span></div>
                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full transition-all duration-1000" style={{width: `${(val/financeStats.totalExp)*100}%`}}></div></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><GymIcon size={14}/> Sport</h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             {workouts.length > 0 ? (
               <div className="text-center">
                 <p className="font-black text-sm text-slate-800">{workouts[workouts.length-1].sessionName}</p>
                 <p className="text-[10px] text-slate-400 uppercase mt-1">{workouts[workouts.length-1].date}</p>
               </div>
             ) : <p className="text-xs italic text-slate-400 text-center py-2">Aucun training enregistré.</p>}
          </div>
        </Card>
      </div>
    </div>
  );

  const ViewBudget = () => {
    const [view, setView] = useState('journal');
    const [form, setForm] = useState({ amount: '', label: '', cat: 'Nourriture', type: 'variable', day: '1' });
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    useEffect(() => {
      if (form.type === 'income') setForm(f => ({ ...f, cat: 'Salaire' }));
      else if (form.type === 'fixed') setForm(f => ({ ...f, cat: 'Loyer' }));
      else setForm(f => ({ ...f, cat: 'Nourriture' }));
    }, [form.type]);

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
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>

        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => setView('journal')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'journal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400'}`}>Journal</button>
          <button onClick={() => setView('ajouter')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'ajouter' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Ajouter</button>
          <button onClick={() => setView('settings')} className={`p-2.5 rounded-xl transition-all ${view === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><Settings size={18}/></button>
        </div>

        {view === 'settings' && (
          <Card className="animate-in slide-in-from-right-4 border-indigo-100 bg-indigo-50/30 text-slate-700">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2"><Target size={16}/> Objectif Dépenses Variables</h3>
            <div className="flex gap-2">
              <input type="number" placeholder="Budget Max (ex: 800)" className="flex-1 p-4 rounded-2xl font-black text-lg outline-none focus:border-indigo-500 bg-white" value={budgetGoal || ''} onChange={e => updateBudgetGoal(e.target.value)} />
              <div className="bg-indigo-600 text-white p-4 rounded-2xl flex items-center justify-center font-black text-xs">CHF</div>
            </div>
          </Card>
        )}

        {view === 'ajouter' ? (
          <Card className="animate-in slide-in-from-bottom-6">
            <div className="space-y-4 text-slate-700">
              <div className="flex gap-1 bg-slate-50 p-1 rounded-2xl">
                {[['variable', 'Dépense'], ['fixed', 'Fixe'], ['income', 'Revenu']].map(([id, label]) => (
                  <button key={id} onClick={() => setForm({...form, type: id})} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${form.type === id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>{label}</button>
                ))}
              </div>
              <input type="number" placeholder="Montant CHF" className="w-full p-4 rounded-2xl border-2 border-slate-50 font-black text-xl outline-none focus:border-indigo-500" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              {(form.type === 'fixed' || form.type === 'income') && (
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400">Jour de paiement :</span>
                  <input type="number" min="1" max="31" className="bg-transparent font-black outline-none w-10 text-center text-indigo-600" value={form.day} onChange={e => setForm({...form, day: e.target.value})} />
                </div>
              )}
              <select className="w-full p-4 rounded-2xl border-2 border-slate-50 font-bold outline-none" value={form.cat} onChange={e => setForm({...form, cat: e.target.value})}>
                {form.type === 'income' ? CAT_REVENUS.map(c => <option key={c} value={c}>{c}</option>) :
                 form.type === 'fixed' ? CAT_ABONNEMENTS.map(c => <option key={c} value={c}>{c}</option>) :
                 CAT_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="text" placeholder="Commentaire..." className="w-full p-4 rounded-2xl border-2 border-slate-50 outline-none" value={form.label} onChange={e => setForm({...form, label: e.target.value})} />
              <Button className="w-full py-4 text-sm font-black uppercase" onClick={handleAdd}>Enregistrer</Button>
            </div>
          </Card>
        ) : view !== 'settings' && (
          <div className="space-y-3">
            {financeStats.journalEntries.map((item, idx) => (
              <div key={item.id || idx} className={`flex justify-between items-center p-5 rounded-[28px] border shadow-sm transition-all ${item.type === 'fixed' ? 'bg-slate-50/80 border-dashed border-slate-300' : 'bg-white border-slate-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'income' ? 'bg-green-50 text-green-600' : item.type === 'fixed' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}`}>
                    {item.type === 'income' ? <ArrowUpCircle size={20}/> : item.type === 'fixed' ? <Clock size={20}/> : <ArrowDownCircle size={20}/>}
                  </div>
                  <div className="text-slate-800">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm">{item.name}</p>
                      {item.isPlanned && <span className="bg-indigo-100 text-indigo-700 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">Prévu</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase">{item.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-black ${item.type === 'income' ? 'text-green-600' : item.type === 'fixed' ? 'text-slate-500' : 'text-red-500'}`}>
                    {item.type === 'income' ? '+' : '-'}{Number(item.amount).toFixed(2)}
                  </span>
                  {!item.isPlanned && <Button variant="ghost" onClick={() => deleteItem(item.type === 'income' ? 'incomes' : 'expenses', item.id)}><Trash2 size={16}/></Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans"><div className="w-12 h-12 bg-indigo-600 rounded-3xl animate-bounce"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-0 md:pl-72 font-sans antialiased">
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col">
        <div className="text-3xl font-black mb-12 text-indigo-600 tracking-tighter">LIFE.</div>
        <nav className="space-y-2 flex-1">
          <SidebarItem active={activeTab === 'accueil'} onClick={() => setActiveTab('accueil')} icon={<LayoutDashboard size={20}/>} label="Accueil" />
          <SidebarItem active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} icon={<Wallet size={20}/>} label="Finances" />
          <SidebarItem active={activeTab === 'sport'} onClick={() => setActiveTab('sport')} icon={<GymIcon size={20}/>} label="Sport Pro" />
          <SidebarItem active={activeTab === 'alimentation'} onClick={() => setActiveTab('alimentation')} icon={<Utensils size={20}/>} label="Nutrition" />
          <SidebarItem active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} icon={<Calendar size={20}/>} label="Agenda" />
        </nav>
      </aside>
      <main className="max-w-2xl mx-auto p-4 md:max-w-4xl md:p-12">
        {activeTab === 'accueil' && <ViewAccueil />}
        {activeTab === 'budget' && <ViewBudget />}
        {activeTab === 'sport' && <div className="p-10 text-center italic text-slate-400 font-bold">Sport Pro en cours...</div>}
        {activeTab === 'alimentation' && <div className="p-10 text-center italic text-slate-400 font-bold">Ma Nutrition</div>}
        {activeTab === 'agenda' && <div className="p-10 text-center italic text-slate-400 font-bold">Mon Agenda</div>}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-4 md:hidden z-50 rounded-t-[40px] shadow-2xl">
        <MobileItem active={activeTab === 'accueil'} onClick={() => setActiveTab('accueil')} icon={<LayoutDashboard size={24}/>} />
        <MobileItem active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} icon={<Wallet size={24}/>} />
        <MobileItem active={activeTab === 'sport'} onClick={() => setActiveTab('sport')} icon={<GymIcon size={24}/>} />
        <MobileItem active={activeTab === 'alimentation'} onClick={() => setActiveTab('alimentation')} icon={<Utensils size={24}/>} />
        <MobileItem active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} icon={<Calendar size={24}/>} />
      </nav>
    </div>
  );
}

const SidebarItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-xl font-bold translate-x-1' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
    {icon} {label}
  </button>
);

const MobileItem = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-4 rounded-[24px] transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-2xl -translate-y-4 scale-110' : 'text-slate-300'}`}>
    {icon}
  </button>
);
