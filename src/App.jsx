import { Component, computed, signal, effect, Injectable, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- INTERFACES ---

// SPORT
interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  sets: number;
  reps: number;
  weight: number;
  imageUrl?: string;
}

interface WorkoutSession {
  id: string;
  name: string;
  exercises: Exercise[];
  totalDuration: number;
}

interface ScheduledSession {
  id: string;
  date: string;
  sessionId: string;
  sessionName: string;
  completed: boolean;
}

// NUTRITION
interface Ingredient {
  id: string;
  name: string;
  baseUnit: '100g' | '1 unité'; 
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealItem {
  ingredient: Ingredient;
  quantity: number;
}

interface Meal {
  id: string;
  name: string;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface ScheduledMeal {
  id: string;
  date: string;
  mealId: string;
  mealName: string;
  type: 'Petit-déjeuner' | 'Déjeuner' | 'Dîner' | 'Collation';
  // Snapshot des valeurs au moment de l'ajout pour l'historique
  caloriesSnapshot: number;
  proteinSnapshot: number;
  carbsSnapshot: number;
  fatSnapshot: number;
}

// FINANCE
interface FinanceEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'revenu' | 'fixe' | 'variable';
  category: string;
}

// --- DATA SERVICE ---
@Injectable({ providedIn: 'root' })
class DataService {
  exercises = signal<Exercise[]>([]);
  sessions = signal<WorkoutSession[]>([]);
  ingredients = signal<Ingredient[]>([]);
  meals = signal<Meal[]>([]);

  scheduledSessions = signal<ScheduledSession[]>([]);
  scheduledMeals = signal<ScheduledMeal[]>([]);
  finances = signal<FinanceEntry[]>([]);

  monthlyBudget = signal<number>(4000); 

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const ex = localStorage.getItem('lt_exercises');
      const sess = localStorage.getItem('lt_sessions');
      const ing = localStorage.getItem('lt_ingredients');
      const m = localStorage.getItem('lt_meals');
      const f = localStorage.getItem('lt_finances');
      const ss = localStorage.getItem('lt_sched_sessions');
      const sm = localStorage.getItem('lt_sched_meals');
      const mb = localStorage.getItem('lt_budget');

      if (ex) this.exercises.set(JSON.parse(ex));
      if (sess) this.sessions.set(JSON.parse(sess));
      if (ing) this.ingredients.set(JSON.parse(ing));
      if (m) this.meals.set(JSON.parse(m));
      if (f) this.finances.set(JSON.parse(f));
      if (ss) this.scheduledSessions.set(JSON.parse(ss));
      if (sm) this.scheduledMeals.set(JSON.parse(sm));
      if (mb) this.monthlyBudget.set(JSON.parse(mb));
    } catch (e) {
      console.error("Erreur chargement", e);
    }
  }

  save() {
    localStorage.setItem('lt_exercises', JSON.stringify(this.exercises()));
    localStorage.setItem('lt_sessions', JSON.stringify(this.sessions()));
    localStorage.setItem('lt_ingredients', JSON.stringify(this.ingredients()));
    localStorage.setItem('lt_meals', JSON.stringify(this.meals()));
    localStorage.setItem('lt_finances', JSON.stringify(this.finances()));
    localStorage.setItem('lt_sched_sessions', JSON.stringify(this.scheduledSessions()));
    localStorage.setItem('lt_sched_meals', JSON.stringify(this.scheduledMeals()));
    localStorage.setItem('lt_budget', JSON.stringify(this.monthlyBudget()));
  }

  injectData() {
    const exs: Exercise[] = [
      { id: 'ex1', name: 'Développé Couché', bodyPart: 'Pectoraux', equipment: 'Barre', sets: 4, reps: 10, weight: 80, imageUrl: "https://placehold.co/60x60/3b82f6/white?text=Bench" },
      { id: 'ex2', name: 'Squat', bodyPart: 'Jambes', equipment: 'Barre', sets: 4, reps: 8, weight: 100, imageUrl: "https://placehold.co/60x60/3b82f6/white?text=Squat" },
      { id: 'ex3', name: 'Tractions', bodyPart: 'Dos', equipment: 'Poids du corps', sets: 3, reps: 12, weight: 0, imageUrl: "https://placehold.co/60x60/3b82f6/white?text=PullUp" }
    ];
    this.exercises.set(exs);

    const sess: WorkoutSession = {
      id: 'sess1',
      name: 'Full Body A',
      exercises: [exs[0], exs[1], exs[2]],
      totalDuration: 60
    };
    this.sessions.set([sess]);

    const ings: Ingredient[] = [
      { id: 'ing1', name: 'Poulet (cru)', baseUnit: '100g', calories: 120, protein: 23, carbs: 0, fat: 2.5 },
      { id: 'ing2', name: 'Riz Basmati (cuit)', baseUnit: '100g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      { id: 'ing3', name: 'Oeuf', baseUnit: '1 unité', calories: 70, protein: 6, carbs: 0.5, fat: 5 },
      { id: 'ing4', name: 'Huile d\'olive', baseUnit: '100g', calories: 884, protein: 0, carbs: 0, fat: 100 }
    ];
    this.ingredients.set(ings);

    const meal: Meal = {
      id: 'meal1',
      name: 'Post-Workout',
      items: [
        { ingredient: ings[0], quantity: 150 },
        { ingredient: ings[1], quantity: 200 },
        { ingredient: ings[3], quantity: 10 }
      ],
      totalCalories: (120*1.5) + (130*2) + (884*0.1),
      totalProtein: (23*1.5) + (2.7*2) + 0,
      totalCarbs: (0*1.5) + (28*2) + 0,
      totalFat: (2.5*1.5) + (0.3*2) + (100*0.1)
    };
    this.meals.set([meal]);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Ajout de données sur plusieurs mois pour tester le filtre
    const f: FinanceEntry[] = [
      { id: 'f1', date: todayStr, description: 'Salaire', amount: 5000, type: 'revenu', category: 'Salaire' },
      { id: 'f2', date: todayStr, description: 'Loyer', amount: 1500, type: 'fixe', category: 'Logement' }
    ];
    this.finances.set(f);

    this.save();
  }

  reset() {
    this.exercises.set([]);
    this.sessions.set([]);
    this.ingredients.set([]);
    this.meals.set([]);
    this.scheduledSessions.set([]);
    this.scheduledMeals.set([]);
    this.finances.set([]);
    localStorage.clear();
  }
}

