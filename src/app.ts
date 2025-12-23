import { Component, computed, signal, Injectable, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- 1. PIPE (Formatage Date) ---
@Pipe({ name: 'dateFr', standalone: true })
export class DateFrPipe implements PipeTransform {
  transform(value: string | Date, format: string = 'full'): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    let options: Intl.DateTimeFormatOptions;
    // Format optimisé pour mobile
    if (format === 'short') options = { day: 'numeric', month: 'short' };
    else if (format === 'month') options = { month: 'long', year: 'numeric' };
    else options = { weekday: 'short', day: 'numeric', month: 'long' }; // Plus court pour mobile

    try {
      const str = date.toLocaleDateString('fr-FR', options);
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch (e) { return date.toDateString(); }
  }
}

// --- 2. SERVICE (Données & Sauvegarde) ---
@Injectable({ providedIn: 'root' })
export class DataService {
  // Signaux (Données réactives)
  exercises = signal<any[]>([]);
  sessions = signal<any[]>([]);
  ingredients = signal<any[]>([]);
  meals = signal<any[]>([]);
  scheduledSessions = signal<any[]>([]);
  scheduledMeals = signal<any[]>([]);
  finances = signal<any[]>([]);
  monthlyBudget = signal<number>(4000);

  constructor() { this.loadFromStorage(); }
  
  private isBrowser() { return typeof window !== 'undefined' && typeof localStorage !== 'undefined'; }
  
  // Sauvegarde automatique locale (Persistance quand on quitte l'app)
  loadFromStorage() {
    if (!this.isBrowser()) return;
    try {
      const keys = ['lt_exercises', 'lt_sessions', 'lt_ingredients', 'lt_meals', 'lt_finances', 'lt_sched_sessions', 'lt_sched_meals', 'lt_budget'];
      const targets = [this.exercises, this.sessions, this.ingredients, this.meals, this.finances, this.scheduledSessions, this.scheduledMeals, this.monthlyBudget];
      keys.forEach((k, i) => { const v = localStorage.getItem(k); if (v) targets[i].set(JSON.parse(v)); });
    } catch (e) { console.error(e); }
  }

  save() {
    if (!this.isBrowser()) return;
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
    // Données de test pour voir le design tout de suite
    const todayStr = new Date().toISOString().split('T')[0];
    if (this.exercises().length === 0) {
        this.exercises.set([{ id: 'ex1', name: 'Développé Couché', bodyPart: 'Pectoraux', equipment: 'Barre', sets: 4, reps: 10, weight: 80, imageUrl: "" }]);
        this.sessions.set([{ id: 'sess1', name: 'Pecs & Bras', exercises: [this.exercises()[0]], totalDuration: 60 }]);
        this.ingredients.set([{ id: 'ing1', name: 'Poulet', baseUnit: '100g', calories: 120, protein: 23, carbs: 0, fat: 1 }]);
        this.meals.set([{ id: 'm1', name: 'Post-Workout', items: [{ingredient: this.ingredients()[0], quantity: 200}], totalCalories: 240, totalProtein: 46, totalCarbs: 0, totalFat: 2 }]);
        this.finances.set([
            { id: 'f1', date: todayStr, description: 'Salaire', amount: 4500, type: 'revenu', category: 'Salaire' },
            { id: 'f2', date: todayStr, description: 'Loyer', amount: 1200, type: 'fixe', category: 'Logement' }
        ]);
        this.save();
    }
  }
  
  reset() { 
    if(this.isBrowser()) localStorage.clear(); 
    location.reload(); 
  }
}

// --- 3. COMPONENT (Interface Graphique) ---
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DateFrPipe, DecimalPipe, CurrencyPipe],
  template: `
    <div class="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-blue-600 selection:text-white">
      
      <!-- NAV MOBILE (En bas) -->
      <nav class="md:hidden fixed bottom-0 w-full bg-slate-900/95 backdrop-blur border-t border-slate-800 flex justify-around items-center z-50 h-16 pb-safe">
        <button *ngFor="let t of tabs" (click)="activeTab.set(t.id)" 
          class="flex flex-col items-center justify-center w-full h-full space-y-1"
          [class.text-blue-500]="activeTab() === t.id" 
          [class.text-slate-500]="activeTab() !== t.id">
           <span class="text-xl">{{t.icon}}</span>
           <span class="text-[10px] font-bold uppercase">{{t.label}}</span>
        </button>
      </nav>

      <!-- SIDEBAR DESKTOP (À gauche) -->
      <aside class="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col z-20 shadow-2xl">
        <div class="p-6 border-b border-slate-800">
          <h1 class="text-2xl font-bold text-white uppercase tracking-tighter">Life<span class="text-blue-500">Track</span></h1>
        </div>
        <nav class="flex-1 py-6 space-y-2">
          <button *ngFor="let t of tabs" (click)="activeTab.set(t.id)" 
            [class]="activeTab() === t.id ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-600' : 'text-slate-400 hover:bg-slate-800 border-r-4 border-transparent'" 
            class="w-full flex items-center space-x-4 px-6 py-3 transition-all hover:pl-7">
             <span class="text-xl">{{t.icon}}</span>
             <span class="text-sm font-bold uppercase tracking-wider">{{t.label}}</span>
          </button>
        </nav>
        <div class="p-4 border-t border-slate-800">
           <button (click)="activeTab.set('data')" class="text-xs text-slate-500 hover:text-white transition w-full flex items-center gap-2 px-4 py-2 rounded hover:bg-slate-800">
             <span>⚙️</span><span>Système & Données</span>
           </button>
        </div>
      </aside>

      <!-- ZONE PRINCIPALE -->
      <main class="flex-1 overflow-y-auto bg-slate-950 p-4 pb-24 md:p-10 relative scroll-smooth">
        
        <!-- HEADER MOBILE -->
        <header class="md:hidden flex justify-between items-center mb-6 pt-2">
            <div>
                <h1 class="text-xl font-bold text-white">Life<span class="text-blue-500">Track</span></h1>
                <p class="text-xs text-slate-400">{{ today | dateFr:'full' }}</p>
            </div>
            <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">LT</div>
        </header>

        <!-- DASHBOARD (Accueil) -->
        <div *ngIf="activeTab() === 'home'" class="animate-fade space-y-6">
          <header class="hidden md:block border-b border-slate-800 pb-6">
            <h2 class="text-3xl font-bold text-white mb-1">Tableau de bord</h2>
            <p class="text-slate-400 capitalize">{{ today | dateFr:'full' }}</p>
          </header>
          
          <!-- Solde Principal -->
          <div class="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
             <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             <p class="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1">Solde Disponible</p>
             <p [class]="totalBalance() >= 0 ? 'text-white' : 'text-rose-400'" class="text-4xl md:text-5xl font-black tracking-tight">
               CHF {{ totalBalance() | number:'1.2-2' }}
             </p>
             <div class="mt-4 flex gap-3 text-xs font-bold">
                <span class="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">Entrées: +{{ monthlyStats().income | number:'1.0-0' }}</span>
                <span class="bg-rose-500/10 text-rose-400 px-2 py-1 rounded">Sorties: -{{ monthlyStats().expenses | number:'1.0-0' }}</span>
             </div>
          </div>

          <!-- Raccourcis Rapides -->
          <div class="grid grid-cols-2 gap-4">
             <button (click)="activeTab.set('finance'); showTransactionModal=true" class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 transition active:scale-95">
                <div class="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl">＋</div>
                <span class="text-xs font-bold uppercase text-slate-300">Dépense</span>
             </button>
             <button (click)="activeTab.set('sport')" class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 transition active:scale-95">
                <div class="w-10 h-10 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center text-xl">💪</div>
                <span class="text-xs font-bold uppercase text-slate-300">Séance</span>
             </button>
          </div>

          <div *ngIf="dataService.finances().length === 0" class="text-center py-10">
             <p class="text-slate-500 text-sm mb-4">L'application est vide.</p>
             <button (click)="dataService.injectData()" class="text-blue-400 underline text-sm">Injecter des données de démonstration</button>
          </div>
        </div>

        <!-- FINANCES -->
        <div *ngIf="activeTab() === 'finance'" class="space-y-6 animate-fade">
           <div class="flex justify-between items-center">
              <h2 class="text-xl font-bold text-white">Finances</h2>
              <button (click)="showTransactionModal = true" class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/50">＋</button>
           </div>

           <!-- Liste Transactions (Style Carte Mobile) -->
           <div class="space-y-3">
              <div *ngFor="let t of filteredTransactions()" class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center relative overflow-hidden group">
                 <div class="flex gap-3 items-center z-10">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" 
                         [ngClass]="t.type === 'revenu' ? 'bg-emerald-500/10 text-emerald-500' : (t.type === 'fixe' ? 'bg-purple-500/10 text-purple-500' : 'bg-rose-500/10 text-rose-500')">
                       {{ t.type === 'revenu' ? '↓' : '↑' }}
                    </div>
                    <div>
                       <p class="text-white font-bold leading-tight">{{ t.category }}</p>
                       <p class="text-xs text-slate-500">{{ t.date | dateFr:'short' }} <span *ngIf="t.description">• {{ t.description }}</span></p>
                    </div>
                 </div>
                 <div class="text-right z-10">
                    <p class="font-bold text-lg" [ngClass]="t.type === 'revenu' ? 'text-emerald-400' : 'text-slate-200'">
                       {{ t.type === 'revenu' ? '+' : '-' }}{{ t.amount | number:'1.0-0' }}
                    </p>
                 </div>
                 <button (click)="deleteTransaction(t.id)" class="absolute inset-y-0 right-0 w-16 bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">✕</button>
              </div>
           </div>
        </div>

        <!-- SPORT -->
        <div *ngIf="activeTab() === 'sport'" class="space-y-6 animate-fade">
            <h2 class="text-xl font-bold text-white">Sport & Séances</h2>
            <div class="grid grid-cols-1 gap-4">
                <div *ngFor="let s of dataService.sessions()" class="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 bg-slate-800 px-3 py-1 rounded-bl-xl text-xs font-bold text-slate-400">{{ s.totalDuration }} min</div>
                    <h3 class="text-lg font-bold text-white mb-2">{{ s.name }}</h3>
                    <div class="flex flex-wrap gap-2">
                        <span *ngFor="let ex of s.exercises" class="text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-400">{{ ex.name }}</span>
                    </div>
                    <button class="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-blue-400 py-2 rounded-lg text-sm font-bold uppercase transition">Lancer la séance</button>
                </div>
            </div>
        </div>

        <!-- NUTRITION -->
        <div *ngIf="activeTab() === 'nutrition'" class="space-y-6 animate-fade">
            <h2 class="text-xl font-bold text-white">Nutrition</h2>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                    <p class="text-2xl font-bold text-emerald-400">{{ todaysCalories() | number:'1.0-0' }}</p>
                    <p class="text-xs text-slate-500 uppercase font-bold">Kcal Conso.</p>
                </div>
                <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                    <p class="text-2xl font-bold text-blue-400">{{ todaysMacros().prot | number:'1.0-0' }}g</p>
                    <p class="text-xs text-slate-500 uppercase font-bold">Protéines</p>
                </div>
            </div>
            <h3 class="text-sm font-bold text-slate-400 uppercase mt-6 mb-2">Repas Prévus</h3>
            <div *ngIf="todaysMealsUnconsumed().length === 0" class="text-slate-600 text-sm italic">Aucun repas planifié pour aujourd'hui.</div>
            <div *ngFor="let m of todaysMealsUnconsumed()" class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                <div>
                    <p class="text-white font-bold">{{ m.mealName }}</p>
                    <p class="text-xs text-slate-500">{{ m.type }} • {{ m.caloriesSnapshot }} kcal</p>
                </div>
                <input type="checkbox" (change)="toggleMealConsumed(m.id)" class="w-6 h-6 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500">
            </div>
        </div>

        <!-- SYSTEM -->
        <div *ngIf="activeTab() === 'data'" class="flex flex-col items-center justify-center h-full space-y-6">
            <div class="text-center">
                <h2 class="text-2xl font-bold text-white mb-2">Données</h2>
                <p class="text-slate-500 text-sm max-w-xs mx-auto">Vos données sont actuellement stockées sur cet appareil uniquement.</p>
            </div>
            <button (click)="dataService.reset()" class="bg-rose-900/20 border border-rose-900 text-rose-500 px-6 py-3 rounded-lg font-bold w-full max-w-xs hover:bg-rose-900/40 transition">
                Réinitialiser l'App
            </button>
            <div class="p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg max-w-xs text-center">
                <p class="text-blue-400 text-xs font-bold mb-1">SYNCHRONISATION</p>
                <p class="text-slate-400 text-xs">Pour activer la synchro PC/Mobile, une configuration Firebase est requise.</p>
            </div>
        </div>

      </main>

      <!-- MODAL TRANSACTION (Mobile Friendly) -->
      <div *ngIf="showTransactionModal" class="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-fade">
         <div class="bg-slate-900 w-full md:max-w-md md:rounded-2xl rounded-t-2xl border-t md:border border-slate-800 h-[80vh] md:h-auto flex flex-col shadow-2xl">
            <div class="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 class="text-lg font-bold text-white">Nouvelle Transaction</h3>
                <button (click)="showTransactionModal = false" class="text-slate-400 hover:text-white p-2">Fermer</button>
            </div>
            <div class="p-6 space-y-4 flex-1 overflow-y-auto">
                <div class="grid grid-cols-3 gap-2">
                    <button *ngFor="let t of ['variable', 'fixe', 'revenu']" (click)="newTransaction.type = t" 
                        [class]="newTransaction.type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-800 text-slate-400 border-slate-700'"
                        class="py-2 rounded-lg border text-xs font-bold uppercase transition capitalize">
                        {{ t }}
                    </button>
                </div>
                <div class="space-y-1">
                    <label class="text-xs text-slate-500 uppercase font-bold">Montant</label>
                    <input type="number" [(ngModel)]="newTransaction.amount" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-lg font-bold focus:border-blue-500 outline-none" placeholder="0.00">
                </div>
                <div class="space-y-1">
                    <label class="text-xs text-slate-500 uppercase font-bold">Catégorie</label>
                    <select [(ngModel)]="newTransaction.category" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none appearance-none">
                        <option value="" disabled>Sélectionner...</option>
                        <option *ngFor="let c of getCategories(newTransaction.type)" [value]="c">{{ c }}</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-xs text-slate-500 uppercase font-bold">Date</label>
                    <input type="date" [(ngModel)]="newTransaction.date" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none">
                </div>
            </div>
            <div class="p-4 border-t border-slate-800 bg-slate-900 pb-safe">
                <button (click)="addTransaction()" [disabled]="!newTransaction.amount || !newTransaction.category" class="w-full bg-blue-600 disabled:opacity-50 text-white py-4 rounded-xl font-bold uppercase text-sm shadow-lg shadow-blue-900/20">
                    Valider
                </button>
            </div>
         </div>
      </div>

    </div>
  `,
  styles: [`
    .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
    /* Animation simple */
    .animate-fade { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class App {
  dataService = inject(DataService);
  activeTab = signal('home');
  showTransactionModal = false; // Gestion simple de la modal
  
  tabs = [
    { id: 'home', label: 'Accueil', icon: '🏠' },
    { id: 'sport', label: 'Sport', icon: '💪' },
    { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
    { id: 'finance', label: 'Finances', icon: '💰' }
  ];
  today = new Date();

  // Finance Logic
  newTransaction = { type: 'variable', date: new Date().toISOString().split('T')[0], category: '', amount: null as number | null, description: '' };
  categoryLists: any = {
    revenu: ['Salaire', 'Dividendes', 'Cadeau', 'Autre'],
    fixe: ['Loyer', 'Assurance', 'Internet', 'Impôts'],
    variable: ['Alimentation', 'Shopping', 'Transport', 'Loisirs', 'Restaurant', 'Santé']
  };

  // Computed
  totalBalance = computed(() => this.dataService.finances().reduce((acc, cur) => cur.type === 'revenu' ? acc + cur.amount : acc - cur.amount, 0));
  
  monthlyStats = computed(() => {
     const now = new Date();
     const txs = this.dataService.finances().filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
     });
     return {
        income: txs.filter(t => t.type === 'revenu').reduce((acc, t) => acc + t.amount, 0),
        expenses: txs.filter(t => t.type !== 'revenu').reduce((acc, t) => acc + t.amount, 0)
     };
  });

  filteredTransactions = computed(() => {
      // Tri par date décroissante
      return this.dataService.finances().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);
  });

  // Nutrition Computed (Simplifiés)
  todaysMealsUnconsumed = computed(() => { 
     const d = new Date().toISOString().split('T')[0]; 
     return this.dataService.scheduledMeals().filter(s => s.date === d && !s.consumed); 
  });
  todaysCalories = computed(() => {
     const d = new Date().toISOString().split('T')[0]; 
     return this.dataService.scheduledMeals().filter(s => s.date === d).reduce((acc, c) => acc + c.caloriesSnapshot, 0);
  });
  todaysMacros = computed(() => {
     const d = new Date().toISOString().split('T')[0];
     const meals = this.dataService.scheduledMeals().filter(s => s.date === d);
     return {
        prot: meals.reduce((acc, c) => acc + c.proteinSnapshot, 0)
     };
  });

  // Methods
  getCategories(type: string) { return this.categoryLists[type] || []; }
  
  addTransaction() {
    if (this.newTransaction.amount && this.newTransaction.category) {
      const t = {
        id: Date.now().toString(),
        ...this.newTransaction,
        amount: Number(this.newTransaction.amount) // Sécurité typage
      };
      this.dataService.finances.update(prev => [t, ...prev]);
      this.dataService.save();
      this.showTransactionModal = false;
      this.newTransaction = { type: 'variable', date: new Date().toISOString().split('T')[0], category: '', amount: null, description: '' };
    }
  }

  deleteTransaction(id: string) {
      if(confirm('Supprimer cette transaction ?')) {
          this.dataService.finances.update(prev => prev.filter(t => t.id !== id));
          this.dataService.save();
      }
  }

  toggleMealConsumed(id: string) {
    this.dataService.scheduledMeals.update(prev => prev.map(m => m.id === id ? { ...m, consumed: !m.consumed } : m));
    this.dataService.save();
  }
}


