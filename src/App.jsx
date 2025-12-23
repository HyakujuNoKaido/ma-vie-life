import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wallet, Dumbbell as GymIcon, Utensils, Calendar, 
  Plus, Trash2, CheckCircle2, PieChart, CreditCard, ArrowUpCircle, 
  ArrowDownCircle, Clock, Settings, AlertCircle, ChevronRight, Check, Search, PlusCircle, ArrowLeft,
  MapPin, Database, Save, User, Target
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, collection, doc, addDoc, onSnapshot, query, 
  deleteDoc, updateDoc, setDoc, writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';

// --- CONFIGURATION ---
let firebaseConfig = null;
let appId = 'life-dashboard-suisse-v5';
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
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) { configError = e.message; }
}

// --- DONNÉES DE BASE ---
const SEED_EXERCICES = [
  { name: 'Développé Couché', equipment: 'Barre', cat: 'Pectoraux', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400' },
  { name: 'Tractions', equipment: 'Poids corps', cat: 'Dos', img: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400' },
  { name: 'Squat', equipment: 'Barre', cat: 'Jambes', img: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=400' },
  { name: 'Fentes', equipment: 'Haltères', cat: 'Jambes', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400' },
  { name: 'Curl Biceps', equipment: 'Haltères', cat: 'Bras', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400' },
];

const CAT_DEPENSES = ['Nourriture', 'Loisirs', 'Transport', 'Santé', 'Shopping', 'Cadeaux', 'Autres'];
const CAT_ABONNEMENTS = ['Loyer', 'Assurance', 'Télécom', 'Streaming', 'Fitness', 'Autres'];
const CAT_REVENUS = ['Salaire', 'Bonus', 'Freelance', 'Remboursement', 'Autres'];

// --- COMPOSANTS UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false }) => {
  const styles = {
    primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50",
    secondary: "bg-slate-50 text-slate-700 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-slate-300 hover:text-red-500 transition-colors"
  };
  return (
    <button disabled={disabled} onClick={onClick} className={`px-4 py-3 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('accueil');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(configError);
  const [syncError, setSyncError] = useState(null);

  // Données
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [workouts, setWorkouts] = useState([]); 
  const [exerciseLib, setExerciseLib] = useState([]);
  const [menus, setMenus] = useState([]);
  const [events, setEvents] = useState([]); 
  const [budgetGoal, setBudgetGoal] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- AUTH ---
  useEffect(() => {
    if (error) return;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        signInAnonymously(auth).catch(e => setError("Auth Error: " + e.message));
      } else {
        setUser(u);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [error]);

  // --- SYNC ---
  useEffect(() => {
    if (!user || !db) return;

    const syncCollection = (name, setter) => {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', name));
      return onSnapshot(q, 
        (snap) => {
          setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setSyncError(null); // Clear error on success
        },
        (err) => {
          if (err.code === 'permission-denied') {
            setSyncError("⚠️ Permissions insuffisantes.");
          }
        }
      );
    };

    const unsubs = [
      syncCollection('expenses', setExpenses),
      syncCollection('subscriptions', setSubscriptions),
      syncCollection('incomes', setIncomes),
      syncCollection('workouts', setWorkouts),
      syncCollection('exercise_library', setExerciseLib),
      syncCollection('menus', setMenus),
      syncCollection('events', setEvents)
    ];

    const unsubGoal = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'budget'), (d) => {
      if(d.exists()) setBudgetGoal(d.data().monthlyGoal || 0);
    }, (err) => {
      if (err.code === 'permission-denied') setSyncError("⚠️ Permissions insuffisantes.");
    });

    return () => { unsubs.forEach(u => u()); unsubGoal(); };
  }, [user]);

  // --- HELPERS ---
  const addItem = async (col, data) => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', col), { ...data, createdAt: Date.now() });
    } catch (e) { alert("Erreur d'enregistrement : " + e.message); }
  };
  const deleteItem = async (col, id) => {
    if (!db) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
  };
  const updateGoal = async (val) => {
    if (!db) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'budget'), { monthlyGoal: Number(val) });
  };

  // --- STATS ---
  const stats = useMemo(() => {
    const isCurrent = (d) => {
      if (!d) return false;
      const p = d.includes('.') ? d.split('.') : d.split('/');
      return parseInt(p[1]) - 1 === selectedMonth && parseInt(p[2]) === selectedYear;
    };
    const fExp = expenses.filter(e => isCurrent(e.date));
    const totalExp = fExp.reduce((a, c) => a + Number(c.amount || 0), 0);
    const totalSub = subscriptions.reduce((a, c) => a + Number(c.amount || 0), 0);
    const totalInc = incomes.filter(i => isCurrent(i.date)).reduce((a, c) => a + Number(c.amount || 0), 0);
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

  // --- VUES ---
  const ViewAccueil = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div><h1 className="text-4xl font-black tracking-tighter">LIFE.</h1><p className="text-slate-500 font-medium text-sm">Dashboard Global 🇨🇭</p></div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Réel</p>
          <p className={`text-2xl font-black ${stats.realBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stats.realBalance.toFixed(2)} CHF</p>
        </div>
      </header>
      {syncError && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-sm font-medium">
          <p className="font-black flex items-center gap-2 mb-2"><AlertCircle size={16}/> SÉCURITÉ RENFORCÉE</p>
          Votre base est sécurisée. Assurez-vous que les Règles Firestore sont :<br/>
          <code className="bg-red-100 p-1 rounded block mt-2 font-mono text-xs">allow read, write: if request.auth != null;</code>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-indigo-600 text-white border-none shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-indigo-200 text-xs font-black uppercase">Reste à dépenser</p>
            <h2 className="text-4xl font-black mt-1">{stats.goalRemaining.toFixed(2)} CHF</h2>
            <p className="text-[10px] text-indigo-100 font-bold mt-2 uppercase opacity-80">{budgetGoal > 0 ? `Objectif : ${budgetGoal} CHF` : "Pas d'objectif"}</p>
          </div>
          <Wallet className="absolute -right-6 -bottom-6 opacity-10 w-32 h-32 rotate-12" />
        </Card>
        <Card className="border-slate-100 flex flex-col justify-between">
           <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Prochain Événement</p>
           <h2 className="text-xl font-black mt-1 text-slate-800">{events.filter(e => new Date(e.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date))[0]?.title || "Rien de prévu"}</h2></div>
           {events.length > 0 && <div className="mt-2 text-xs text-indigo-600 font-bold flex items-center gap-1"><Clock size={12}/> Agenda synchronisé</div>}
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
      
      await addItem(col, {
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

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4">
        <div className="flex justify-between items-center"><h2 className="text-2xl font-black">Finances</h2></div>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => setSubTab('journal')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'journal' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Journal</button>
          <button onClick={() => setSubTab('add')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'add' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Ajouter</button>
          <button onClick={() => setSubTab('config')} className={`px-4 rounded-xl text-xs font-black transition-all ${subTab === 'config' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><Target size={18}/></button>
        </div>
        
        {subTab === 'config' && (
          <Card className="bg-indigo-50 border-indigo-100">
            <h3 className="text-sm font-black text-indigo-600 uppercase mb-4">Objectif Mensuel</h3>
            <div className="flex gap-2">
              <input type="number" className="flex-1 p-4 rounded-2xl border-none font-black text-lg outline-none shadow-inner" placeholder="CHF" value={budgetGoal || ''} onChange={e => updateGoal(e.target.value)} />
              <div className="bg-indigo-600 text-white p-4 rounded-2xl font-black">CHF</div>
            </div>
          </Card>
        )}

        {subTab === 'add' && (
          <Card className="animate-in slide-in-from-bottom-4 shadow-xl">
             <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-4">
               {[['variable', 'Dépense'], ['fixed', 'Fixe'], ['income', 'Revenu']].map(([t, l]) => (
                 <button key={t} onClick={() => setForm({...form, type: t})} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${form.type === t ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>{l}</button>
               ))}
             </div>
             <div className="space-y-3">
               <div className="flex gap-2">
                 <input type="number" placeholder="Montant" className="flex-1 p-4 bg-slate-50 rounded-2xl font-black text-xl outline-none" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                 {(form.type !== 'variable') && <input type="number" placeholder="Jour" className="w-20 p-4 bg-slate-50 rounded-2xl font-bold text-center outline-none" value={form.day} onChange={e => setForm({...form, day: e.target.value})} />}
               </div>
               <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.cat} onChange={e => setForm({...form, cat: e.target.value})}>
                {form.type === 'income' ? CAT_REVENUS.map(c => <option key={c} value={c}>{c}</option>) : form.type === 'fixed' ? CAT_ABONNEMENTS.map(c => <option key={c} value={c}>{c}</option>) : CAT_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <input type="text" placeholder="Note / Libellé" className="w-full p-4 rounded-2xl bg-slate-50 outline-none" value={form.label} onChange={e => setForm({...form, label: e.target.value})} />
               <Button className="w-full" onClick={handleAdd}>Sauvegarder</Button>
             </div>
          </Card>
        )}

        {subTab === 'journal' && (
          <div className="space-y-3 pb-20">
             {stats.journal.map((item, idx) => (
               <div key={item.id || idx} className={`flex justify-between items-center p-5 rounded-[28px] border shadow-sm ${item.type === 'fixed' ? 'bg-slate-50/80 border-dashed' : 'bg-white border-slate-100'}`}>
                 <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'income' ? 'bg-green-100 text-green-600' : item.type === 'fixed' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}`}>
                      {item.type === 'income' ? <ArrowUpCircle size={20}/> : item.type === 'fixed' ? <Clock size={20}/> : <ArrowDownCircle size={20}/>}
                   </div>
                   <div><p className="font-black text-sm">{item.name}</p><p className="text-[10px] text-slate-400 uppercase">{item.date} • {item.category}</p></div>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className={`font-black ${item.type === 'income' ? 'text-green-600' : item.type === 'fixed' ? 'text-slate-500' : 'text-slate-800'}`}>{item.type === 'income' ? '+' : '-'}{Number(item.amount).toFixed(2)}</span>
                   {!item.isPlanned && <button onClick={() => deleteItem(item.type === 'income' ? 'incomes' : 'expenses', item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>}
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    );
  };

  const ViewSport = () => {
    const [subTab, setSubTab] = useState('lib');
    const [newEx, setNewEx] = useState({ name: '', cat: 'Pectoraux', equipment: '', img: '' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [sessionConfig, setSessionConfig] = useState({});
    const [sessionName, setSessionName] = useState('Ma Séance');

    // Initialisation DB
    const seedDb = async () => {
      try {
        const batch = writeBatch(db);
        SEED_EXERCICES.forEach(ex => {
          const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'exercise_library'));
          batch.set(ref, ex);
        });
        await batch.commit();
        alert("Base de données initialisée !");
      } catch (e) { alert("Erreur init: " + e.message); }
    };

    const handleCreateEx = async () => {
      if(!newEx.name) return;
      await addItem('exercise_library', newEx);
      setNewEx({ name: '', cat: 'Pectoraux', equipment: '', img: '' });
    };

    const handleSaveSession = async () => {
      const exercisesData = exerciseLib.filter(ex => selectedIds.includes(ex.id)).map(ex => ({
        ...ex, ...(sessionConfig[ex.id] || { sets: 4, reps: 10, weight: 0 })
      }));
      await addItem('workouts', { sessionName, date: new Date().toLocaleDateString('fr-CH'), exercises: exercisesData });
      setSelectedIds([]);
      setSubTab('hist');
    };

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4">
        <h2 className="text-2xl font-black">Sport Pro 💪</h2>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => setSubTab('lib')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'lib' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Bibliothèque</button>
          <button onClick={() => setSubTab('new')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'new' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Créer Exo</button>
          <button onClick={() => setSubTab('hist')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'hist' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Historique</button>
        </div>

        {subTab === 'lib' && (
          <>
            {exerciseLib.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-slate-400 mb-4">Bibliothèque vide.</p>
                <Button onClick={seedDb} variant="secondary"><Database size={16}/> Initialiser la base de données</Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pb-24">
              {exerciseLib.map(ex => {
                const selected = selectedIds.includes(ex.id);
                return (
                  <div key={ex.id} onClick={() => setSelectedIds(p => selected ? p.filter(i => i !== ex.id) : [...p, ex.id])} className={`bg-white rounded-[24px] overflow-hidden border relative cursor-pointer ${selected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100'}`}>
                    <img src={ex.img || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200"} className="w-full h-24 object-cover" />
                    <div className="p-3">
                      <p className="text-[9px] font-black uppercase text-indigo-400">{ex.equipment}</p>
                      <p className="text-xs font-bold truncate">{ex.name}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteItem('exercise_library', ex.id); }} className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-red-500"><Trash2 size={12}/></button>
                    {selected && <div className="absolute top-2 left-2 bg-indigo-600 text-white p-1 rounded-full"><Check size={12}/></div>}
                  </div>
                );
              })}
            </div>
            {selectedIds.length > 0 && (
              <div className="fixed bottom-24 left-4 right-4 z-40">
                <Button onClick={() => setSubTab('session')} className="w-full shadow-2xl">Configurer Séance ({selectedIds.length})</Button>
              </div>
            )}
          </>
        )}

        {subTab === 'session' && (
          <Card className="pb-20 animate-in slide-in-from-right-4">
             <div className="flex items-center gap-2 mb-6 text-slate-400 cursor-pointer" onClick={() => setSubTab('lib')}><ArrowLeft size={16}/> <span className="text-xs font-bold uppercase">Retour</span></div>
             <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xl mb-6 outline-none" value={sessionName} onChange={e => setSessionName(e.target.value)} />
             <div className="space-y-6">
               {exerciseLib.filter(ex => selectedIds.includes(ex.id)).map(ex => (
                 <div key={ex.id}>
                    <p className="font-bold text-sm mb-2">{ex.name}</p>
                    <div className="grid grid-cols-3 gap-2">
                       <input type="number" placeholder="Kg" className="p-3 bg-slate-50 rounded-xl text-center font-bold text-sm" onChange={e => setSessionConfig({...sessionConfig, [ex.id]: {...sessionConfig[ex.id], weight: e.target.value}})} />
                       <input type="number" placeholder="Séries" className="p-3 bg-slate-50 rounded-xl text-center font-bold text-sm" onChange={e => setSessionConfig({...sessionConfig, [ex.id]: {...sessionConfig[ex.id], sets: e.target.value}})} />
                       <input type="number" placeholder="Reps" className="p-3 bg-slate-50 rounded-xl text-center font-bold text-sm" onChange={e => setSessionConfig({...sessionConfig, [ex.id]: {...sessionConfig[ex.id], reps: e.target.value}})} />
                    </div>
                 </div>
               ))}
             </div>
             <div className="mt-8"><Button onClick={handleSaveSession} className="w-full">Enregistrer la séance</Button></div>
          </Card>
        )}

        {subTab === 'new' && (
          <Card>
            <h3 className="text-lg font-black mb-4">Nouvel Exercice</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nom (ex: Curl Barre)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newEx.name} onChange={e => setNewEx({...newEx, name: e.target.value})} />
              <input type="text" placeholder="URL Image" className="w-full p-4 bg-slate-50 rounded-2xl text-xs outline-none" value={newEx.img} onChange={e => setNewEx({...newEx, img: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                 <input type="text" placeholder="Groupe (Pecs...)" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newEx.cat} onChange={e => setNewEx({...newEx, cat: e.target.value})} />
                 <input type="text" placeholder="Matériel" className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newEx.equipment} onChange={e => setNewEx({...newEx, equipment: e.target.value})} />
              </div>
              <Button onClick={handleCreateEx} className="w-full mt-4">Créer</Button>
            </div>
          </Card>
        )}

        {subTab === 'hist' && (
          <div className="space-y-4 pb-20">
            {workouts.sort((a,b) => b.createdAt - a.createdAt).map(w => (
              <Card key={w.id} className="border-l-8 border-indigo-600">
                <div className="flex justify-between items-start mb-4">
                   <div><h3 className="text-lg font-black">{w.sessionName}</h3><p className="text-xs text-slate-400 font-bold uppercase">{w.date}</p></div>
                   <button onClick={() => deleteItem('workouts', w.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
                <div className="space-y-2">
                   {w.exercises?.map((ex, i) => (
                     <div key={i} className="flex justify-between text-xs text-slate-600 border-t border-slate-50 pt-2">
                        <span className="font-bold">{ex.name}</span>
                        <span>{ex.sets} x {ex.reps} {ex.weight && `(${ex.weight}kg)`}</span>
                     </div>
                   ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ViewNutrition = () => {
    const [subTab, setSubTab] = useState('list');
    const [newMeal, setNewMeal] = useState({ name: '', img: '', ingredients: [] });
    const [tempIng, setTempIng] = useState({ name: '', qty: '' });

    const addIng = () => {
      if(!tempIng.name) return;
      setNewMeal(prev => ({ ...prev, ingredients: [...prev.ingredients, tempIng] }));
      setTempIng({ name: '', qty: '' });
    };

    const saveMeal = async () => {
      if(!newMeal.name) return;
      await addItem('menus', newMeal);
      setNewMeal({ name: '', img: '', ingredients: [] });
      setSubTab('list');
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-black">Nutrition 🍱</h2>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={() => setSubTab('list')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Menus</button>
           <button onClick={() => setSubTab('add')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Créer</button>
        </div>

        {subTab === 'add' && (
          <Card className="space-y-4">
             <input type="text" placeholder="Nom du plat" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-lg outline-none" value={newMeal.name} onChange={e => setNewMeal({...newMeal, name: e.target.value})} />
             <input type="text" placeholder="URL Image" className="w-full p-4 bg-slate-50 rounded-2xl text-xs outline-none" value={newMeal.img} onChange={e => setNewMeal({...newMeal, img: e.target.value})} />
             
             <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
               <p className="text-xs font-black uppercase text-slate-400">Ingrédients</p>
               <div className="flex gap-2">
                 <input type="text" placeholder="Aliment" className="flex-1 p-2 rounded-xl border-none outline-none text-sm" value={tempIng.name} onChange={e => setTempIng({...tempIng, name: e.target.value})} />
                 <input type="text" placeholder="Qté" className="w-20 p-2 rounded-xl border-none outline-none text-sm" value={tempIng.qty} onChange={e => setTempIng({...tempIng, qty: e.target.value})} />
                 <button onClick={addIng} className="bg-indigo-600 text-white p-2 rounded-xl"><Plus size={16}/></button>
               </div>
               <div className="space-y-1">
                 {newMeal.ingredients.map((ing, i) => (
                   <div key={i} className="flex justify-between text-xs bg-white p-2 rounded-lg text-slate-600">
                     <span>{ing.name}</span><span className="font-bold">{ing.qty}</span>
                   </div>
                 ))}
               </div>
             </div>
             <Button onClick={saveMeal} className="w-full">Enregistrer le menu</Button>
          </Card>
        )}

        {subTab === 'list' && (
          <div className="grid grid-cols-2 gap-3 pb-20">
            {menus.map(m => (
              <div key={m.id} className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm relative group">
                <img src={m.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="font-black text-sm truncate">{m.name}</p>
                  <p className="text-[9px] text-slate-400 mt-1">{m.ingredients?.length || 0} ingrédients</p>
                </div>
                <button onClick={() => deleteItem('menus', m.id)} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500"><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ViewAgenda = () => {
    const [subTab, setSubTab] = useState('list');
    const [evt, setEvt] = useState({ title: '', date: '', time: '', location: '', desc: '' });

    const handleSave = async () => {
      if(!evt.title) return;
      await addItem('events', evt);
      setEvt({ title: '', date: '', time: '', location: '', desc: '' });
      setSubTab('list');
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-black">Agenda 📅</h2>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={() => setSubTab('list')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Planning</button>
           <button onClick={() => setSubTab('add')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Ajouter</button>
        </div>

        {subTab === 'add' && (
          <Card className="space-y-3 animate-in slide-in-from-bottom-4">
            <input type="text" placeholder="Titre de l'événement" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-lg outline-none" value={evt.title} onChange={e => setEvt({...evt, title: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" className="p-4 bg-slate-50 rounded-2xl outline-none text-sm font-bold" value={evt.date} onChange={e => setEvt({...evt, date: e.target.value})} />
              <input type="time" className="p-4 bg-slate-50 rounded-2xl outline-none text-sm font-bold" value={evt.time} onChange={e => setEvt({...evt, time: e.target.value})} />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl">
               <MapPin size={18} className="text-slate-400"/>
               <input type="text" placeholder="Lieu" className="bg-transparent w-full outline-none text-sm" value={evt.location} onChange={e => setEvt({...evt, location: e.target.value})} />
            </div>
            <textarea placeholder="Description / Notes..." className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm h-24 resize-none" value={evt.desc} onChange={e => setEvt({...evt, desc: e.target.value})} />
            <Button onClick={handleSave} className="w-full">Ajouter à l'agenda</Button>
          </Card>
        )}

        {subTab === 'list' && (
          <div className="space-y-3 pb-20">
            {events.sort((a,b) => new Date(a.date) - new Date(b.date)).map(e => (
              <div key={e.id} className="flex justify-between items-start p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm">
                <div>
                   <h3 className="font-black text-slate-800">{e.title}</h3>
                   <div className="flex items-center gap-2 mt-1 text-xs text-indigo-600 font-bold">
                     <Clock size={14}/> {new Date(e.date).toLocaleDateString()} à {e.time}
                   </div>
                   {e.location && <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><MapPin size={10}/> {e.location}</p>}
                </div>
                <button onClick={() => deleteItem('events', e.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            ))}
            {events.length === 0 && <p className="text-center py-10 text-slate-300 italic">Rien de prévu.</p>}
          </div>
        )}
      </div>
    );
  };

  // --- RENDU FINAL ---
  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse">Chargement LIFE...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center p-10 text-center"><p className="text-red-500 font-bold">{error}</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-0 md:pl-72 font-sans antialiased">
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col">
        <div className="text-3xl font-black mb-12 text-indigo-600 tracking-tighter flex items-center gap-3"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">L</div> LIFE.</div>
        <nav className="space-y-2 flex-1">
          <NavItem active={activeTab === 'accueil'} onClick={() => setActiveTab('accueil')} icon={<LayoutDashboard size={20}/>} label="Accueil" />
          <NavItem active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} icon={<Wallet size={20}/>} label="Finances" />
          <NavItem active={activeTab === 'sport'} onClick={() => setActiveTab('sport')} icon={<GymIcon size={20}/>} label="Sport Pro" />
          <NavItem active={activeTab === 'alimentation'} onClick={() => setActiveTab('alimentation')} icon={<Utensils size={20}/>} label="Nutrition" />
          <NavItem active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} icon={<Calendar size={20}/>} label="Agenda" />
        </nav>
      </aside>
      <main className="max-w-4xl mx-auto p-4 md:p-12">
        {activeTab === 'accueil' && <ViewAccueil />}
        {activeTab === 'budget' && <ViewBudget />}
        {activeTab === 'sport' && <ViewSport />}
        {activeTab === 'alimentation' && <ViewNutrition />}
        {activeTab === 'agenda' && <ViewAgenda />}
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

const NavItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-xl font-bold translate-x-1' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>{icon} {label}</button>
);
const MobileItem = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-4 rounded-[24px] transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-2xl -translate-y-4 scale-110' : 'text-slate-300'}`}>{icon}</button>
);