// --- MAIN COMPONENT ---

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe, CurrencyPipe],
  template: `
    <div class="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-blue-600 selection:text-white">
      
      <!-- SIDEBAR -->
      <aside class="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-2xl">
        <div class="p-6 border-b border-slate-800 bg-slate-900">
          <h1 class="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
            Life<span class="text-blue-500">Track</span>
          </h1>
        </div>

        <nav class="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          <button (click)="activeTab.set('home')" [class]="activeTab() === 'home' ? 'bg-blue-600/10 text-blue-400 border-blue-600' : 'text-slate-400 hover:bg-slate-800 border-transparent'" class="w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold transition-all border-l-4 rounded-r-lg">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
             <span>ACCUEIL</span>
          </button>
          
          <button (click)="activeTab.set('sport')" [class]="activeTab() === 'sport' ? 'bg-blue-600/10 text-blue-400 border-blue-600' : 'text-slate-400 hover:bg-slate-800 border-transparent'" class="w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold transition-all border-l-4 rounded-r-lg">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
             <span>SPORT</span>
          </button>

          <button (click)="activeTab.set('nutrition')" [class]="activeTab() === 'nutrition' ? 'bg-blue-600/10 text-blue-400 border-blue-600' : 'text-slate-400 hover:bg-slate-800 border-transparent'" class="w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold transition-all border-l-4 rounded-r-lg">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-2.8Z"/><path d="M7 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2.8Z"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2v-2.8Z"/><rect width="18" height="14" x="3" y="6" rx="2"/><path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"/></svg>
             <span>NUTRITION</span>
          </button>

          <button (click)="activeTab.set('finance')" [class]="activeTab() === 'finance' ? 'bg-blue-600/10 text-blue-400 border-blue-600' : 'text-slate-400 hover:bg-slate-800 border-transparent'" class="w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold transition-all border-l-4 rounded-r-lg">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
             <span>FINANCES</span>
          </button>
        </nav>

        <div class="p-4 border-t border-slate-800">
           <button (click)="activeTab.set('data')" class="text-xs text-slate-500 hover:text-blue-400 transition w-full text-left pl-4 flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
             Système
           </button>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-10 relative scroll-smooth">
        
        <!-- --- ACCUEIL (DASHBOARD) --- -->
        <div *ngIf="activeTab() === 'home'" class="max-w-7xl mx-auto space-y-8 animate-fade">
          <header class="border-b border-slate-800 pb-6">
            <h2 class="text-3xl font-bold text-white mb-1">Tableau de bord</h2>
            <p class="text-slate-400">{{ today | date:'EEEE dd MMMM yyyy' }}</p>
          </header>

          <!-- 1. FINANCES -->
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Solde & Budget -->
            <div class="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
               <div class="flex justify-between items-start mb-6 relative z-10">
                 <div>
                   <p class="text-sm text-slate-500 uppercase tracking-wider font-semibold">Solde Disponible (Global)</p>
                   <p [class]="totalBalance() >= 0 ? 'text-white' : 'text-rose-400'" class="text-5xl font-bold mt-2 tracking-tight">
                     CHF {{ totalBalance() | number:'1.2-2' }}
                   </p>
                 </div>
                 <div class="text-right">
                    <p class="text-sm text-slate-500 uppercase tracking-wider font-semibold">Budget Mensuel</p>
                    <input type="number" [ngModel]="dataService.monthlyBudget()" (ngModelChange)="updateBudget($event)" 
                           class="bg-transparent border-b border-slate-700 text-right text-xl font-bold text-slate-300 w-32 focus:outline-none focus:border-blue-500 mt-2">
                 </div>
               </div>
               <div class="h-6 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700 z-10">
                  <div class="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-500" [style.width.%]="budgetPercent()"></div>
               </div>
               <div class="mt-2 flex justify-between text-xs font-semibold uppercase text-slate-400 z-10 relative">
                  <span>Dépensé: CHF {{ totalExpenses() | number:'1.2-2' }}</span>
                  <span>Reste: CHF {{ remainingBudget() | number:'1.2-2' }}</span>
               </div>
            </div>

            <!-- Echéances -->
            <div class="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col">
               <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">À venir</h3>
               <div class="flex-1 overflow-y-auto space-y-3 max-h-40">
                  <div *ngIf="upcomingPayments().length === 0" class="text-slate-600 italic text-sm">Rien de prévu.</div>
                  <div *ngFor="let p of upcomingPayments()" class="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-800">
                     <div class="min-w-0">
                        <div class="text-white font-bold truncate text-sm">{{ p.description }}</div>
                        <div class="text-[10px] text-slate-500">{{ p.date | date:'dd/MM' }} • {{ p.category }}</div>
                     </div>
                     <span class="text-rose-400 font-bold text-sm ml-2">CHF {{ p.amount | number:'1.0-0' }}</span>
                  </div>
               </div>
            </div>
          </section>

          <!-- 2. SPORT & NUTRITION -->
          <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Widget Sport -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-0 overflow-hidden shadow-lg flex flex-col">
               <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <h3 class="text-lg font-bold text-white flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                     Prochaine Séance
                  </h3>
               </div>
               <div *ngIf="nextSession(); else noSession" class="p-6 cursor-pointer hover:bg-slate-800/50 transition flex-1 flex flex-col justify-center" (click)="openSessionDetail(nextSession()!)">
                  <p class="text-2xl font-bold text-white mb-1">{{ nextSession()!.sessionName }}</p>
                  <p class="text-sm text-blue-400 uppercase font-bold tracking-widest">{{ nextSession()!.date | date:'EEEE dd MMMM' }}</p>
                  <div class="mt-4 text-xs text-slate-500 flex items-center gap-2">
                     <span class="w-2 h-2 rounded-full bg-blue-500"></span> Voir les détails
                  </div>
               </div>
               <ng-template #noSession><div class="p-8 text-center text-slate-500 italic">Aucune séance planifiée.</div></ng-template>
            </div>

            <!-- Widget Nutrition -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-0 overflow-hidden shadow-lg">
               <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <h3 class="text-lg font-bold text-white flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 17h11"/><path d="M6 20h12a1 1 0 0 0 1-1v-5c0-2.5-2-6.5-7-8-5 1.5-7 5.5-7 8v5a1 1 0 0 0 1 1Z"/><path d="M6 9v5"/></svg>
                     Total Journalier
                  </h3>
               </div>
               <div class="p-6 text-center">
                  <div class="text-5xl font-extrabold text-white mb-2 tracking-tight">{{ todaysMacros().cal | number:'1.0-0' }} <span class="text-lg font-normal text-slate-500">kcal</span></div>
                  <div class="flex justify-center gap-6 mt-4">
                     <div class="text-center">
                        <div class="text-emerald-400 font-bold text-xl">{{ todaysMacros().prot | number:'1.0-0' }}g</div>
                        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Prot</div>
                     </div>
                     <div class="text-center">
                        <div class="text-amber-400 font-bold text-xl">{{ todaysMacros().carb | number:'1.0-0' }}g</div>
                        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Gluc</div>
                     </div>
                     <div class="text-center">
                        <div class="text-rose-400 font-bold text-xl">{{ todaysMacros().fat | number:'1.0-0' }}g</div>
                        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Lip</div>
                     </div>
                  </div>
               </div>
            </div>
          </section>
        </div>

        <!-- --- FINANCES TAB --- -->
        <div *ngIf="activeTab() === 'finance'" class="max-w-7xl mx-auto space-y-6 animate-fade">
           <!-- DATE SELECTOR -->
           <div class="flex justify-between items-center bg-slate-900 p-4 rounded-lg border border-slate-800">
              <h2 class="text-white font-bold text-xl flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                 Gestion Financière
              </h2>
              <div class="flex gap-2">
                 <select [ngModel]="selectedFinanceMonth" (ngModelChange)="selectedFinanceMonth.set($event)" class="bg-slate-800 border border-slate-700 text-white p-2 rounded text-sm focus:border-blue-500 outline-none">
                    <option *ngFor="let m of months; let i = index" [value]="i">{{ m }}</option>
                 </select>
                 <select [ngModel]="selectedFinanceYear" (ngModelChange)="selectedFinanceYear.set($event)" class="bg-slate-800 border border-slate-700 text-white p-2 rounded text-sm focus:border-blue-500 outline-none">
                    <option *ngFor="let y of years" [value]="y">{{ y }}</option>
                 </select>
              </div>
           </div>

           <!-- MONTHLY SUMMARY -->
           <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-slate-900 p-4 rounded-lg border border-slate-800">
                 <p class="text-xs text-slate-500 uppercase font-bold">Total Revenus ({{ months[selectedFinanceMonth()] }})</p>
                 <p class="text-2xl font-bold text-emerald-400 mt-1">CHF {{ monthlyStats().income | number:'1.2-2' }}</p>
              </div>
              <div class="bg-slate-900 p-4 rounded-lg border border-slate-800">
                 <p class="text-xs text-slate-500 uppercase font-bold">Total Dépenses ({{ months[selectedFinanceMonth()] }})</p>
                 <p class="text-2xl font-bold text-rose-400 mt-1">CHF {{ monthlyStats().expenses | number:'1.2-2' }}</p>
              </div>
              <div class="bg-slate-900 p-4 rounded-lg border border-slate-800">
                 <p class="text-xs text-slate-500 uppercase font-bold">Solde du mois</p>
                 <p class="text-2xl font-bold mt-1" [class]="monthlyStats().balance >= 0 ? 'text-blue-400' : 'text-orange-400'">
                    CHF {{ monthlyStats().balance | number:'1.2-2' }}
                 </p>
              </div>
           </div>

           <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <!-- ADD TRANSACTION -->
              <div class="lg:col-span-1 bg-slate-900 p-6 border border-slate-800 rounded-lg h-fit">
                 <h3 class="text-white font-bold mb-4">Ajouter Transaction</h3>
                 <div class="space-y-4">
                    <div class="flex gap-2 mb-2">
                       <button *ngFor="let t of ['fixe', 'variable', 'revenu']" (click)="setTransType(t)" 
                          [class]="newTransaction.type === t ? (t === 'revenu' ? 'bg-emerald-600 border-emerald-600 text-white' : (t === 'fixe' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-orange-600 border-orange-600 text-white')) : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'"
                          class="flex-1 py-2 rounded text-xs uppercase font-bold border transition capitalize">{{ t }}</button>
                    </div>
                    <input type="date" [(ngModel)]="newTransaction.date" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded">
                    <input type="number" [(ngModel)]="newTransaction.amount" placeholder="Montant CHF" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded">
                    <select [(ngModel)]="newTransaction.category" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded">
                       <option value="" disabled selected>Choisir une catégorie...</option>
                       <option *ngFor="let cat of getCategories(newTransaction.type)" [value]="cat">{{ cat }}</option>
                    </select>
                    <input type="text" [(ngModel)]="newTransaction.description" placeholder="Note / Libellé (Optionnel)" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded">
                    <button (click)="addTransaction()" [disabled]="!newTransaction.amount || !newTransaction.category" class="w-full bg-blue-600 disabled:opacity-50 text-white py-3 rounded font-bold uppercase mt-2">Valider</button>
                 </div>
              </div>

              <!-- TRANSACTION LIST (FILTERED) -->
              <div class="lg:col-span-2">
                 <table class="w-full text-left text-sm text-slate-400">
                    <thead class="bg-slate-900 text-white"><tr><th class="p-3">Date</th><th class="p-3">Catégorie / Note</th><th class="p-3 text-right">Montant</th><th></th></tr></thead>
                    <tbody class="divide-y divide-slate-800">
                       <tr *ngIf="filteredTransactions().length === 0">
                          <td colspan="4" class="p-8 text-center italic text-slate-600">Aucune transaction pour ce mois.</td>
                       </tr>
                       <tr *ngFor="let t of filteredTransactions()" class="hover:bg-slate-900 transition">
                          <td class="p-3">
                             <div class="text-white">{{ t.date | date:'dd/MM' }}</div>
                             <div class="text-[10px] uppercase font-bold mt-1" [class]="t.type === 'revenu' ? 'text-emerald-500' : (t.type === 'fixe' ? 'text-rose-500' : 'text-orange-500')">{{ t.type }}</div>
                          </td>
                          <td class="p-3">
                             <div class="text-white font-bold">{{ t.category }}</div>
                             <div class="text-xs text-slate-500 italic">{{ t.description }}</div>
                          </td>
                          <td class="p-3 text-right font-bold text-lg" [class.text-emerald-400]="t.type === 'revenu'" [class.text-rose-400]="t.type !== 'revenu'">
                             {{ t.type === 'revenu' ? '+' : '-' }}CHF {{ t.amount | number:'1.2-2' }}
                          </td>
                          <td class="p-3 text-right"><button (click)="deleteTransaction(t.id)" class="text-slate-600 hover:text-rose-500">×</button></td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        <!-- --- SPORT TAB (UNCHANGED LOGIC, RENDERED) --- -->
        <div *ngIf="activeTab() === 'sport'" class="max-w-7xl mx-auto space-y-6 animate-fade">
           <header class="flex gap-4 border-b border-slate-800 pb-4 mb-6 sticky top-0 bg-slate-950 z-10 pt-2">
              <button *ngFor="let v of ['schedule', 'library', 'sessions']" (click)="sportView = v" [class]="sportView === v ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'" class="px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition">{{ v === 'schedule' ? 'Planning' : v === 'library' ? 'Bibliothèque' : 'Création' }}</button>
           </header>
           
           <div *ngIf="sportView === 'schedule'">
              <h3 class="text-white font-bold mb-4 flex items-center gap-2"><span class="w-2 h-2 bg-blue-500 rounded-full"></span>Choisir une séance à planifier</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                 <div *ngFor="let s of dataService.sessions()" (click)="selectSessionForPlanning(s)" class="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-blue-500 cursor-pointer transition group shadow-lg">
                    <h4 class="text-white font-bold text-lg group-hover:text-blue-400 transition">{{ s.name }}</h4>
                    <p class="text-slate-500 text-sm mt-1">{{ s.exercises.length }} exercices • {{ s.totalDuration }} min</p>
                    <div class="mt-4 flex gap-1"><span *ngFor="let ex of s.exercises.slice(0,3)" class="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">{{ ex.name }}</span></div>
                 </div>
              </div>
              <h3 class="text-white font-bold mb-4 pt-6 border-t border-slate-800">Calendrier des Séances</h3>
              <div class="space-y-2">
                 <div *ngFor="let s of sortedScheduledSessions()" class="flex items-center bg-slate-900 border border-slate-800 p-4 rounded hover:border-slate-700 transition">
                    <div class="w-16 text-center border-r border-slate-800 pr-4 mr-4"><div class="text-xs text-slate-500 uppercase font-bold">{{ s.date | date:'MMM' }}</div><div class="text-2xl font-bold text-white">{{ s.date | date:'dd' }}</div></div>
                    <div class="flex-1 cursor-pointer" (click)="openSessionDetail(s)"><div class="text-white font-bold text-lg">{{ s.sessionName }}</div><div class="text-xs text-blue-400">Voir le détail</div></div>
                    <button (click)="removeScheduledSession(s.id)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-900/50 text-slate-600 hover:text-rose-500 transition">×</button>
                 </div>
              </div>
           </div>

           <div *ngIf="sportView === 'library'" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div class="lg:col-span-1 space-y-6">
                 <div class="bg-slate-900 p-5 rounded-lg border border-slate-800">
                    <h3 class="text-white font-bold mb-4 flex justify-between"><span>{{ editingExercise ? 'Modifier' : 'Ajouter' }}</span><button *ngIf="editingExercise" (click)="cancelEditExercise()" class="text-xs text-rose-400">Annuler</button></h3>
                    <div class="space-y-3 text-sm">
                       <input [(ngModel)]="exerciseForm.name" placeholder="Nom" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded">
                       <input [(ngModel)]="exerciseForm.bodyPart" placeholder="Partie du corps" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded">
                       <input [(ngModel)]="exerciseForm.equipment" placeholder="Matériel" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded">
                       <input [(ngModel)]="exerciseForm.imageUrl" placeholder="URL Image" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded">
                       <div class="grid grid-cols-3 gap-2"><input type="number" [(ngModel)]="exerciseForm.sets" placeholder="Séries" class="bg-slate-800 border border-slate-700 text-white p-2 rounded text-center"><input type="number" [(ngModel)]="exerciseForm.reps" placeholder="Reps" class="bg-slate-800 border border-slate-700 text-white p-2 rounded text-center"><input type="number" [(ngModel)]="exerciseForm.weight" placeholder="Kg" class="bg-slate-800 border border-slate-700 text-white p-2 rounded text-center"></div>
                       <button (click)="saveExercise()" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold uppercase text-xs">{{ editingExercise ? 'Mettre à jour' : 'Ajouter' }}</button>
                    </div>
                 </div>
              </div>
              <div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                 <div *ngFor="let ex of filteredExercises()" class="bg-slate-900 border border-slate-800 rounded-lg p-4 flex gap-4 hover:border-blue-600 transition group relative">
                    <button (click)="editExercise(ex)" class="absolute top-2 right-2 text-slate-600 hover:text-blue-400 transition opacity-0 group-hover:opacity-100">✎</button>
                    <div class="w-16 h-16 bg-slate-800 rounded flex-shrink-0 overflow-hidden border border-slate-700 relative"><img *ngIf="ex.imageUrl" [src]="ex.imageUrl" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"><div *ngIf="!ex.imageUrl" class="w-full h-full flex items-center justify-center text-xs text-slate-600">Img</div></div>
                    <div class="flex-1 min-w-0">
                       <h4 class="text-white font-bold truncate pr-4">{{ ex.name }}</h4>
                       <p class="text-xs text-blue-400 uppercase font-bold mt-1">{{ ex.bodyPart }}</p>
                       <div class="mt-3 flex gap-2 text-xs">
                          <div class="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300"><span class="text-slate-500 text-[10px] uppercase block">Séries</span>{{ ex.sets }}</div>
                          <div class="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300"><span class="text-slate-500 text-[10px] uppercase block">Reps</span>{{ ex.reps }}</div>
                          <div class="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300"><span class="text-slate-500 text-[10px] uppercase block">Kg</span>{{ ex.weight }}</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div *ngIf="sportView === 'sessions'" class="bg-slate-900 p-8 rounded-lg border border-slate-800 text-center">
              <div class="flex gap-4 mb-4"><input [(ngModel)]="newSessionName" placeholder="Nom de la séance" class="flex-1 bg-slate-800 border border-slate-700 text-white p-2 rounded"><button (click)="saveSession()" class="bg-blue-600 text-white px-4 py-2 rounded">Sauvegarder</button></div>
              <div class="grid grid-cols-2 gap-4 text-left">
                 <div class="border border-slate-700 p-4 rounded"><h4 class="text-white font-bold mb-2">Inclus</h4><div *ngFor="let ex of newSessionExercises" class="flex justify-between p-2 bg-slate-800 mb-1 rounded text-sm text-slate-300"><span>{{ ex.name }}</span><button (click)="removeExFromSession(ex)" class="text-rose-400">x</button></div></div>
                 <div class="border border-slate-700 p-4 rounded max-h-96 overflow-y-auto"><h4 class="text-white font-bold mb-2">Disponible</h4><div *ngFor="let ex of dataService.exercises()" (click)="addExToSession(ex)" class="p-2 hover:bg-slate-800 cursor-pointer text-slate-400 hover:text-white text-sm">+ {{ ex.name }}</div></div>
              </div>
           </div>
        </div>

        <!-- --- NUTRITION TAB --- -->
        <div *ngIf="activeTab() === 'nutrition'" class="max-w-7xl mx-auto space-y-6 animate-fade">
           <header class="flex gap-4 border-b border-slate-800 pb-4 mb-6 sticky top-0 bg-slate-950 z-10 pt-2">
              <button *ngFor="let v of ['schedule', 'ingredients', 'meals']" (click)="nutriView = v" [class]="nutriView === v ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'" class="px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition">{{ v === 'schedule' ? 'Menu' : v === 'ingredients' ? 'Aliments' : 'Recettes' }}</button>
           </header>
           
           <div *ngIf="nutriView === 'schedule'">
              <h3 class="text-white font-bold mb-4 flex items-center gap-2"><span class="w-2 h-2 bg-emerald-500 rounded-full"></span>Choisir un repas à planifier</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                 <div *ngFor="let m of dataService.meals()" (click)="selectMealForPlanning(m)" class="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-emerald-500 cursor-pointer transition group shadow-lg">
                    <h4 class="text-white font-bold text-lg group-hover:text-emerald-400 transition">{{ m.name }}</h4>
                    <div class="mt-4"><span class="text-2xl font-bold text-white">{{ m.totalCalories | number:'1.0-0' }}</span> <span class="text-slate-500 text-sm">kcal</span></div>
                    <div class="flex gap-4 mt-2 text-xs text-slate-400"><span><b class="text-emerald-400">{{ m.totalProtein | number:'1.0-0' }}g</b> Prot</span><span><b class="text-amber-400">{{ m.totalCarbs | number:'1.0-0' }}g</b> Gluc</span><span><b class="text-rose-400">{{ m.totalFat | number:'1.0-0' }}g</b> Lip</span></div>
                 </div>
              </div>
              <h3 class="text-white font-bold mb-4 pt-6 border-t border-slate-800">Menu Planifié</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div *ngFor="let m of sortedScheduledMeals()" (click)="openMealDetail(m)" class="bg-slate-900 border border-slate-800 p-4 rounded hover:border-emerald-500 cursor-pointer transition relative group">
                    <button (click)="removeScheduledMeal(m.id); $event.stopPropagation()" class="absolute top-2 right-2 text-rose-500 opacity-0 group-hover:opacity-100 transition">×</button>
                    <div class="text-xs text-slate-500 uppercase font-bold">{{ m.date | date:'dd/MM' }} - {{ m.type }}</div>
                    <div class="text-white font-bold text-lg mt-1 truncate">{{ m.mealName }}</div>
                    <div class="text-emerald-400 text-sm font-mono mt-2">{{ m.caloriesSnapshot | number:'1.0-0' }} kcal</div>
                 </div>
              </div>
           </div>

           <div *ngIf="nutriView === 'ingredients'">
               <div class="bg-slate-900 p-6 rounded-lg border border-slate-800">
                  <h3 class="text-white font-bold mb-6">Ajout Nouvel Aliment (Base)</h3>
                  <div class="grid grid-cols-6 gap-4 items-end mb-6">
                     <div class="col-span-2"><label class="text-xs text-slate-500 uppercase">Nom</label><input [(ngModel)]="newIngredient.name" placeholder="Ex: Avoine" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded"></div>
                     <div class="col-span-1"><label class="text-xs text-slate-500 uppercase">Unité</label><select [(ngModel)]="newIngredient.baseUnit" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded text-sm"><option value="100g">100g</option><option value="1 unité">1 Unité</option></select></div>
                     <div class="col-span-1"><label class="text-xs text-slate-500 uppercase">Kcal</label><input type="number" [(ngModel)]="newIngredient.calories" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded"></div>
                     <div class="col-span-1"><label class="text-xs text-slate-500 uppercase">Macros (P/G/L)</label><div class="flex gap-1"><input type="number" [(ngModel)]="newIngredient.protein" placeholder="P" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded text-xs text-center"><input type="number" [(ngModel)]="newIngredient.carbs" placeholder="G" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded text-xs text-center"><input type="number" [(ngModel)]="newIngredient.fat" placeholder="L" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded text-xs text-center"></div></div>
                     <button (click)="addIngredient()" class="col-span-1 bg-emerald-600 text-white px-4 py-2 rounded mb-[1px]">AJOUTER</button>
                  </div>
                  <div class="overflow-x-auto">
                     <table class="w-full text-left text-sm text-slate-400">
                        <thead class="bg-slate-950 text-slate-200 uppercase text-xs"><tr><th class="p-3">Nom</th><th class="p-3">Base</th><th class="p-3 text-right">Kcal</th><th class="p-3 text-right">Prot</th><th class="p-3 text-right">Gluc</th><th class="p-3 text-right">Lip</th></tr></thead>
                        <tbody>
                           <tr *ngFor="let i of dataService.ingredients()" class="border-b border-slate-800 hover:bg-slate-800/50">
                              <td class="p-3 text-white">{{ i.name }}</td><td class="p-3">{{ i.baseUnit }}</td><td class="p-3 text-right font-mono">{{ i.calories }}</td><td class="p-3 text-right font-mono text-emerald-400">{{ i.protein }}</td><td class="p-3 text-right font-mono text-amber-400">{{ i.carbs }}</td><td class="p-3 text-right font-mono text-rose-400">{{ i.fat }}</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
               </div>
           </div>
           
           <div *ngIf="nutriView === 'meals'" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div class="bg-slate-900 p-6 rounded-lg border border-slate-800">
                 <h3 class="text-white font-bold mb-4">Composer une Recette</h3>
                 <input [(ngModel)]="newMealName" placeholder="Nom Recette (ex: Petit Dej Sport)" class="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded mb-4">
                 <div class="border border-slate-700 p-2 min-h-[150px] rounded mb-4 bg-slate-950/50">
                    <div *ngFor="let item of newMealItems" class="flex justify-between items-center p-2 bg-slate-800 mb-1 rounded text-sm">
                       <div><span class="text-white">{{ item.ingredient.name }}</span><span class="text-slate-500 ml-2 text-xs">{{ item.quantity }}{{ item.ingredient.baseUnit === '100g' ? 'g' : ' ut' }}</span></div>
                       <div class="flex items-center gap-3"><span class="text-emerald-400 font-mono text-xs">{{ calculateItemCalories(item) | number:'1.0-0' }} kcal</span><button (click)="removeIngFromMeal(item)" class="text-rose-500 hover:text-rose-400">×</button></div>
                    </div>
                    <div *ngIf="newMealItems.length === 0" class="text-center text-slate-600 text-xs py-10">Ajoutez des aliments depuis la liste</div>
                 </div>
                 <div class="flex justify-between items-end border-t border-slate-800 pt-4 mb-4"><span class="text-slate-400 uppercase text-xs font-bold">Total Recette</span><span class="text-3xl font-bold text-emerald-400">{{ getNewMealTotals().cal | number:'1.0-0' }} kcal</span></div>
                 <button (click)="saveMeal()" [disabled]="!newMealName || newMealItems.length === 0" class="w-full bg-emerald-600 disabled:opacity-50 text-white py-3 rounded font-bold uppercase tracking-widest">Sauvegarder</button>
              </div>
              <div class="bg-slate-900 p-6 rounded-lg border border-slate-800">
                 <h3 class="text-white font-bold mb-4">Ajouter un ingrédient</h3>
                 <div class="bg-slate-800 p-4 rounded mb-4 border border-slate-700" *ngIf="selectedIngredientForAdd">
                    <p class="text-white font-bold mb-2">{{ selectedIngredientForAdd.name }}</p>
                    <div class="flex gap-2"><input type="number" [(ngModel)]="quantityToAdd" class="flex-1 bg-slate-950 border border-slate-600 text-white p-2 rounded" placeholder="Quantité"><div class="flex items-center text-slate-400 text-sm px-2 bg-slate-900 rounded border border-slate-700">{{ selectedIngredientForAdd.baseUnit === '100g' ? 'grammes' : 'unités' }}</div><button (click)="confirmAddIngredient()" class="bg-emerald-600 text-white px-4 rounded font-bold">OK</button></div>
                 </div>
                 <div class="space-y-1 h-96 overflow-y-auto pr-2">
                    <div *ngFor="let i of dataService.ingredients()" (click)="selectIngredient(i)" class="flex justify-between items-center p-3 border border-slate-700 hover:bg-slate-800 transition cursor-pointer rounded group">
                       <div class="text-sm text-slate-200 group-hover:text-white">{{ i.name }}</div><div class="text-xs text-slate-500 font-mono">{{ i.calories }} kcal / {{ i.baseUnit }}</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <!-- --- DATA ADMIN --- -->
        <div *ngIf="activeTab() === 'data'" class="text-center pt-20">
           <h2 class="text-2xl text-white font-bold mb-4">Administration</h2>
           <div class="flex justify-center gap-4">
              <button (click)="dataService.injectData()" class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-500">Injecter Démo</button>
              <button (click)="dataService.reset()" class="bg-rose-600 text-white px-6 py-3 rounded hover:bg-rose-500">Tout Effacer</button>
           </div>
        </div>

      </main>

      <!-- --- MODALS --- -->
      
      <!-- Session Detail & Planning Modal -->
      <div *ngIf="sessionModalData" class="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
         <div class="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
               <div><h3 class="text-2xl font-bold text-white">{{ sessionModalData.name }}</h3><p class="text-blue-400 uppercase font-bold text-sm" *ngIf="planningMode">Planification</p><p class="text-blue-400 uppercase font-bold text-sm" *ngIf="!planningMode">{{ sessionModalData.date | date:'EEEE dd MMMM' }}</p></div>
               <button (click)="closeSessionModal()" class="w-8 h-8 rounded-full bg-slate-800 text-white hover:bg-rose-600 transition">✕</button>
            </div>
            <div class="p-6 overflow-y-auto space-y-4 flex-1">
               <div *ngFor="let ex of sessionModalData.exercises" class="flex gap-4 items-start bg-slate-800/50 p-4 rounded-lg border border-slate-800">
                  <div class="w-20 h-20 bg-slate-900 rounded overflow-hidden flex-shrink-0"><img *ngIf="ex.imageUrl" [src]="ex.imageUrl" class="w-full h-full object-cover"><div *ngIf="!ex.imageUrl" class="w-full h-full flex items-center justify-center text-xs text-slate-600">Img</div></div>
                  <div><div class="text-white font-bold text-lg">{{ ex.name }}</div><div class="text-sm text-blue-400 font-bold uppercase">{{ ex.bodyPart }} - {{ ex.equipment }}</div><div class="mt-2 flex gap-2 text-xs"><div class="bg-slate-900 px-2 py-1 rounded border border-slate-700 text-slate-300"><b>{{ ex.sets }}</b> Séries</div><div class="bg-slate-900 px-2 py-1 rounded border border-slate-700 text-slate-300"><b>{{ ex.reps }}</b> Reps</div><div class="bg-slate-900 px-2 py-1 rounded border border-slate-700 text-slate-300"><b>{{ ex.weight }}</b> kg</div></div></div>
               </div>
            </div>
            <div *ngIf="planningMode" class="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-4 items-center">
               <input type="date" [(ngModel)]="scheduleData.date" class="bg-slate-800 border border-slate-700 text-white p-2 rounded"><button (click)="confirmScheduleSession()" class="bg-blue-600 text-white px-6 py-2 rounded font-bold uppercase">Confirmer Planification</button>
            </div>
         </div>
      </div>

      <!-- Meal Detail & Planning Modal -->
      <div *ngIf="mealModalData" class="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
         <div class="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
               <div><h3 class="text-2xl font-bold text-white">{{ mealModalData.name }}</h3><p class="text-emerald-400 uppercase font-bold text-sm" *ngIf="planningMode">Planification</p></div>
               <button (click)="closeMealModal()" class="w-8 h-8 rounded-full bg-slate-800 text-white hover:bg-rose-600 transition">✕</button>
            </div>
            <div class="p-6 overflow-y-auto flex-1">
               <div class="flex justify-between mb-6 bg-slate-800/50 p-4 rounded border border-slate-800">
                  <div class="text-center"><span class="block text-2xl font-bold text-white">{{ mealModalData.totalCalories | number:'1.0-0' }}</span><span class="text-xs uppercase text-slate-500">Kcal</span></div>
                  <div class="text-center"><span class="block text-xl font-bold text-emerald-400">{{ mealModalData.totalProtein | number:'1.0-0' }}g</span><span class="text-xs uppercase text-slate-500">Prot</span></div>
                  <div class="text-center"><span class="block text-xl font-bold text-amber-400">{{ mealModalData.totalCarbs | number:'1.0-0' }}g</span><span class="text-xs uppercase text-slate-500">Gluc</span></div>
                  <div class="text-center"><span class="block text-xl font-bold text-rose-400">{{ mealModalData.totalFat | number:'1.0-0' }}g</span><span class="text-xs uppercase text-slate-500">Lip</span></div>
               </div>
               <h4 class="text-slate-500 uppercase tracking-widest text-xs font-bold mb-4">Ingrédients</h4>
               <ul class="space-y-2">
                  <li *ngFor="let item of (planningMode ? mealModalData.items : getMealItems(mealModalData.id))" class="flex justify-between items-center border-b border-slate-800 pb-2">
                     <div><span class="text-slate-200 block">{{ item.ingredient.name }}</span><span class="text-slate-500 text-xs">{{ item.quantity }}{{ item.ingredient.baseUnit === '100g' ? 'g' : ' ut' }}</span></div>
                     <span class="text-slate-400 font-mono text-sm" *ngIf="planningMode">{{ calculateItemCalories(item) | number:'1.0-0' }} kcal</span>
                  </li>
               </ul>
            </div>
            <div *ngIf="planningMode" class="p-6 border-t border-slate-800 bg-slate-950 space-y-4">
               <div class="flex gap-4">
                  <input type="date" [(ngModel)]="scheduleMealData.date" class="bg-slate-800 border border-slate-700 text-white p-2 rounded flex-1">
                  <select [(ngModel)]="scheduleMealData.type" class="bg-slate-800 border border-slate-700 text-white p-2 rounded flex-1"><option value="Petit-déjeuner">Petit-déjeuner</option><option value="Déjeuner">Déjeuner</option><option value="Dîner">Dîner</option><option value="Collation">Collation</option></select>
               </div>
               <button (click)="confirmScheduleMeal()" class="w-full bg-emerald-600 text-white py-3 rounded font-bold uppercase">Ajouter au Menu</button>
            </div>
         </div>
      </div>

    </div>
  `,
  styles: [`
    .animate-fade { animation: fade 0.3s ease-out; }
    @keyframes fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #020617; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }
  `]
})
export class App {
  dataService = inject(DataService);
  activeTab = signal<string>('home');
  tabs = [
    { id: 'home', label: 'Accueil' },
    { id: 'sport', label: 'Sport' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'finance', label: 'Finances' }
  ];
  today = new Date();

