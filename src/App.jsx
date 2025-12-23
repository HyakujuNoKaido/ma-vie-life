import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wallet, Dumbbell as GymIcon, Utensils, Calendar, 
  Plus, Trash2, CheckCircle2, PieChart, CreditCard, ArrowUpCircle, 
  ArrowDownCircle, Clock, Settings, AlertCircle, ChevronRight, Check, Search, PlusCircle, ArrowLeft,
  MapPin, Database, Save, User, Target, Scale, Filter, X
} from 'lucide-react';

// --- DONNÉES INITIALES (INTÉGRÉES) ---
const INITIAL_EXERCICES = [
  // PECTORAUX
  { id: 'p1', name: "Développé Couché", equipment: "Barre", cat: "Pectoraux", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400" },
  { id: 'p2', name: "Développé Incliné Haltères", equipment: "Haltères", cat: "Pectoraux", img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400" },
  { id: 'p3', name: "Pompes", equipment: "Poids du corps", cat: "Pectoraux", img: "https://images.unsplash.com/photo-1598971639058-aba7c12af93a?w=400" },
  { id: 'p4', name: "Dips", equipment: "Barres", cat: "Pectoraux", img: "https://images.unsplash.com/photo-1591258339716-583cf2279373?w=400" },
  // DOS
  { id: 'd1', name: "Tractions", equipment: "Barre fixe", cat: "Dos", img: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400" },
  { id: 'd2', name: "Tirage Vertical", equipment: "Machine", cat: "Dos", img: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400" },
  { id: 'd3', name: "Rowing Barre", equipment: "Barre", cat: "Dos", img: "https://images.unsplash.com/photo-1567598508481-65985588e295?w=400" },
  { id: 'd4', name: "Soulevé de Terre", equipment: "Barre", cat: "Dos", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400" },
  // JAMBES
  { id: 'j1', name: "Squat Arrière", equipment: "Barre", cat: "Jambes", img: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=400" },
  { id: 'j2', name: "Presse à Cuisses", equipment: "Machine", cat: "Jambes", img: "https://images.unsplash.com/photo-1541534741688-6078c6bd35e5?w=400" },
  { id: 'j3', name: "Fentes", equipment: "Haltères", cat: "Jambes", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400" },
  { id: 'j4', name: "Leg Extension", equipment: "Machine", cat: "Jambes", img: "https://images.unsplash.com/photo-1434596922112-19c563067271?w=400" },
  // ÉPAULES & BRAS
  { id: 'e1', name: "Développé Militaire", equipment: "Barre", cat: "Épaules", img: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400" },
  { id: 'e2', name: "Élévations Latérales", equipment: "Haltères", cat: "Épaules", img: "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=400" },
  { id: 'b1', name: "Curl Biceps", equipment: "Barre", cat: "Bras", img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400" },
  // ABDOS
  { id: 'a1', name: "Planche", equipment: "Tapis", cat: "Abdos", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400" }
];

const INITIAL_FOODS = [
  { id: 'f1', name: "Poulet (Blanc)", calories: 165, protein: 31, unit: "100g", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200" },
  { id: 'f2', name: "Riz Basmati Cuit", calories: 130, protein: 2.7, unit: "100g", img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200" },
  { id: 'f3', name: "Oeuf entier", calories: 155, protein: 13, unit: "unité", img: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=200" },
  { id: 'f4', name: "Flocons d'Avoine", calories: 389, protein: 16.9, unit: "100g", img: "https://images.unsplash.com/photo-1517093725460-ea6920d6931d?w=200" },
  { id: 'f5', name: "Banane", calories: 89, protein: 1.1, unit: "unité", img: "https://images.unsplash.com/photo-1571771896338-a0752055396e?w=200" },
  { id: 'f6', name: "Pâtes Complètes", calories: 350, protein: 12, unit: "100g (cru)", img: "https://images.unsplash.com/photo-1612966874574-e0a92d878ef4?w=200" },
  { id: 'f7', name: "Avocat", calories: 160, protein: 2, unit: "unité", img: "https://images.unsplash.com/photo-1523049673856-38225547e087?w=200" },
  { id: 'f8', name: "Amandes", calories: 579, protein: 21, unit: "100g", img: "https://images.unsplash.com/photo-1508061253366-f7da158b6d90?w=200" },
  { id: 'f9', name: "Saumon", calories: 208, protein: 20, unit: "100g", img: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=200" },
  { id: 'f10', name: "Brocolis", calories: 34, protein: 2.8, unit: "100g", img: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=200" },
];

// --- HOOK DE GESTION LOCALSTORAGE ---
// Remplace Firebase pour stocker les données sur le téléphone/ordi
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

const CAT_DEPENSES = ['Nourriture', 'Loisirs', 'Transport', 'Santé', 'Shopping', 'Cadeaux', 'Autres'];
const CAT_ABONNEMENTS = ['Loyer', 'Assurance', 'Télécom', 'Streaming', 'Fitness', 'Autres'];
const CAT_REVENUS = ['Salaire', 'Bonus', 'Freelance', 'Remboursement', 'Autres'];
const BODY_PARTS = ['Tous', 'Pectoraux', 'Dos', 'Jambes', 'Épaules', 'Bras', 'Abdos'];
const EQUIPMENTS = ['Tous', 'Sans matériel', 'Barre', 'Haltères', 'Machine', 'Poulie'];
const MEAL_TYPES = ['Matin', 'Midi', 'Soir', 'Collation'];

// --- COMPOSANTS UI ---
const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 ${className} ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}>{children}</div>
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
  
  // --- DONNÉES LOCALES (FINI LES ERREURS FIREBASE) ---
  const [expenses, setExpenses] = useLocalStorage('life_expenses', []);
  const [subscriptions, setSubscriptions] = useLocalStorage('life_subscriptions', []);
  const [incomes, setIncomes] = useLocalStorage('life_incomes', []);
  const [workouts, setWorkouts] = useLocalStorage('life_workouts', []);
  
  // On initialise les bibliothèques avec les données intégrées si vide
  const [exerciseLib, setExerciseLib] = useLocalStorage('life_exercise_lib', INITIAL_EXERCICES);
  const [foodLib, setFoodLib] = useLocalStorage('life_food_lib', INITIAL_FOODS);
  
  const [menus, setMenus] = useLocalStorage('life_menus', []);
  const [dailyMeals, setDailyMeals] = useLocalStorage('life_daily_meals', []);
  const [events, setEvents] = useLocalStorage('life_events', []);
  const [budgetGoal, setBudgetGoal] = useLocalStorage('life_budget_goal', 0);

  const [overlay, setOverlay] = useState(null); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- HELPERS (CRUD) ---
  const addItem = (listName, item) => {
    const newItem = { ...item, id: Date.now().toString(), createdAt: Date.now() };
    switch(listName) {
      case 'expenses': setExpenses(prev => [...prev, newItem]); break;
      case 'subscriptions': setSubscriptions(prev => [...prev, newItem]); break;
      case 'incomes': setIncomes(prev => [...prev, newItem]); break;
      case 'workouts': setWorkouts(prev => [...prev, newItem]); break;
      case 'exercise_library': setExerciseLib(prev => [...prev, newItem]); break;
      case 'food_library': setFoodLib(prev => [...prev, newItem]); break;
      case 'menus': setMenus(prev => [...prev, newItem]); break;
      case 'daily_meals': setDailyMeals(prev => [...prev, newItem]); break;
      case 'events': setEvents(prev => [...prev, newItem]); break;
    }
  };

  const deleteItem = (listName, id) => {
    const filter = (prev) => prev.filter(i => i.id !== id);
    switch(listName) {
      case 'expenses': setExpenses(filter); break;
      case 'subscriptions': setSubscriptions(filter); break;
      case 'incomes': setIncomes(filter); break;
      case 'workouts': setWorkouts(filter); break;
      case 'exercise_library': setExerciseLib(filter); break;
      case 'food_library': setFoodLib(filter); break;
      case 'menus': setMenus(filter); break;
      case 'daily_meals': setDailyMeals(filter); break;
      case 'events': setEvents(filter); break;
    }
  };

  // --- STATS ---
  const todayStr = new Date().toLocaleDateString('fr-CH');
  
  const dashboardData = useMemo(() => {
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
    const progress = budgetGoal > 0 ? Math.min(100, Math.max(0, (totalExp / budgetGoal) * 100)) : 0;
    const todayWorkout = workouts.find(w => w.date === todayStr);
    const todayMeals = dailyMeals.filter(m => m.date === todayStr);
    return { totalSub, totalExp, realBalance, goalRemaining, progress, todayWorkout, todayMeals };
  }, [expenses, incomes, subscriptions, workouts, dailyMeals, selectedMonth, selectedYear, budgetGoal, todayStr]);

  // --- VUES ---
  const ViewAccueil = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <header className="flex justify-between items-end">
        <div><h1 className="text-4xl font-black tracking-tighter">LIFE.</h1><p className="text-slate-500 font-medium text-sm">Dashboard Personnel 🇨🇭</p></div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Réel</p>
          <p className={`text-2xl font-black ${dashboardData.realBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{dashboardData.realBalance.toFixed(2)} CHF</p>
        </div>
      </header>

      <Card className="bg-white border-slate-100 shadow-xl overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-2">
             <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Reste à dépenser</p>
             {budgetGoal > 0 && <p className="text-xs font-bold text-indigo-600">{dashboardData.progress.toFixed(0)}%</p>}
          </div>
          <h2 className={`text-5xl font-black mb-4 ${dashboardData.goalRemaining < 0 ? 'text-red-500' : 'text-slate-800'}`}>
            {dashboardData.goalRemaining.toFixed(2)} <span className="text-lg text-slate-400 font-medium">CHF</span>
          </h2>
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className={`h-full rounded-full transition-all duration-1000 ${dashboardData.progress > 90 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${dashboardData.progress}%` }}></div>
          </div>
        </div>
      </Card>

      <Card 
        className={`${dashboardData.todayWorkout ? 'bg-indigo-600 text-white' : 'bg-white border-slate-100'} relative overflow-hidden`}
        onClick={() => dashboardData.todayWorkout ? setOverlay({ type: 'workout', data: dashboardData.todayWorkout }) : setActiveTab('sport')}
      >
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dashboardData.todayWorkout ? 'text-indigo-200' : 'text-slate-400'}`}>Sport du jour</p>
            <h3 className={`text-2xl font-black ${dashboardData.todayWorkout ? 'text-white' : 'text-slate-800'}`}>{dashboardData.todayWorkout ? dashboardData.todayWorkout.sessionName : "Rien de prévu"}</h3>
          </div>
          <div className={`p-3 rounded-2xl ${dashboardData.todayWorkout ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}><GymIcon size={24}/></div>
        </div>
      </Card>

      <div>
        <h3 className="text-xs font-black uppercase text-slate-400 mb-3 ml-2">Repas du jour ({todayStr})</h3>
        <div className="grid grid-cols-3 gap-2">
           {['Matin', 'Midi', 'Soir'].map(type => {
             const meal = dashboardData.todayMeals.find(m => m.type === type);
             return (
               <div key={type} onClick={() => meal && setOverlay({ type: 'meal', data: meal })} className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${meal ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-transparent border-dashed'}`}>
                 <span className="text-[10px] font-black uppercase text-slate-400">{type}</span>
                 {meal ? (<><div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><Utensils size={14}/></div><p className="text-xs font-bold text-center truncate w-full">{meal.name}</p></>) : (<PlusCircle size={20} className="text-slate-300" onClick={(e) => { e.stopPropagation(); setActiveTab('alimentation'); }} />)}
               </div>
             )
           })}
        </div>
      </div>
    </div>
  );

  const ViewFinance = () => {
    const [subTab, setSubTab] = useState('journal');
    const [form, setForm] = useState({ amount: '', label: '', cat: 'Nourriture', type: 'variable', day: '1' });
    const handleAdd = () => {
      if(!form.amount) return;
      addItem(form.type === 'income' ? 'incomes' : (form.type === 'fixed' ? 'subscriptions' : 'expenses'), { amount: Number(form.amount), name: form.label || form.cat, category: form.cat, day: form.day, date: new Date().toLocaleDateString('fr-CH') });
      setForm({ amount: '', label: '', cat: 'Nourriture', type: 'variable', day: '1' });
      setSubTab('journal');
    };
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 pb-24">
        <div className="flex justify-between items-center"><h2 className="text-2xl font-black">Finances</h2></div>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => setSubTab('journal')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'journal' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Journal</button>
          <button onClick={() => setSubTab('add')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Ajouter</button>
          <button onClick={() => setSubTab('config')} className={`px-4 rounded-xl ${subTab === 'config' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Target size={18}/></button>
        </div>
        {subTab === 'config' && <Card className="bg-indigo-50 border-indigo-100"><h3 className="text-sm font-black text-indigo-600 mb-4">Objectif Mensuel</h3><div className="flex gap-2"><input type="number" className="flex-1 p-4 rounded-2xl border-none font-black text-lg outline-none" placeholder="CHF" value={budgetGoal || ''} onChange={e => setBudgetGoal(Number(e.target.value))} /><div className="bg-indigo-600 text-white p-4 rounded-2xl font-black">CHF</div></div></Card>}
        {subTab === 'add' && <Card className="space-y-3"><div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-4">{[['variable', 'Dépense'], ['fixed', 'Fixe'], ['income', 'Revenu']].map(([t, l]) => (<button key={t} onClick={() => setForm({...form, type: t})} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${form.type === t ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>{l}</button>))}</div><div className="flex gap-2"><input type="number" placeholder="Montant" className="flex-1 p-4 bg-slate-50 rounded-2xl font-black text-xl outline-none" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />{form.type !== 'variable' && <div className="bg-slate-50 rounded-2xl flex items-center px-4"><span className="text-[10px] font-bold text-slate-400 mr-2">JOUR</span><select className="bg-transparent font-black text-lg outline-none" value={form.day} onChange={e => setForm({...form, day: e.target.value})}>{[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select></div>}</div><select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={form.cat} onChange={e => setForm({...form, cat: e.target.value})}>{form.type === 'income' ? CAT_REVENUS.map(c => <option key={c} value={c}>{c}</option>) : form.type === 'fixed' ? CAT_ABONNEMENTS.map(c => <option key={c} value={c}>{c}</option>) : CAT_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}</select><input type="text" placeholder="Note..." className="w-full p-4 rounded-2xl outline-none" value={form.label} onChange={e => setForm({...form, label: e.target.value})} /><Button className="w-full" onClick={handleAdd}>Sauvegarder</Button></Card>}
        {subTab === 'journal' && <div className="space-y-3 pb-20">{[...expenses, ...subscriptions, ...incomes].sort((a,b) => b.createdAt - a.createdAt).map(item => (<div key={item.id} className="flex justify-between items-center p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm"><div><p className="font-black text-sm">{item.name}</p><p className="text-[10px] text-slate-400 uppercase">{item.date} • {item.day ? `Le ${item.day}` : item.category}</p></div><div className="flex items-center gap-3"><span className="font-black text-slate-800">{Number(item.amount).toFixed(2)}</span><button onClick={() => deleteItem(item.day ? (item.amount > 0 ? 'incomes' : 'subscriptions') : (item.type === 'income' ? 'incomes' : 'expenses'), item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></div></div>))}</div>}
      </div>
    );
  };

  const ViewSport = () => {
    const [subTab, setSubTab] = useState('lib');
    const [newEx, setNewEx] = useState({ name: '', cat: 'Pectoraux', equipment: '', img: '' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [sessionConfig, setSessionConfig] = useState({});
    const [sessionName, setSessionName] = useState('Ma Séance');
    const [filterBody, setFilterBody] = useState('Tous');
    const [filterEquip, setFilterEquip] = useState('Tous');

    const handleCreateEx = () => {
      if(!newEx.name) return;
      addItem('exercise_library', newEx);
      setNewEx({ name: '', cat: 'Pectoraux', equipment: '', img: '' });
    };

    const handleSaveSession = () => {
      const exercisesData = exerciseLib.filter(ex => selectedIds.includes(ex.id)).map(ex => ({ ...ex, ...(sessionConfig[ex.id] || { sets: 4, reps: 10, weight: 0 }) }));
      addItem('workouts', { sessionName, date: new Date().toLocaleDateString('fr-CH'), exercises: exercisesData });
      setSelectedIds([]); setSubTab('hist');
    };
    
    const filteredLib = exerciseLib.filter(ex => 
      (filterBody === 'Tous' || ex.cat === filterBody) && 
      (filterEquip === 'Tous' || ex.equipment.includes(filterEquip) || (filterEquip === 'Sans matériel' && ex.equipment.toLowerCase().includes('sans')))
    );

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 pb-24">
        <h2 className="text-2xl font-black">Sport Pro 💪</h2>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => setSubTab('lib')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'lib' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Bibliothèque</button>
          <button onClick={() => setSubTab('new')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'new' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Nouveau</button>
          <button onClick={() => setSubTab('hist')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'hist' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Historique</button>
        </div>

        {subTab === 'lib' && (
          <>
            <div className="space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{BODY_PARTS.map(b => <button key={b} onClick={() => setFilterBody(b)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${filterBody === b ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>{b}</button>)}</div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{EQUIPMENTS.map(e => <button key={e} onClick={() => setFilterEquip(e)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${filterEquip === e ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>{e}</button>)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredLib.map(ex => {
                const selected = selectedIds.includes(ex.id);
                return (
                  <div key={ex.id} onClick={() => setSelectedIds(p => selected ? p.filter(i => i !== ex.id) : [...p, ex.id])} className={`bg-white rounded-[24px] overflow-hidden border relative cursor-pointer ${selected ? 'border-indigo-500 ring-2' : 'border-slate-100'}`}>
                    <img src={ex.img} className="w-full h-24 object-cover" />
                    <div className="p-3"><p className="text-[9px] font-black uppercase text-indigo-400">{ex.equipment}</p><p className="text-xs font-bold truncate">{ex.name}</p></div>
                    {selected && <div className="absolute top-2 left-2 bg-indigo-600 text-white p-1 rounded-full"><Check size={12}/></div>}
                    <button onClick={(e) => {e.stopPropagation(); deleteItem('exercise_library', ex.id)}} className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-red-500"><Trash2 size={12}/></button>
                  </div>
                );
              })}
            </div>
            {selectedIds.length > 0 && <div className="fixed bottom-24 left-4 right-4 z-40"><Button onClick={() => setSubTab('session')} className="w-full shadow-2xl">Configurer Séance ({selectedIds.length})</Button></div>}
          </>
        )}
        {subTab === 'session' && (
          <Card className="pb-20">
             <div className="flex items-center gap-2 mb-6 text-slate-400 cursor-pointer" onClick={() => setSubTab('lib')}><ArrowLeft size={16}/> <span className="text-xs font-bold uppercase">Retour</span></div>
             <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xl mb-6 outline-none" value={sessionName} onChange={e => setSessionName(e.target.value)} />
             <div className="space-y-6">
               {exerciseLib.filter(ex => selectedIds.includes(ex.id)).map(ex => (
                 <div key={ex.id}><p className="font-bold text-sm mb-2">{ex.name}</p><div className="grid grid-cols-3 gap-2"><input type="number" placeholder="Kg" className="p-3 bg-slate-50 rounded-xl text-center font-bold text-sm" onChange={e => setSessionConfig({...sessionConfig, [ex.id]: {...sessionConfig[ex.id], weight: e.target.value}})} /><input type="number" placeholder="Séries" className="p-3 bg-slate-50 rounded-xl text-center font-bold text-sm" onChange={e => setSessionConfig({...sessionConfig, [ex.id]: {...sessionConfig[ex.id], sets: e.target.value}})} /><input type="number" placeholder="Reps" className="p-3 bg-slate-50 rounded-xl text-center font-bold text-sm" onChange={e => setSessionConfig({...sessionConfig, [ex.id]: {...sessionConfig[ex.id], reps: e.target.value}})} /></div></div>
               ))}
             </div>
             <div className="mt-8"><Button onClick={handleSaveSession} className="w-full">Enregistrer</Button></div>
          </Card>
        )}
        {subTab === 'new' && (
          <Card>
            <h3 className="text-lg font-black mb-4">Nouvel Exercice</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nom (ex: Curl Barre)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newEx.name} onChange={e => setNewEx({...newEx, name: e.target.value})} />
              <input type="text" placeholder="URL Image" className="w-full p-4 bg-slate-50 rounded-2xl text-xs outline-none" value={newEx.img} onChange={e => setNewEx({...newEx, img: e.target.value})} />
              <div className="grid grid-cols-2 gap-2"><select className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newEx.cat} onChange={e => setNewEx({...newEx, cat: e.target.value})}>{BODY_PARTS.map(b => <option key={b} value={b}>{b}</option>)}</select><select className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newEx.equipment} onChange={e => setNewEx({...newEx, equipment: e.target.value})}>{EQUIPMENTS.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
              <Button onClick={handleCreateEx} className="w-full mt-4">Ajouter</Button>
            </div>
          </Card>
        )}
        {subTab === 'hist' && <div className="space-y-4 pb-20">{workouts.map(w => (<Card key={w.id} className="border-l-8 border-indigo-600"><div className="flex justify-between items-start mb-4"><div><h3 className="text-lg font-black">{w.sessionName}</h3><p className="text-xs text-slate-400 font-bold uppercase">{w.date}</p></div><button onClick={() => deleteItem('workouts', w.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></div><div className="space-y-2">{w.exercises?.map((ex, i) => (<div key={i} className="flex justify-between text-xs text-slate-600 border-t border-slate-50 pt-2"><span className="font-bold">{ex.name}</span><span>{ex.sets} x {ex.reps} {ex.weight && `(${ex.weight}kg)`}</span></div>))}</div></Card>))}</div>}
      </div>
    );
  };

  const ViewNutrition = () => {
    const [subTab, setSubTab] = useState('list');
    const [newFood, setNewFood] = useState({ name: '', calories: '', protein: '', unit: '100g' });
    const [newMeal, setNewMeal] = useState({ name: '', img: '', ingredients: [] });
    const [selectedFood, setSelectedFood] = useState('');
    const [qty, setQty] = useState('');
    const [planMode, setPlanMode] = useState(false);
    const [planData, setPlanData] = useState({ date: todayStr, type: 'Midi', meal: null });

    const handleCreateFood = () => {
      if(!newFood.name) return;
      addItem('food_library', newFood);
      setNewFood({ name: '', calories: '', protein: '', unit: '100g' });
    };

    const addIng = () => {
      if(!selectedFood) return;
      const foodInfo = foodLib.find(f => f.name === selectedFood);
      setNewMeal(prev => ({ ...prev, ingredients: [...prev.ingredients, { name: selectedFood, qty: qty, info: foodInfo }] }));
      setQty('');
    };

    const saveMeal = () => {
      if(!newMeal.name) return;
      addItem('menus', newMeal);
      setNewMeal({ name: '', img: '', ingredients: [] });
      setSubTab('list');
    };

    const handlePlan = () => {
      if(!planData.meal) return;
      addItem('daily_meals', { ...planData.meal, date: planData.date, type: planData.type });
      setPlanMode(false);
    };

    if(planMode) return (
      <div className="space-y-6 animate-in slide-in-from-right-4 pb-24">
        <h2 className="text-2xl font-black">Planifier 📅</h2>
        <Card className="space-y-4">
           <div className="grid grid-cols-2 gap-3"><input type="date" className="p-3 bg-slate-50 rounded-xl font-bold" value={planData.date.split('.').reverse().join('-')} onChange={e => setPlanData({...planData, date: new Date(e.target.value).toLocaleDateString('fr-CH')})} /><select className="p-3 bg-slate-50 rounded-xl font-bold" value={planData.type} onChange={e => setPlanData({...planData, type: e.target.value})}>{MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
           <div className="flex gap-2"><Button variant="secondary" onClick={() => setPlanMode(false)} className="flex-1">Annuler</Button><Button onClick={handlePlan} className="flex-1">Valider</Button></div>
        </Card>
      </div>
    );

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 pb-24">
        <h2 className="text-2xl font-black">Nutrition 🍱</h2>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={() => setSubTab('list')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Menus</button>
           <button onClick={() => setSubTab('add')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Créer Repas</button>
           <button onClick={() => setSubTab('food')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${subTab === 'food' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Aliments</button>
        </div>

        {subTab === 'food' && (
          <Card className="space-y-4">
             <h3 className="font-bold">Ajouter un ingrédient</h3>
             <input type="text" placeholder="Nom (ex: Avocat)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} />
             <div className="flex gap-2">
               <input type="number" placeholder="Kcal" className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none" value={newFood.calories} onChange={e => setNewFood({...newFood, calories: e.target.value})} />
               <select className="p-4 bg-slate-50 rounded-2xl outline-none" value={newFood.unit} onChange={e => setNewFood({...newFood, unit: e.target.value})}><option value="100g">100g</option><option value="unité">Unité</option></select>
             </div>
             <Button onClick={handleCreateFood} className="w-full">Ajouter à la base</Button>
             <div className="mt-6 space-y-2 max-h-60 overflow-y-auto">
               {foodLib.map(f => (
                 <div key={f.id} className="flex justify-between p-3 bg-slate-50 rounded-xl text-xs items-center">
                   <span>{f.name} ({f.calories}kcal/{f.unit})</span>
                   <button onClick={() => deleteItem('food_library', f.id)} className="text-red-500"><Trash2 size={12}/></button>
                 </div>
               ))}
             </div>
          </Card>
        )}

        {subTab === 'add' && (
          <Card className="space-y-4">
             <input type="text" placeholder="Nom du plat" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-lg outline-none" value={newMeal.name} onChange={e => setNewMeal({...newMeal, name: e.target.value})} />
             <input type="text" placeholder="URL Image" className="w-full p-4 bg-slate-50 rounded-2xl text-xs outline-none" value={newMeal.img} onChange={e => setNewMeal({...newMeal, img: e.target.value})} />
             <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
               <p className="text-xs font-black uppercase text-slate-400">Ingrédients</p>
               <div className="flex flex-col gap-2">
                 <select className="p-3 rounded-xl border-none outline-none text-sm bg-white" value={selectedFood} onChange={e => setSelectedFood(e.target.value)}>
                   <option value="">Choisir...</option>
                   {foodLib.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                 </select>
                 <div className="flex gap-2">
                    <input type="text" placeholder="Quantité (ex: 200g)" className="flex-1 p-3 rounded-xl border-none outline-none text-sm" value={qty} onChange={e => setQty(e.target.value)} />
                    <button onClick={addIng} className="bg-indigo-600 text-white p-3 rounded-xl"><Plus size={16}/></button>
                 </div>
               </div>
               <div className="space-y-1 mt-4">{newMeal.ingredients.map((ing, i) => (<div key={i} className="flex justify-between text-xs bg-white p-2 rounded-lg text-slate-600 shadow-sm"><span>{ing.name}</span><span className="font-bold">{ing.qty}</span></div>))}</div>
             </div>
             <Button onClick={saveMeal} className="w-full">Enregistrer le menu</Button>
          </Card>
        )}

        {subTab === 'list' && (
          <div className="grid grid-cols-2 gap-3">
            {menus.map(m => (
              <div key={m.id} className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm relative group">
                <img src={m.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="font-black text-sm truncate">{m.name}</p>
                  <button onClick={() => { setPlanData({ ...planData, meal: m }); setPlanMode(true); }} className="w-full mt-2 bg-indigo-50 text-indigo-600 text-[10px] font-bold py-1.5 rounded-lg uppercase">Planifier</button>
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
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-0 md:pl-72 font-sans antialiased relative">
      {/* OVERLAY */}
      {overlay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden animate-in slide-in-from-bottom-10">
             <div className="relative h-48">
               <img src={overlay.data.img || (overlay.type === 'workout' ? "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400" : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400")} className="w-full h-full object-cover" />
               <button onClick={() => setOverlay(null)} className="absolute top-4 right-4 bg-white/90 p-2 rounded-full"><X size={20}/></button>
               <div className="absolute bottom-4 left-4 text-white">
                 <p className="text-xs font-black uppercase bg-black/30 px-2 py-1 rounded-lg backdrop-blur-md inline-block mb-1">{overlay.type === 'workout' ? overlay.data.sessionName : overlay.data.type}</p>
                 <h2 className="text-2xl font-black">{overlay.data.name || overlay.data.sessionName}</h2>
               </div>
             </div>
             <div className="p-6 max-h-[50vh] overflow-y-auto">
               {overlay.type === 'workout' ? (
                 <div className="space-y-4">
                   {overlay.data.exercises?.map((ex, i) => (
                     <div key={i} className="flex items-center gap-4 border-b border-slate-50 pb-3">
                       <img src={ex.img} className="w-12 h-12 rounded-xl object-cover" />
                       <div><p className="font-bold text-sm">{ex.name}</p><p className="text-xs text-slate-500">{ex.sets} séries × {ex.reps} reps</p></div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="space-y-2">
                   <h3 className="font-black text-slate-800 mb-2">Ingrédients</h3>
                   {overlay.data.ingredients?.map((ing, i) => (
                     <div key={i} className="flex justify-between p-3 bg-slate-50 rounded-xl text-sm"><span className="text-slate-600">{ing.name}</span><span className="font-bold">{ing.qty}</span></div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

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
