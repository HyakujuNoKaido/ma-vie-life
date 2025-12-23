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

// --- CONFIGURATION ---
let firebaseConfig = null;
let appId = 'life-dashboard-suisse-v5'; // Votre identifiant de synchronisation
let configError = null;

try {
  const rawConfig = import.meta.env?.VITE_FIREBASE_CONFIG;
  const envAppId = import.meta.env?.VITE_APP_ID;
  
  if (rawConfig) {
    const cleaned = rawConfig.trim().replace(/^['"]|['"]$/g, '');
    firebaseConfig = JSON.parse(cleaned);
  } else if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  }
  
  if (envAppId) appId = envAppId;
  if (!firebaseConfig || !firebaseConfig.apiKey) configError = "Configuration Firebase manquante.";
} catch (e) { 
  configError = "Erreur de lecture de la configuration JSON."; 
}

let app, auth, db;
if (!configError) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

// --- DONNÉES STATIQUES ---
const STATIC_EXERCICES = [
  { id: 'p1', name: 'Développé Couché', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', equipment: 'Barre', cat: 'Pectoraux' },
  { id: 'd1', name: 'Tractions', img: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400', equipment: 'Poids corps', cat: 'Dos' },
  { id: 'j1', name: 'Squat', img: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=400', equipment: 'Barre', cat: 'Jambes' },
];

const CAT_DEPENSES = ['Nourriture', 'Loisirs', 'Transport', 'Santé', 'Shopping', 'Autres'];
const CAT_ABONNEMENTS = ['Loyer', 'Assurance', 'Télécom', 'Streaming', 'Fitness'];
const CAT_REVENUS = ['Salaire', 'Bonus', 'Freelance', 'Autres'];

// --- COMPOSANTS UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "primary", className = "" }) => {
  const styles = {
    primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700",
    secondary: "bg-slate-50 text-slate-700 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-slate-300 hover:text-red-500 transition-colors"
  };
  return (
    <button onClick={onClick} className={`px-4 py-3 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('accueil');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(configError);

  // Données synchronisées (Mode Public pour Multi-appareil)
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [menus, setMenus] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [budgetGoal, setBudgetGoal] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- AUTHENTIFICATION ---
  useEffect(() => {
    if (error) return;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        signInAnonymously(auth).catch(e => setError("Erreur d'authentification : " + e.message));
      } else {
        setUser(u);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [error]);

  // --- SYNCHRONISATION (Utilisation du path 'public' pour le partage PC/Mobile) ---
  useEffect(() => {
    if (!user || !db) return;

    const collections = [
      { n: 'expenses', s: setExpenses },
      { n: 'subscriptions', s: setSubscriptions },
      { n: 'incomes', s: setIncomes },
      { n: 'workouts', s: setWorkouts },
      { n: 'menus', s: setMenus },
      { n: 'tasks', s: setTasks }
    ];

    const unsubs = collections.map(({ n, s }) => 
      onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', n)), 
      snap => s(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error("Erreur de sync:", err))
    );

    // Objectif budget
    const unsubGoal = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'budget'), d => {
      if(d.exists()) setBudgetGoal(d.data().monthlyGoal || 0);
    });

    return () => { unsubs.forEach(u => u()); unsubGoal(); };
  }, [user]);

  // --- CALCULS STATS ---
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

  const deleteItem = async (col, id) => {
    if (!db) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
  };

  // --- VUES ---
  const ViewAccueil = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">LIFE.</h1>
          <p className="text-slate-500 font-medium text-sm">Bonjour 👋 Votre dashboard 🇨🇭</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Réel</p>
          <p className={`text-2xl font-black ${stats.realBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.realBalance.toFixed(2)} CHF
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-indigo-600 text-white border-none shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-indigo-200 text-xs font-black uppercase">Reste à dépenser</p>
            <h2 className="text-4xl font-black mt-1">{stats.goalRemaining.toFixed(2)} CHF</h2>
            <p className="text-[10px] text-indigo-100 font-bold mt-2 uppercase opacity-80">
              {budgetGoal > 0 ? `Objectif : ${budgetGoal} CHF` : "Pas d'objectif fixé"}
            </p>
          </div>
          <Wallet className="absolute -right-6 -bottom-6 opacity-10 w-32 h-32 rotate-12" />
        </Card>
        
        <Card className="flex flex-col justify-between border-slate-100">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Charges fixes</p>
            <h2 className="text-2xl font-black mt-1 text-slate-800">{stats.totalSub.toFixed(2)} CHF</h2>
          </div>
          <div className="flex gap-1 overflow-hidden mt-2">
            {subscriptions.slice(0,3).map(s => (
              <span key={s.id} className="text-[8px] bg-slate-50 px-2 py-1 rounded-full font-bold text-slate-400 uppercase">
                {s.name}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const ViewBudget = () => {
    const [subTab, setSubTab] = useState('journal');
    const [form, setForm] = useState({ amount: '', label: '', cat: 'Nourriture', type: 'variable', day: '1' });

    const handleAdd = async () => {
      if(!form.amount || !db) return;
      const col = form.type === 'income' ? 'incomes' : (form.type === 'fixed' ? 'subscriptions' : 'expenses');
      
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', col), {
        amount: Number(form.amount), 
        name: form.label || form.cat, 
        category: form.cat, 
        day: form.day, 
        date: new Date().toLocaleDateString('fr-CH'), 
        createdAt: Date.now()
      });
      
      setForm({ amount: '', label: '', cat: 'Nourriture', type: 'variable', day: '1' });
      setSubTab('journal');
    };

    const updateGoal = async (val) => {
      if (!db) return;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'budget'), { monthlyGoal: Number(val) });
    };

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-800">Finances</h2>
          <div className="flex gap-2">
            <select className="bg-white border-none rounded-xl text-[10px] font-black p-2 shadow-sm outline-none uppercase" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"].map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => setSubTab('journal')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'journal' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Journal</button>
          <button onClick={() => setSubTab('ajouter')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'ajouter' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Ajouter</button>
          <button onClick={() => setSubTab('config')} className={`px-4 rounded-xl text-xs font-black transition-all ${subTab === 'config' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><Target size={18}/></button>
        </div>

        {subTab === 'config' && (
          <Card className="bg-indigo-50 border-indigo-100">
            <h3 className="text-sm font-black text-indigo-600 uppercase mb-4">Objectif de dépenses mensuel</h3>
            <div className="flex gap-2">
              <input type="number" className="flex-1 p-4 rounded-2xl border-none font-black text-lg outline-none shadow-inner" placeholder="CHF" value={budgetGoal || ''} onChange={e => updateGoal(e.target.value)} />
              <div className="bg-indigo-600 text-white p-4 rounded-2xl font-black">CHF</div>
            </div>
          </Card>
        )}

        {subTab === 'ajouter' && (
          <Card className="animate-in slide-in-from-bottom-4 shadow-xl">
            <div className="space-y-4 text-slate-700">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                {[['variable', 'Dépense'], ['fixed', 'Fixe'], ['income', 'Revenu']].map(([t, l]) => (
                  <button key={t} onClick={() => setForm({...form, type: t})} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${form.type === t ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>{l}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Montant" className="p-4 rounded-2xl bg-slate-50 font-black text-xl outline-none focus:ring-2 ring-indigo-500" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                {(form.type !== 'variable') && <input type="number" placeholder="Jour" className="p-4 rounded-2xl bg-slate-50 font-black text-xl outline-none" value={form.day} onChange={e => setForm({...form, day: e.target.value})} />}
              </div>
              <select className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none" value={form.cat} onChange={e => setForm({...form, cat: e.target.value})}>
                {form.type === 'income' ? CAT_REVENUS.map(c => <option key={c} value={c}>{c}</option>) :
                 form.type === 'fixed' ? CAT_ABONNEMENTS.map(c => <option key={c} value={c}>{c}</option>) :
                 CAT_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="text" placeholder="Note / Libellé" className="w-full p-4 rounded-2xl bg-slate-50 outline-none" value={form.label} onChange={e => setForm({...form, label: e.target.value})} />
              <Button className="w-full py-4 text-sm font-black uppercase" onClick={handleAdd}>Enregistrer</Button>
            </div>
          </Card>
        )}

        {subTab === 'journal' && (
          <div className="space-y-3 pb-10">
            {stats.journal.map((item, idx) => (
              <div key={item.id || idx} className={`flex justify-between items-center p-5 rounded-[28px] border transition-all ${item.type === 'fixed' ? 'bg-slate-50/80 border-dashed border-slate-300' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex items-center gap-4 text-slate-800">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'income' ? 'bg-green-100 text-green-600' : item.type === 'fixed' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}`}>
                    {item.type === 'income' ? <ArrowUpCircle size={20}/> : item.type === 'fixed' ? <Clock size={20}/> : <ArrowDownCircle size={20}/>}
                  </div>
                  <div><p className="font-black text-sm">{item.name}</p><p className="text-[10px] text-slate-400 font-black uppercase">{item.date}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-black ${item.type === 'income' ? 'text-green-600' : item.type === 'fixed' ? 'text-slate-500' : 'text-red-500'}`}>{item.type === 'income' ? '+' : '-'}{Number(item.amount).toFixed(2)}</span>
                  {!item.isPlanned && <Button variant="ghost" onClick={() => deleteItem(item.type === 'income' ? 'incomes' : 'expenses', item.id)}><Trash2 size={16}/></Button>}
                </div>
              </div>
            ))}
            {stats.journal.length === 0 && <p className="text-center py-20 text-slate-300 italic text-sm">Aucune transaction ce mois-ci.</p>}
          </div>
        )}
      </div>
    );
  };

  const ViewSport = () => {
    const [subTab, setSubTab] = useState('lib');
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4">
        <h2 className="text-2xl font-black text-slate-800">Sport Pro 💪</h2>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => setSubTab('lib')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'lib' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Bibliothèque</button>
          <button onClick={() => setSubTab('hist')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'hist' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Historique</button>
        </div>
        {subTab === 'lib' ? (
          <div className="grid grid-cols-2 gap-3 pb-10">
            {STATIC_EXERCICES.map(ex => (
              <div key={ex.id} className="bg-white rounded-[32px] overflow-hidden border border-slate-50 shadow-sm active:scale-95 transition-all">
                <img src={ex.img} className="w-full h-32 object-cover" alt="" />
                <div className="p-4"><p className="text-[9px] font-black uppercase text-indigo-400">{ex.equipment}</p><p className="text-xs font-black truncate">{ex.name}</p></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map(w => (
              <Card key={w.id} className="border-l-8 border-indigo-600 shadow-sm flex justify-between items-center">
                <div><h3 className="text-xl font-black text-slate-800">{w.sessionName}</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{w.date}</p></div>
                <Button variant="ghost" onClick={() => deleteItem('workouts', w.id)}><Trash2 size={16}/></Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ViewNutrition = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 text-slate-800">
      <h2 className="text-2xl font-black">Nutrition 🍱</h2>
      <Card><p className="text-slate-400 text-sm italic py-4 text-center">Modules de menus bientôt disponibles.</p></Card>
      <div className="grid grid-cols-2 gap-4">
        {menus.map(m => (
          <div key={m.id} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm relative">
            <img src={m.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} className="w-full h-40 object-cover" alt="" />
            <div className="p-4 flex justify-between items-center"><p className="text-sm font-black truncate">{m.name}</p><Button variant="ghost" onClick={() => deleteItem('menus', m.id)}><Trash2 size={14}/></Button></div>
          </div>
        ))}
      </div>
    </div>
  );

  const ViewAgenda = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 text-slate-800">
      <h2 className="text-2xl font-black">Agenda 📅</h2>
      <Card><p className="text-slate-400 text-sm italic py-4 text-center">Gérez vos priorités quotidiennes.</p></Card>
      <div className="space-y-3">
        {tasks.map(t => (
          <div key={t.id} className="flex items-center justify-between p-5 bg-white rounded-[28px] border border-slate-50 shadow-sm">
            <div><p className="font-black text-slate-800">{t.title}</p><span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Énergie {t.energy}</span></div>
            <Button variant="ghost" onClick={() => deleteItem('tasks', t.id)}><Trash2 size={16}/></Button>
          </div>
        ))}
      </div>
    </div>
  );

  // --- RENDU FINAL ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 font-sans text-center px-6">
      <div className="w-16 h-16 bg-indigo-600 rounded-[30px] animate-bounce flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-100">L</div>
      <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest animate-pulse">Synchronisation LIFE...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center font-sans text-slate-800">
      <Card className="max-w-md border-red-100">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-black mb-2">Problème technique</h2>
        <p className="text-sm text-red-600 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Réessayer</button>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-0 md:pl-72 font-sans antialiased selection:bg-indigo-100">
      {/* Sidebar Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col">
        <div className="text-3xl font-black mb-12 text-indigo-600 tracking-tighter flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-100">L</div> LIFE.
        </div>
        <nav className="space-y-2 flex-1">
          <NavItem active={activeTab === 'accueil'} onClick={() => setActiveTab('accueil')} icon={<LayoutDashboard size={20}/>} label="Accueil" />
          <NavItem active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} icon={<Wallet size={20}/>} label="Finances" />
          <NavItem active={activeTab === 'sport'} onClick={() => setActiveTab('sport')} icon={<GymIcon size={20}/>} label="Sport Pro" />
          <NavItem active={activeTab === 'alimentation'} onClick={() => setActiveTab('alimentation')} icon={<Utensils size={20}/>} label="Nutrition" />
          <NavItem active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} icon={<Calendar size={20}/>} label="Agenda" />
        </nav>
        <div className="pt-10 border-t border-slate-50">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Sync ID: {appId}</p>
        </div>
      </aside>

      {/* Contenu Principal */}
      <main className="max-w-4xl mx-auto p-4 md:p-12">
        {activeTab === 'accueil' && <ViewAccueil />}
        {activeTab === 'budget' && <ViewBudget />}
        {activeTab === 'sport' && <ViewSport />}
        {activeTab === 'alimentation' && <ViewNutrition />}
        {activeTab === 'agenda' && <ViewAgenda />}
      </main>

      {/* Navigation Mobile */}
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

const NavItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-xl font-bold translate-x-1' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
    {icon} {label}
  </button>
);

const MobileItem = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-4 rounded-[24px] transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-2xl -translate-y-4 scale-110' : 'text-slate-300'}`}>
    {icon}
  </button>
);