  // --- MODALS STATE ---
  sessionModalData: any | null = null;
  mealModalData: any | null = null;
  planningMode = false;

  openSessionDetail(s: ScheduledSession) { 
    this.planningMode = false;
    const def = this.dataService.sessions().find(x => x.id === s.sessionId);
    this.sessionModalData = { ...s, name: s.sessionName, exercises: def ? def.exercises : [] }; 
  }
  selectSessionForPlanning(s: WorkoutSession) {
    this.planningMode = true;
    this.sessionModalData = s;
    this.scheduleData.sessionId = s.id;
  }
  closeSessionModal() { this.sessionModalData = null; }

  openMealDetail(m: ScheduledMeal) {
    this.planningMode = false;
    this.mealModalData = { 
      id: m.mealId, name: m.mealName, type: m.type, 
      totalCalories: m.caloriesSnapshot, totalProtein: m.proteinSnapshot, totalCarbs: m.carbsSnapshot, totalFat: m.fatSnapshot 
    };
  }
  selectMealForPlanning(m: Meal) {
    this.planningMode = true;
    this.mealModalData = m;
    this.scheduleMealData.mealId = m.id;
  }
  closeMealModal() { this.mealModalData = null; }

  getSessionExercises(sessId: string): Exercise[] {
    const s = this.dataService.sessions().find(x => x.id === sessId);
    return s ? s.exercises : [];
  }
  getMealItems(mealId: string): MealItem[] {
     const m = this.dataService.meals().find(x => x.id === mealId);
     return m ? m.items : [];
  }

  // --- FINANCE ---
  newTransaction: Partial<FinanceEntry> = { type: 'fixe', date: new Date().toISOString().split('T')[0], category: '' };
  
  // Date Filtering
  months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  years = Array.from({length: 11}, (_, i) => new Date().getFullYear() - 5 + i); // Current -5 to +5
  
  selectedFinanceMonth = signal(new Date().getMonth());
  selectedFinanceYear = signal(new Date().getFullYear());

  categoryLists: any = {
    revenu: ['Salaire', 'Dividendes', 'Cadeau', 'Autre'],
    fixe: ['Loyer', 'Assurance', 'Internet/Mobile', 'Abonnement', 'Impôts'],
    variable: ['Alimentation', 'Shopping', 'Transport', 'Loisirs', 'Restaurant', 'Santé', 'Vacances']
  };
  setTransType(t: any) { this.newTransaction.type = t; this.newTransaction.category = ''; }
  getCategories(type: any) { return this.categoryLists[type || 'variable']; }
  updateBudget(val: number) { this.dataService.monthlyBudget.set(val); this.dataService.save(); }
  
  addTransaction() {
    if (this.newTransaction.amount && this.newTransaction.category) {
      const t: FinanceEntry = {
        id: Date.now().toString(),
        date: this.newTransaction.date!,
        description: this.newTransaction.description || '',
        amount: this.newTransaction.amount!,
        type: this.newTransaction.type as any,
        category: this.newTransaction.category!
      };
      this.dataService.finances.update(prev => [...prev, t]);
      this.dataService.save();
      this.newTransaction = { type: 'fixe', date: new Date().toISOString().split('T')[0], category: '' };
    }
  }
  deleteTransaction(id: string) { this.dataService.finances.update(prev => prev.filter(x => x.id !== id)); this.dataService.save(); }
  
  // Computeds for Finance
  sortedTransactions = computed(() => this.dataService.finances().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  
  // Filtered by Selected Month/Year
  filteredTransactions = computed(() => {
     return this.sortedTransactions().filter(t => {
        const d = new Date(t.date);
        return d.getMonth() == this.selectedFinanceMonth() && d.getFullYear() == this.selectedFinanceYear();
     });
  });

  monthlyStats = computed(() => {
     const txs = this.filteredTransactions();
     const income = txs.filter(t => t.type === 'revenu').reduce((acc, t) => acc + t.amount, 0);
     const expenses = txs.filter(t => t.type !== 'revenu').reduce((acc, t) => acc + t.amount, 0);
     return { income, expenses, balance: income - expenses };
  });

  // Global Dashboard Stats (Current/Global View)
  totalBalance = computed(() => this.dataService.finances().reduce((acc, cur) => cur.type === 'revenu' ? acc + cur.amount : acc - cur.amount, 0));
  totalExpenses = computed(() => this.dataService.finances().filter(f => f.type !== 'revenu').reduce((acc, cur) => acc + cur.amount, 0));
  remainingBudget = computed(() => this.dataService.monthlyBudget() - this.totalExpenses());
  budgetPercent = computed(() => this.dataService.monthlyBudget() === 0 ? 0 : Math.min((this.totalExpenses() / this.dataService.monthlyBudget()) * 100, 100));
  upcomingPayments = computed(() => {
    const now = new Date(); now.setHours(0,0,0,0);
    return this.dataService.finances().filter(f => f.type !== 'revenu' && new Date(f.date) >= now).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  // --- SPORT ---
  sportView: any = 'schedule';
  filterBodyPart = ''; filterEquipment = '';
  exerciseForm: Partial<Exercise> = { equipment: 'Sans matériel' };
  editingExercise: Exercise | null = null;
  editExercise(ex: Exercise) { this.editingExercise = ex; this.exerciseForm = { ...ex }; }
  cancelEditExercise() { this.editingExercise = null; this.exerciseForm = { equipment: 'Sans matériel' }; }
  saveExercise() {
    if (this.exerciseForm.name) {
      if (this.editingExercise) {
        const updated = { ...this.editingExercise, ...this.exerciseForm } as Exercise;
        this.dataService.exercises.update(prev => prev.map(e => e.id === updated.id ? updated : e));
      } else {
        const ex: Exercise = {
          id: Date.now().toString(),
          name: this.exerciseForm.name!,
          bodyPart: this.exerciseForm.bodyPart || 'Divers',
          equipment: this.exerciseForm.equipment || 'Sans matériel',
          sets: this.exerciseForm.sets || 3,
          reps: this.exerciseForm.reps || 10,
          weight: this.exerciseForm.weight || 0,
          imageUrl: this.exerciseForm.imageUrl || ''
        };
        this.dataService.exercises.update(prev => [...prev, ex]);
      }
      this.dataService.save();
      this.cancelEditExercise();
    }
  }
  uniqueBodyParts = computed(() => [...new Set(this.dataService.exercises().map(e => e.bodyPart))].sort());
  uniqueEquipment = computed(() => [...new Set(this.dataService.exercises().map(e => e.equipment))].sort());
  filteredExercises = computed(() => this.dataService.exercises().filter(e => (this.filterBodyPart ? e.bodyPart === this.filterBodyPart : true) && (this.filterEquipment ? e.equipment === this.filterEquipment : true)));

  newSessionName = ''; newSessionExercises: Exercise[] = [];
  scheduleData = { date: new Date().toISOString().split('T')[0], sessionId: null as string | null };
  nextSession = computed(() => {
     const now = new Date(); now.setHours(0,0,0,0);
     const upcoming = this.dataService.scheduledSessions().filter(s => new Date(s.date) >= now).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
     return upcoming.length > 0 ? upcoming[0] : null;
  });
  addExToSession(ex: Exercise) { this.newSessionExercises.push(ex); }
  removeExFromSession(ex: Exercise) { this.newSessionExercises = this.newSessionExercises.filter(e => e !== ex); }
  saveSession() {
    if (this.newSessionName && this.newSessionExercises.length > 0) {
      const sess: WorkoutSession = { id: Date.now().toString(), name: this.newSessionName, exercises: [...this.newSessionExercises], totalDuration: 60 };
      this.dataService.sessions.update(prev => [...prev, sess]);
      this.dataService.save();
      this.newSessionName = ''; this.newSessionExercises = [];
    }
  }
  confirmScheduleSession() {
    if (this.scheduleData.date && this.scheduleData.sessionId) {
      const sDef = this.dataService.sessions().find(s => s.id === this.scheduleData.sessionId);
      if (!sDef) return;
      const ss: ScheduledSession = { id: Date.now().toString(), date: this.scheduleData.date, sessionId: sDef.id, sessionName: sDef.name, completed: false };
      this.dataService.scheduledSessions.update(prev => [...prev, ss]);
      this.dataService.save();
      this.closeSessionModal();
    }
  }
  sortedScheduledSessions = computed(() => this.dataService.scheduledSessions().sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  removeScheduledSession(id: string) { this.dataService.scheduledSessions.update(prev => prev.filter(x => x.id !== id)); this.dataService.save(); }

  // --- NUTRITION ---
  nutriView: any = 'schedule';
  newIngredient: Partial<Ingredient> = { baseUnit: '100g' };
  addIngredient() {
    if (this.newIngredient.name) {
      const i: Ingredient = {
        id: Date.now().toString(),
        name: this.newIngredient.name!,
        baseUnit: this.newIngredient.baseUnit as any || '100g',
        calories: this.newIngredient.calories || 0,
        protein: this.newIngredient.protein || 0,
        carbs: this.newIngredient.carbs || 0,
        fat: this.newIngredient.fat || 0
      };
      this.dataService.ingredients.update(prev => [...prev, i]);
      this.dataService.save();
      this.newIngredient = { baseUnit: '100g' };
    }
  }
  newMealName = ''; newMealItems: MealItem[] = [];
  selectedIngredientForAdd: Ingredient | null = null;
  quantityToAdd: number | null = null;
  selectIngredient(i: Ingredient) { this.selectedIngredientForAdd = i; this.quantityToAdd = null; }
  confirmAddIngredient() {
    if (this.selectedIngredientForAdd && this.quantityToAdd) {
      this.newMealItems.push({ ingredient: this.selectedIngredientForAdd, quantity: this.quantityToAdd });
      this.selectedIngredientForAdd = null; this.quantityToAdd = null;
    }
  }
  removeIngFromMeal(item: MealItem) { this.newMealItems = this.newMealItems.filter(x => x !== item); }
  calculateItemCalories(item: MealItem): number { return item.ingredient.baseUnit === '100g' ? (item.quantity / 100) * item.ingredient.calories : item.quantity * item.ingredient.calories; }
  getNewMealTotals() {
    let cal = 0, p = 0, c = 0, f = 0;
    this.newMealItems.forEach(item => {
       const ratio = item.ingredient.baseUnit === '100g' ? item.quantity / 100 : item.quantity;
       cal += ratio * item.ingredient.calories;
       p += ratio * item.ingredient.protein;
       c += ratio * item.ingredient.carbs;
       f += ratio * item.ingredient.fat;
    });
    return { cal, p, c, f };
  }
  saveMeal() {
    if (this.newMealName && this.newMealItems.length > 0) {
      const t = this.getNewMealTotals();
      const m: Meal = { id: Date.now().toString(), name: this.newMealName, items: [...this.newMealItems], totalCalories: t.cal, totalProtein: t.p, totalCarbs: t.c, totalFat: t.f };
      this.dataService.meals.update(prev => [...prev, m]);
      this.dataService.save();
      this.newMealName = ''; this.newMealItems = [];
    }
  }
  scheduleMealData = { date: new Date().toISOString().split('T')[0], type: 'Déjeuner' as any, mealId: null as string | null };
  confirmScheduleMeal() {
    if (this.scheduleMealData.date && this.scheduleMealData.mealId) {
      const mDef = this.dataService.meals().find(m => m.id === this.scheduleMealData.mealId);
      if (!mDef) return;
      const sm: ScheduledMeal = {
        id: Date.now().toString(),
        date: this.scheduleMealData.date,
        mealId: mDef.id,
        mealName: mDef.name,
        type: this.scheduleMealData.type,
        caloriesSnapshot: mDef.totalCalories,
        proteinSnapshot: mDef.totalProtein,
        carbsSnapshot: mDef.totalCarbs,
        fatSnapshot: mDef.totalFat
      };
      this.dataService.scheduledMeals.update(prev => [...prev, sm]);
      this.dataService.save();
      this.closeMealModal();
    }
  }
  sortedScheduledMeals = computed(() => this.dataService.scheduledMeals().sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  removeScheduledMeal(id: string) { this.dataService.scheduledMeals.update(prev => prev.filter(x => x.id !== id)); this.dataService.save(); }
  
  todaysMeals = computed(() => { const d = this.today.toISOString().split('T')[0]; return this.dataService.scheduledMeals().filter(s => s.date === d); });
  todaysMacros = computed(() => {
     const d = this.today.toISOString().split('T')[0];
     const meals = this.dataService.scheduledMeals().filter(s => s.date === d);
     return {
        cal: meals.reduce((acc, c) => acc + c.caloriesSnapshot, 0),
        prot: meals.reduce((acc, c) => acc + c.proteinSnapshot, 0),
        carb: meals.reduce((acc, c) => acc + c.carbsSnapshot, 0),
        fat: meals.reduce((acc, c) => acc + c.fatSnapshot, 0)
     };
  });
}
