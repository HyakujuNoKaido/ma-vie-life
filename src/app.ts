import { Component, computed, signal, Injectable, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- 1. PIPE (Date Français) ---
@Pipe({ name: 'dateFr', standalone: true })
export class DateFrPipe implements PipeTransform {
  transform(value: string | Date, format: string = 'full'): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    let options: Intl.DateTimeFormatOptions;
    if (format === 'short') options = { day: 'numeric', month: 'short' };
    else if (format === 'month') options = { month: 'long', year: 'numeric' };
    else options = { weekday: 'short', day: 'numeric', month: 'long' };
    try {
      const str = date.toLocaleDateString('fr-FR', options);
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch (e) { return date.toDateString(); }
  }
}

// --- 2. SERVICE (Données) ---
@Injectable({ providedIn: 'root' })
export class DataService {
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
    const exs = [
      { id: 'ex1', name: 'Développé Couché', bodyPart: 'Pectoraux', equipment: 'Barre', sets: 4, reps: 10, weight: 80 },
      { id: 'ex2', name: 'Squat', bodyPart: 'Jambes', equipment: 'Barre', sets: 4, reps: 8, weight: 100 },
      { id: 'ex3', name: 'Tractions', bodyPart: 'Dos', equipment: 'Poids du corps', sets: 3, reps: 12, weight: 0 }
    ];
    this.exercises.set(exs);
    const sess = { id: 'sess1', name: 'Full Body A', exercises: [exs[0], exs[1], exs[2]], totalDuration: 60 };
    this.sessions.set([sess]);
    const ings = [
      { id: 'ing1', name: 'Poulet (cru)', baseUnit: '100g', calories: 120, protein: 23, carbs: 0, fat: 2.5 },
      { id: 'ing2', name: 'Riz Basmati (cuit)', baseUnit: '100g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }
    ];
    this.ingredients.set(ings);
    const meal = { id: 'meal1', name: 'Post-Workout', items: [{ ingredient: ings[0], quantity: 150 }, { ingredient: ings[1], quantity: 200 }], totalCalories: 440, totalProtein: 40, totalCarbs: 56, totalFat: 4 };
    this.meals.set([meal]);
    const today = new Date().toISOString().split('T')[0];
    this.finances.set([
        { id: 'f1', date: today, description: 'Salaire', amount: 5000, type: 'revenu', category: 'Salaire' },
        { id: 'f2', date: today, description: 'Loyer', amount: 1600, type: 'fixe', category: 'Logement' }
    ]);
    this.scheduledMeals.set([{ id: 'sm1', date: today, mealId: meal.id, mealName: meal.name, type: 'Déjeuner', caloriesSnapshot: meal.totalCalories, proteinSnapshot: meal.totalProtein, carbsSnapshot: meal.totalCarbs, fatSnapshot: meal.totalFat, consumed: false }]);
    this.scheduledSessions.set([{ id: 'ss1', date: today, sessionId: sess.id, sessionName: sess.name, completed: false }]);
    this.save();
  }

  reset() { if (this.isBrowser()) localStorage.clear(); location.reload(); }
}

// --- 3. COMPONENT ---
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DateFrPipe, DecimalPipe, CurrencyPipe],
  template: `
    <div class="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-blue-600 selection:text-white">
      
      <!-- NAV MOBILE (Bottom) - Icons intégrées directement -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-around items-center z-50 h-[80px] pb-[20px]">
        
        <button (click)="activeTab.set('home')" class="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors" [class.text-blue-500]="activeTab() === 'home'" [class.text-slate-500]="activeTab() !== 'home'">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/> <polyline points="9 22 9 12 15 12 15 22"/></svg>
           <span class="text-[10px] font-bold uppercase">Accueil</span>
        </button>

        <button (click)="activeTab.set('sport')" class="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors" [class.text-blue-500]="activeTab() === 'sport'" [class.text-slate-500]="activeTab() !== 'sport'">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
           <span class="text-[10px] font-bold uppercase">Sport</span>
        </button>

        <button (click)="activeTab.set('nutrition')" class="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors" [class.text-blue-500]="activeTab() === 'nutrition'" [class.text-slate-500]="activeTab() !== 'nutrition'">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-2.8Z"/><path d="M7 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2.8Z"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2v-2.8Z"/><rect width="18" height="14" x="3" y="6" rx="2"/><path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"/></svg>
           <span class="text-[10px] font-bold uppercase">Nutri</span>
        </button>

        <button (click)="activeTab.set('finance')" class="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors" [class.text-blue-500]="activeTab() === 'finance'" [class.text-slate-500]="activeTab() !== 'finance'">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
           <span class="text-[10px] font-bold uppercase">Money</span>
        </button>

      </nav>

      <!-- SIDEBAR DESKTOP -->
      <aside class="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col z-20 shadow-2xl">
        <div class="p-6 border-b border-slate-800"><h1 class="text-2xl font-bold text-white uppercase tracking-tighter">Life<span class="text-blue-500">Track</span></h1></div>
        <nav class="flex-1 py-6 space-y-2">
          
          <button (click)="activeTab.set('home')" [class]="activeTab() === 'home' ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-600' : 'text-slate-400 hover:bg-slate-800 border-r-4 border-transparent'" class="w-full flex items-center space-x-4 px-6 py-3 transition-all hover:pl-7">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/> <polyline points="9 22 9 12 15 12 15 22"/></svg>
             <span class="text-sm font-bold uppercase tracking-wider">Accueil</span>
          </button>

          <button (click)="activeTab.set('sport')" [class]="activeTab() === 'sport' ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-600' : 'text-slate-400 hover:bg-slate-800 border-r-4 border-transparent'" class="w-full flex items-center space-x-4 px-6 py-3 transition-all hover:pl-7">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
             <span class="text-sm font-bold uppercase tracking-wider">Sport</span>
          </button>

          <button (click)="activeTab.set('nutrition')" [class]="activeTab() === 'nutrition' ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-600' : 'text-slate-400 hover:bg-slate-800 border-r-4 border-transparent'" class="w-full flex items-center space-x-4 px-6 py-3 transition-all hover:pl-7">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-2.8Z"/><path d="M7 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2.8Z"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2v-2.8Z"/><rect width="18" height="14" x="3" y="6" rx="2"/><path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"/></svg>
             <span class="text-sm font-bold uppercase tracking-wider">Nutrition</span>
          </button>

          <button (click)="activeTab.set('finance')" [class]="activeTab() === 'finance' ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-600' : 'text-slate-400 hover:bg-slate-800 border-r-4 border-transparent'" class="w-full flex items-center space-x-4 px-6 py-3 transition-all hover:pl-7">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
             <span class="text-sm font-bold uppercase tracking-wider">Finances</span>
          </button>

        </nav>
        <div class="p-4 border-t border-slate-800"><button (click)="activeTab.set('data')" class="text-xs text-slate-500 hover:text-white transition w-full flex items-center gap-2 px-4 py-2 rounded hover:bg-slate-800"><span>⚙️</span><span>Système</span></button></div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="flex-1 overflow-y-auto bg-slate-950 p-4 pb-[100px] md:p-10 relative scroll-smooth">
        
        <!-- HEADER MOBILE -->
        <header class="md:hidden flex justify-between items-center mb-6 pt-2">
            <div><h1 class="text-xl font-bold text-white">Life<span class="text-blue-500">Track</span></h1><p class="text-xs text-slate-400 capitalize">{{ today | dateFr:'full' }}</p></div>
            <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">LT</div>
        </header>

        <!-- --- HOME TAB --- -->
        <div *ngIf="activeTab() === 'home'" class="animate-fade space-y-6">
          <header class="hidden md:block border-b border-slate-800 pb-6"><h2 class="text-3xl font-bold text-white mb-1">Tableau de bord</h2><p class="text-slate-400 capitalize">{{ today | dateFr:'full' }}</p></header>
          
          <!-- Solde Card -->
          <div class="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
             <div class="flex justify-between items-start">
               <div>
                 <p class="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1">Solde Disponible</p>
                 <p [class]="totalBalance() >= 0 ? 'text-white' : 'text-rose-400'" class="text-4xl md:text-5xl font-black tracking-tight">CHF {{ totalBalance() | number:'1.2-2' }}</p>
               </div>
               <div class="text-right">
                 <p class="text-slate-500 text-[10px] uppercase font-bold">Budget</p>
                 <p class="text-slate-300 font-mono font-bold">CHF {{ dataService.monthlyBudget() }}</p>
               </div>
             </div>
             <div class="h-4 bg-slate-700/50 rounded-full mt-4 overflow-hidden"><div class="h-full bg-blue-500 transition-all" [style.width.%]="budgetPercent()"></div></div>
             <p class="text-xs text-right mt-1 text-slate-400">Budget utilisé: {{ budgetPercent() | number:'1.0-0' }}%</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <!-- Next Session -->
             <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
                <h3 class="text-white font-bold mb-4 flex items-center gap-2">
                   <svg class="text-orange-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
                   Prochaine Séance
                </h3>
                <div *ngIf="nextSession(); else noSession" class="flex-1 flex flex-col">
                   <div (click)="openSessionDetail(nextSession())" class="cursor-pointer bg-slate-800/50 p-4 rounded-lg hover:bg-slate-800 transition mb-3 flex-1 border border-slate-800 hover:border-blue-500/50">
                      <div class="flex justify-between items-start">
                        <div>
                           <p class="text-xl font-bold text-white">{{ nextSession().sessionName }}</p>
                           <p class="text-xs text-blue-400 uppercase font-bold mt-1">{{ nextSession().date | dateFr:'short' }}</p>
                        </div>
                        <span class="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-700">Détails ›</span>
                      </div>
                      <div class="mt-3 flex flex-wrap gap-1">
                         <span class="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded">Cliquez pour voir les exercices</span>
                      </div>
                   </div>
                   <button (click)="goToSportEdit(nextSession())" class="w-full py-2 bg-slate-800 text-slate-300 text-xs font-bold uppercase rounded hover:text-white hover:bg-slate-700 transition">Modifier la séance</button>
                </div>
                <ng-template #noSession><div class="flex-1 flex items-center justify-center text-slate-500 text-sm italic min-h-[100px]">Aucune séance planifiée.</div></ng-template>
             </div>

             <!-- Daily Meals -->
             <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
                <div class="flex justify-between items-center mb-4">
                   <h3 class="text-white font-bold flex items-center gap-2">
                      <svg class="text-emerald-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-2.8Z"/><path d="M7 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2.8Z"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2v-2.8Z"/><rect width="18" height="14" x="3" y="6" rx="2"/><path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"/></svg>
                      Repas du Jour
                   </h3>
                   <span class="text-xs font-mono text-emerald-400 font-bold">{{ todaysCalories() | number:'1.0-0' }} kcal</span>
                </div>
                <div class="space-y-2 flex-1 overflow-y-auto max-h-[200px]">
                   <p *ngIf="todaysMealsUnconsumed().length === 0" class="text-slate-600 text-sm italic text-center py-4">Tout est consommé.</p>
                   <div *ngFor="let m of todaysMealsUnconsumed()" class="flex items-center gap-3 bg-slate-800/30 p-2 rounded-lg border border-slate-800 hover:border-slate-700 transition">
                      <input type="checkbox" (change)="toggleMealConsumed(m.id)" class="w-5 h-5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer">
                      <div (click)="openMealDetail(m)" class="flex-1 cursor-pointer">
                         <p class="text-white text-sm font-bold">{{ m.mealName }}</p>
                         <p class="text-[10px] text-slate-500 uppercase">{{ m.type }} • {{ m.caloriesSnapshot }} kcal</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <!-- --- SPORT TAB --- -->
        <div *ngIf="activeTab() === 'sport'" class="space-y-6 animate-fade">
           <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button *ngFor="let v of ['schedule', 'library', 'sessions']" (click)="sportView = v" [class]="sportView === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-900 text-slate-400 border-slate-800'" class="px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition border shadow-sm">{{ v === 'schedule' ? 'Planning' : v === 'library' ? 'Exercices' : 'Séances' }}</button>
           </div>

           <!-- Library with Filters -->
           <div *ngIf="sportView === 'library'">
              <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6">
                 <h3 class="text-white font-bold mb-4 text-sm uppercase flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Filtres & Ajout</h3>
                 
                 <!-- Filters -->
                 <div class="grid grid-cols-2 gap-2 mb-4">
                    <div>
                        <label class="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Corps</label>
                        <select [ngModel]="filterBodyPart" (ngModelChange)="filterBodyPart.set($event)" class="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-sm">
                            <option value="">Tout</option>
                            <option *ngFor="let p of uniqueBodyParts()" [value]="p">{{ p }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Matériel</label>
                        <select [ngModel]="filterEquipment" (ngModelChange)="filterEquipment.set($event)" class="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-sm">
                            <option value="">Tout</option>
                            <option *ngFor="let e of uniqueEquipment()" [value]="e">{{ e }}</option>
                        </select>
                    </div>
                 </div>

                 <!-- Add Form -->
                 <div class="pt-4 border-t border-slate-800">
                    <input [(ngModel)]="exerciseForm.name" placeholder="Nom de l'exercice" class="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg mb-2 text-sm">
                    <div class="grid grid-cols-2 gap-2 mb-2">
                        <input [(ngModel)]="exerciseForm.bodyPart" placeholder="Muscle (ex: Dos)" class="bg-slate-950 border border-slate-700 text-white p-3 rounded-lg text-sm">
                        <input [(ngModel)]="exerciseForm.equipment" placeholder="Matériel (ex: Barre)" class="bg-slate-950 border border-slate-700 text-white p-3 rounded-lg text-sm">
                    </div>
                    <div class="grid grid-cols-3 gap-2 mb-4">
                        <input type="number" [(ngModel)]="exerciseForm.sets" placeholder="Séries" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-center text-sm">
                        <input type="number" [(ngModel)]="exerciseForm.reps" placeholder="Reps" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-center text-sm">
                        <input type="number" [(ngModel)]="exerciseForm.weight" placeholder="Kg" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-center text-sm">
                    </div>
                    <button (click)="saveExercise()" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold uppercase text-xs hover:bg-blue-500 transition">{{ editingExercise ? 'Mettre à jour' : 'Ajouter' }}</button>
                 </div>
              </div>

              <!-- Exercise List -->
              <div class="grid gap-3">
                 <div *ngFor="let ex of filteredExercises()" class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center group">
                    <div>
                       <p class="text-white font-bold">{{ ex.name }}</p>
                       <p class="text-xs text-slate-500 uppercase">{{ ex.bodyPart }} • {{ ex.equipment }}</p>
                       <p class="text-xs text-blue-400 mt-1">{{ ex.sets }} x {{ ex.reps }} &#64; {{ ex.weight }}kg</p>
                    </div>
                    <button (click)="editExercise(ex)" class="text-slate-600 hover:text-white px-3 py-1 border border-slate-700 rounded text-xs">Edit</button>
                 </div>
              </div>
           </div>

           <!-- Schedule & Sessions views remain similar but polished -->
           <div *ngIf="sportView === 'schedule'">
              <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6">
                 <h3 class="text-slate-400 text-xs font-bold uppercase mb-4">Planifier une séance</h3>
                 <div class="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    <div *ngFor="let s of dataService.sessions()" (click)="selectSessionForPlanning(s)" class="min-w-[150px] bg-slate-950 border border-slate-700 p-3 rounded-xl hover:border-blue-500 cursor-pointer transition">
                       <p class="text-white font-bold text-sm truncate">{{ s.name }}</p>
                       <p class="text-[10px] text-slate-500">{{ s.totalDuration }} min • {{ s.exercises.length }} exos</p>
                    </div>
                 </div>
              </div>
              <h3 class="text-white font-bold mb-4">Calendrier</h3>
              <div class="grid gap-3">
                 <div *ngFor="let s of sortedScheduledSessions()" class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div (click)="openSessionDetail(s)" class="flex-1 cursor-pointer">
                       <p class="text-xs text-blue-400 font-bold uppercase">{{ s.date | dateFr:'short' }}</p>
                       <p class="text-white font-bold text-lg">{{ s.sessionName }}</p>
                    </div>
                    <button (click)="removeScheduledSession(s.id)" class="text-slate-600 hover:text-rose-500 p-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                 </div>
              </div>
           </div>

           <div *ngIf="sportView === 'sessions'">
              <div class="bg-slate-900 p-4 rounded-xl border border-slate-800">
                 <h3 class="text-white font-bold mb-4">Créer une Séance</h3>
                 <input [(ngModel)]="newSessionName" placeholder="Nom (ex: Jambes Lourd)" class="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg mb-4">
                 <div class="mb-4">
                    <p class="text-xs text-slate-500 uppercase font-bold mb-2">Exercices Inclus</p>
                    <div *ngFor="let ex of newSessionExercises" class="flex justify-between items-center bg-slate-800 p-2 rounded mb-1">
                       <span class="text-sm text-white">{{ ex.name }}</span>
                       <button (click)="removeExFromSession(ex)" class="text-rose-400 font-bold px-2">×</button>
                    </div>
                    <p *ngIf="newSessionExercises.length === 0" class="text-xs text-slate-600 italic">Aucun exercice ajouté.</p>
                 </div>
                 <button (click)="saveSession()" [disabled]="!newSessionName || newSessionExercises.length === 0" class="w-full bg-blue-600 disabled:opacity-50 text-white py-3 rounded-lg font-bold uppercase text-xs mb-6">Sauvegarder la Séance</button>
                 
                 <p class="text-xs text-slate-500 uppercase font-bold mb-2">Ajouter des exercices</p>
                 <div class="h-40 overflow-y-auto space-y-1 pr-1">
                    <div *ngFor="let ex of dataService.exercises()" (click)="addExToSession(ex)" class="bg-slate-950 border border-slate-800 p-2 rounded cursor-pointer hover:border-blue-500 transition flex justify-between">
                       <span class="text-sm text-slate-300">{{ ex.name }}</span>
                       <span class="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">+</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <!-- --- NUTRITION TAB --- -->
        <div *ngIf="activeTab() === 'nutrition'" class="space-y-6 animate-fade">
           <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button *ngFor="let v of ['schedule', 'ingredients', 'meals']" (click)="nutriView = v" [class]="nutriView === v ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-900 text-slate-400 border-slate-800'" class="px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition border shadow-sm">{{ v === 'schedule' ? 'Menu' : v === 'ingredients' ? 'Aliments' : 'Recettes' }}</button>
           </div>

           <!-- (Contenu Nutrition restauré identique à la version fonctionnelle, pas de changement majeur nécessaire ici sauf le design) -->
           <div *ngIf="nutriView === 'schedule'">
              <div class="grid grid-cols-2 gap-3 mb-6">
                 <div class="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center"><p class="text-2xl font-bold text-emerald-400">{{ todaysCalories() | number:'1.0-0' }}</p><p class="text-[10px] text-slate-500 uppercase font-bold">Kcal Conso.</p></div>
                 <div class="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center"><p class="text-2xl font-bold text-blue-400">{{ todaysMacros().prot | number:'1.0-0' }}g</p><p class="text-[10px] text-slate-500 uppercase font-bold">Protéines</p></div>
              </div>
              <h3 class="text-white font-bold mb-3">Aujourd'hui</h3>
              <div class="space-y-3">
                 <div *ngFor="let m of todaysMealsUnconsumed()" class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center group">
                    <div (click)="openMealDetail(m)" class="flex-1 cursor-pointer">
                        <p class="text-white font-bold">{{ m.mealName }}</p>
                        <p class="text-xs text-slate-500 uppercase">{{ m.type }} • {{ m.caloriesSnapshot | number:'1.0-0' }} kcal</p>
                    </div>
                    <input type="checkbox" (change)="toggleMealConsumed(m.id)" class="w-6 h-6 rounded bg-slate-800 border-slate-600 text-emerald-600 focus:ring-emerald-600">
                 </div>
                 <p *ngIf="todaysMealsUnconsumed().length === 0" class="text-center text-slate-600 text-sm italic py-4">Tout est consommé.</p>
              </div>
              
              <div class="mt-8 pt-6 border-t border-slate-800">
                 <h3 class="text-slate-400 text-xs font-bold uppercase mb-4">Ajouter un repas au menu</h3>
                 <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div *ngFor="let m of dataService.meals()" (click)="selectMealForPlanning(m)" class="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-emerald-500 cursor-pointer transition">
                       <p class="text-white font-bold">{{ m.name }}</p>
                       <p class="text-xs text-emerald-400 font-mono">{{ m.totalCalories | number:'1.0-0' }} kcal</p>
                    </div>
                 </div>
              </div>
           </div>

           <div *ngIf="nutriView === 'ingredients'">
              <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6">
                 <h3 class="text-white font-bold mb-4 text-sm uppercase">Nouvel Aliment</h3>
                 <div class="grid grid-cols-3 gap-2 mb-2">
                    <div class="col-span-2"><input [(ngModel)]="newIngredient.name" placeholder="Nom (ex: Oeuf)" class="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg text-sm"></div>
                    <select [(ngModel)]="newIngredient.baseUnit" class="bg-slate-950 border border-slate-700 text-white p-3 rounded-lg text-sm"><option value="100g">100g</option><option value="1 unité">Unité</option></select>
                 </div>
                 <div class="grid grid-cols-4 gap-2 mb-4">
                    <input type="number" [(ngModel)]="newIngredient.calories" placeholder="Kcal" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-center text-sm">
                    <input type="number" [(ngModel)]="newIngredient.protein" placeholder="Prot" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-center text-sm">
                    <input type="number" [(ngModel)]="newIngredient.carbs" placeholder="Gluc" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-center text-sm">
                    <input type="number" [(ngModel)]="newIngredient.fat" placeholder="Lip" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-center text-sm">
                 </div>
                 <button (click)="addIngredient()" class="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold uppercase text-xs hover:bg-emerald-500 transition">Ajouter</button>
              </div>
              <div class="overflow-x-auto rounded-xl border border-slate-800">
                 <table class="w-full text-left text-sm text-slate-400 bg-slate-900">
                    <thead class="bg-slate-950 text-slate-200 uppercase text-xs"><tr><th class="p-3">Nom</th><th class="p-3">Kcal</th><th class="p-3">P/G/L</th></tr></thead>
                    <tbody><tr *ngFor="let i of dataService.ingredients()" class="border-t border-slate-800"><td class="p-3 text-white">{{ i.name }}</td><td class="p-3 font-mono">{{ i.calories }}</td><td class="p-3 text-xs">{{ i.protein }}/{{ i.carbs }}/{{ i.fat }}</td></tr></tbody>
                 </table>
              </div>
           </div>

           <div *ngIf="nutriView === 'meals'">
              <div class="bg-slate-900 p-4 rounded-xl border border-slate-800">
                 <h3 class="text-white font-bold mb-4">Créer une Recette</h3>
                 <input [(ngModel)]="newMealName" placeholder="Nom Recette" class="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg mb-4">
                 <div class="bg-slate-950 p-3 rounded-lg mb-4 min-h-[100px]">
                    <div *ngFor="let item of newMealItems" class="flex justify-between items-center border-b border-slate-800 pb-2 mb-2 last:border-0">
                       <span class="text-sm text-white">{{ item.ingredient.name }} <span class="text-slate-500">({{ item.quantity }}{{ item.ingredient.baseUnit === '100g' ? 'g' : '' }})</span></span>
                       <button (click)="removeIngFromMeal(item)" class="text-rose-500 px-2">×</button>
                    </div>
                    <p *ngIf="newMealItems.length === 0" class="text-center text-xs text-slate-600 py-4">Ajoutez des aliments ci-dessous</p>
                 </div>
                 <div class="flex justify-between items-end mb-4"><span class="text-xs uppercase text-slate-500 font-bold">Total</span><span class="text-2xl font-bold text-emerald-400">{{ getNewMealTotals().cal | number:'1.0-0' }} kcal</span></div>
                 <button (click)="saveMeal()" [disabled]="!newMealName || newMealItems.length === 0" class="w-full bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-lg font-bold uppercase text-xs mb-6">Sauvegarder Recette</button>
                 
                 <p class="text-xs text-slate-500 uppercase font-bold mb-2">Ajouter un ingrédient</p>
                 <div *ngIf="selectedIngredientForAdd" class="bg-slate-800 p-3 rounded mb-2 flex gap-2">
                    <input type="number" [(ngModel)]="quantityToAdd" class="w-20 bg-slate-950 text-white p-2 rounded" placeholder="Qté">
                    <button (click)="confirmAddIngredient()" class="flex-1 bg-emerald-600 text-white rounded text-xs font-bold">OK</button>
                 </div>
                 <div class="h-40 overflow-y-auto space-y-1">
                    <div *ngFor="let i of dataService.ingredients()" (click)="selectIngredient(i)" class="bg-slate-950 border border-slate-800 p-2 rounded cursor-pointer flex justify-between hover:bg-slate-900/50">
                       <span class="text-sm text-slate-300">{{ i.name }}</span><span class="text-xs text-slate-500">{{ i.calories }}kcal</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <!-- --- FINANCES TAB --- -->
        <div *ngIf="activeTab() === 'finance'" class="space-y-6 animate-fade">
           <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
              <div class="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h2 class="text-white font-bold ml-1">Finances</h2>
                  <!-- Budget Modification Input -->
                  <div class="flex flex-col items-end">
                      <label class="text-[10px] text-slate-500 uppercase font-bold">Budget Mensuel</label>
                      <input type="number" [(ngModel)]="dataService.monthlyBudget" (ngModelChange)="dataService.save()" class="bg-transparent border-b border-slate-700 text-right w-24 text-white font-mono focus:border-blue-500 outline-none">
                  </div>
              </div>
              <div class="flex gap-4">
                 <div class="flex-1">
                    <label class="text-[10px] text-slate-500 uppercase font-bold block mb-1">Mois</label>
                    <select [ngModel]="selectedFinanceMonth" (ngModelChange)="selectedFinanceMonth.set($event)" class="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-sm"><option *ngFor="let m of months; let i = index" [value]="i">{{ m }}</option></select>
                 </div>
                 <div class="w-24">
                    <label class="text-[10px] text-slate-500 uppercase font-bold block mb-1">Année</label>
                    <select [ngModel]="selectedFinanceYear" (ngModelChange)="selectedFinanceYear.set($event)" class="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-sm"><option *ngFor="let y of years" [value]="y">{{ y }}</option></select>
                 </div>
              </div>
           </div>

           <div class="grid grid-cols-3 gap-3">
              <div class="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center"><p class="text-emerald-400 font-bold text-lg">+{{ monthlyStats().income | number:'1.0-0' }}</p><p class="text-[10px] text-slate-500 uppercase">Entrées</p></div>
              <div class="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center"><p class="text-rose-400 font-bold text-lg">-{{ monthlyStats().expenses | number:'1.0-0' }}</p><p class="text-[10px] text-slate-500 uppercase">Sorties</p></div>
              <div class="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center"><p class="text-white font-bold text-lg">{{ monthlyStats().balance | number:'1.0-0' }}</p><p class="text-[10px] text-slate-500 uppercase">Solde</p></div>
           </div>

           <button (click)="showTransactionModal = true" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition">Ajouter une transaction</button>

           <div class="space-y-3 pb-20">
              <div *ngIf="filteredTransactions().length === 0" class="text-center text-slate-600 italic py-8">Aucune transaction ce mois-ci.</div>
              <div *ngFor="let t of filteredTransactions()" class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center relative overflow-hidden group">
                 <div class="flex gap-3 items-center z-10">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" [ngClass]="t.type === 'revenu' ? 'bg-emerald-500/10 text-emerald-500' : (t.type === 'fixe' ? 'bg-purple-500/10 text-purple-500' : 'bg-rose-500/10 text-rose-500')">
                        <svg *ngIf="t.type==='revenu'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                        <svg *ngIf="t.type!=='revenu'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                    <div><p class="text-white font-bold leading-tight">{{ t.category }}</p><p class="text-xs text-slate-500">{{ t.date | dateFr:'short' }} <span *ngIf="t.description">• {{ t.description }}</span></p></div>
                 </div>
                 <div class="text-right z-10"><p class="font-bold text-lg" [ngClass]="t.type === 'revenu' ? 'text-emerald-400' : 'text-slate-200'">{{ t.type === 'revenu' ? '+' : '-' }}{{ t.amount | number:'1.0-0' }}</p></div>
                 <button (click)="deleteTransaction(t.id)" class="absolute inset-y-0 right-0 w-16 bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
              </div>
           </div>
        </div>

        <!-- --- SETTINGS TAB (RESTAURÉ) --- -->
        <div *ngIf="activeTab() === 'data'" class="text-center py-20 space-y-6">
           <h2 class="text-2xl font-bold text-white">Administration</h2>
           <p class="text-slate-500 text-sm max-w-xs mx-auto">Gérez vos données locales. Pour la synchronisation, la configuration Firebase sera nécessaire ultérieurement.</p>
           <div class="flex flex-col gap-4 max-w-xs mx-auto">
              <button (click)="dataService.injectData()" class="bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/20">Injecter Données de Démo</button>
              <button (click)="dataService.reset()" class="border border-rose-900/50 text-rose-500 py-4 rounded-xl font-bold hover:bg-rose-900/20 transition">Tout Effacer (Reset)</button>
           </div>
        </div>

      </main>

      <!-- MODALS (Transaction, Session, Meal) -->
      
      <!-- TRANSACTION MODAL -->
      <div *ngIf="showTransactionModal" class="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-fade">
         <div class="bg-slate-900 w-full md:max-w-md rounded-t-2xl md:rounded-2xl border-t md:border border-slate-800 h-[85vh] md:h-auto flex flex-col shadow-2xl">
            <div class="p-4 border-b border-slate-800 flex justify-between items-center"><h3 class="text-lg font-bold text-white">Nouvelle Transaction</h3><button (click)="showTransactionModal = false" class="text-slate-400 p-2">Fermer</button></div>
            <div class="p-6 space-y-4 flex-1 overflow-y-auto">
                <div class="grid grid-cols-3 gap-2"><button *ngFor="let t of ['variable', 'fixe', 'revenu']" (click)="newTransaction.type = t" [class]="newTransaction.type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-800 text-slate-400 border-slate-700'" class="py-2 rounded-lg border text-xs font-bold uppercase transition capitalize">{{ t }}</button></div>
                <div class="space-y-1"><label class="text-xs text-slate-500 uppercase font-bold">Montant</label><input type="number" [(ngModel)]="newTransaction.amount" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-lg font-bold focus:border-blue-500 outline-none" placeholder="0.00"></div>
                <div class="space-y-1"><label class="text-xs text-slate-500 uppercase font-bold">Catégorie</label><select [(ngModel)]="newTransaction.category" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"><option value="" disabled>Sélectionner...</option><option *ngFor="let c of getCategories(newTransaction.type)" [value]="c">{{ c }}</option></select></div>
                <div class="space-y-1"><label class="text-xs text-slate-500 uppercase font-bold">Date</label><input type="date" [(ngModel)]="newTransaction.date" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"></div>
                <div class="space-y-1"><label class="text-xs text-slate-500 uppercase font-bold">Note</label><input type="text" [(ngModel)]="newTransaction.description" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" placeholder="Facultatif"></div>
            </div>
            <div class="p-4 border-t border-slate-800 bg-slate-900 pb-safe"><button (click)="addTransaction()" [disabled]="!newTransaction.amount || !newTransaction.category" class="w-full bg-blue-600 disabled:opacity-50 text-white py-4 rounded-xl font-bold uppercase text-sm shadow-lg shadow-blue-900/20">Valider</button></div>
         </div>
      </div>

      <!-- SESSION MODAL -->
      <div *ngIf="sessionModalData" class="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
         <div class="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl max-h-[80vh] flex flex-col">
            <div class="p-4 border-b border-slate-800 flex justify-between items-center"><h3 class="font-bold text-white">{{ sessionModalData.name }}</h3><button (click)="sessionModalData = null" class="text-slate-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div>
            <div class="p-4 overflow-y-auto flex-1 space-y-3">
               <div *ngFor="let ex of sessionModalData.exercises" class="bg-slate-950 p-3 rounded border border-slate-800">
                  <p class="text-white font-bold">{{ ex.name }}</p>
                  <p class="text-xs text-slate-500 uppercase">{{ ex.bodyPart }} - {{ ex.equipment }}</p>
                  <p class="text-sm text-blue-400 mt-1 font-mono">{{ ex.sets }} x {{ ex.reps }} &#64; {{ ex.weight }}kg</p>
               </div>
            </div>
            <div *ngIf="planningMode" class="p-4 border-t border-slate-800 bg-slate-900 flex gap-2">
               <input type="date" [(ngModel)]="scheduleData.date" class="bg-slate-950 border border-slate-700 text-white p-2 rounded flex-1">
               <button (click)="confirmScheduleSession()" class="bg-blue-600 text-white px-4 rounded font-bold uppercase text-xs">Planifier</button>
            </div>
         </div>
      </div>

      <!-- MEAL MODAL -->
      <div *ngIf="mealModalData" class="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
         <div class="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl max-h-[80vh] flex flex-col">
            <div class="p-4 border-b border-slate-800 flex justify-between items-center"><h3 class="font-bold text-white">{{ mealModalData.name }}</h3><button (click)="mealModalData = null" class="text-slate-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div>
            <div class="p-4 overflow-y-auto flex-1 space-y-2">
               <div class="flex justify-between mb-4 bg-slate-950 p-3 rounded border border-slate-800"><div class="text-center"><span class="block font-bold text-white">{{ mealModalData.totalCalories | number:'1.0-0' }}</span><span class="text-[10px] text-slate-500 uppercase">Kcal</span></div><div class="text-center"><span class="block font-bold text-emerald-400">{{ mealModalData.totalProtein | number:'1.0-0' }}g</span><span class="text-[10px] text-slate-500 uppercase">Prot</span></div><div class="text-center"><span class="block font-bold text-amber-400">{{ mealModalData.totalCarbs | number:'1.0-0' }}g</span><span class="text-[10px] text-slate-500 uppercase">Gluc</span></div><div class="text-center"><span class="block font-bold text-rose-400">{{ mealModalData.totalFat | number:'1.0-0' }}g</span><span class="text-[10px] text-slate-500 uppercase">Lip</span></div></div>
               <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ingrédients</h4>
               <ul class="space-y-2"><li *ngFor="let item of (planningMode ? mealModalData.items : getMealItems(mealModalData.id))" class="text-sm text-slate-300 flex justify-between border-b border-slate-800 pb-2 last:border-0"><span>{{ item.ingredient.name }}</span><span class="font-mono text-slate-500">{{ item.quantity }}{{ item.ingredient.baseUnit === '100g' ? 'g' : '' }}</span></li></ul>
            </div>
            <div *ngIf="planningMode" class="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
               <div class="flex gap-2"><input type="date" [(ngModel)]="scheduleMealData.date" class="bg-slate-950 border border-slate-700 text-white p-2 rounded flex-1"><select [(ngModel)]="scheduleMealData.type" class="bg-slate-950 border border-slate-700 text-white p-2 rounded flex-1"><option value="Petit-déjeuner">Matin</option><option value="Déjeuner">Midi</option><option value="Dîner">Soir</option><option value="Collation">Snack</option></select></div>
               <button (click)="confirmScheduleMeal()" class="w-full bg-emerald-600 text-white py-3 rounded font-bold uppercase text-xs">Ajouter au Menu</button>
            </div>
         </div>
      </div>

    </div>
  `,
  styles: [`
    .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .animate-fade { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class App {
  dataService = inject(DataService);
  activeTab = signal('home');
  tabs = [
    { id: 'home', label: 'Accueil' },
    { id: 'sport', label: 'Sport' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'finance', label: 'Finances' }
  ];
  today = new Date();

  // Modals
  showTransactionModal = false;
  sessionModalData: any = null;
  mealModalData: any = null;
  planningMode = false;
  
  // Finance
  newTransaction = { type: 'variable', date: new Date().toISOString().split('T')[0], category: '', amount: null as number | null, description: '' };
  months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  years = Array.from({length: 11}, (_, i) => new Date().getFullYear() - 5 + i); 
  selectedFinanceMonth = signal(new Date().getMonth());
  selectedFinanceYear = signal(new Date().getFullYear());
  categoryLists: any = {
    revenu: ['Salaire', 'Dividendes', 'Cadeau', 'Autre'],
    fixe: ['Loyer', 'Assurance', 'Internet', 'Impôts'],
    variable: ['Alimentation', 'Shopping', 'Transport', 'Loisirs', 'Restaurant', 'Santé', 'Vacances']
  };

  // Sport
  sportView = 'schedule';
  filterBodyPart = signal(''); 
  filterEquipment = signal('');
  exerciseForm: any = { equipment: 'Sans matériel' };
  editingExercise: any = null;
  newSessionName = ''; 
  newSessionExercises: any[] = [];
  scheduleData: any = { date: new Date().toISOString().split('T')[0], sessionId: null };

  // Nutrition
  nutriView = 'schedule';
  newIngredient: any = { baseUnit: '100g' };
  newMealName = ''; 
  newMealItems: any[] = [];
  selectedIngredientForAdd: any = null;
  quantityToAdd: number | null = null;
  scheduleMealData: any = { date: new Date().toISOString().split('T')[0], type: 'Déjeuner', mealId: null };

  // --- COMPUTED ---
  uniqueBodyParts = computed(() => [...new Set(this.dataService.exercises().map(e => e.bodyPart))].sort());
  uniqueEquipment = computed(() => [...new Set(this.dataService.exercises().map(e => e.equipment))].sort());
  
  totalBalance = computed(() => this.dataService.finances().reduce((acc, cur) => cur.type === 'revenu' ? acc + cur.amount : acc - cur.amount, 0));
  totalExpenses = computed(() => this.dataService.finances().filter(f => f.type !== 'revenu').reduce((acc, cur) => acc + cur.amount, 0));
  budgetPercent = computed(() => this.dataService.monthlyBudget() === 0 ? 0 : Math.min((this.totalExpenses() / this.dataService.monthlyBudget()) * 100, 100));

  sortedTransactions = computed(() => this.dataService.finances().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  filteredTransactions = computed(() => {
     return this.sortedTransactions().filter(t => {
        const d = new Date(t.date);
        return d.getMonth() == this.selectedFinanceMonth() && d.getFullYear() == this.selectedFinanceYear();
     });
  });
  monthlyStats = computed(() => {
     const txs = this.filteredTransactions();
     return {
        income: txs.filter(t => t.type === 'revenu').reduce((acc, t) => acc + t.amount, 0),
        expenses: txs.filter(t => t.type !== 'revenu').reduce((acc, t) => acc + t.amount, 0),
        balance: txs.reduce((acc, t) => t.type === 'revenu' ? acc + t.amount : acc - t.amount, 0)
     };
  });

  nextSession = computed(() => {
     const now = new Date(); now.setHours(0,0,0,0);
     const upcoming = this.dataService.scheduledSessions().filter(s => new Date(s.date) >= now).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
     return upcoming.length > 0 ? upcoming[0] : null;
  });
  sortedScheduledSessions = computed(() => this.dataService.scheduledSessions().sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  
  filteredExercises = computed(() => {
      return this.dataService.exercises().filter(e => 
          (this.filterBodyPart() ? e.bodyPart === this.filterBodyPart() : true) && 
          (this.filterEquipment() ? e.equipment === this.filterEquipment() : true)
      );
  });

  sortedScheduledMeals = computed(() => this.dataService.scheduledMeals().sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  todaysMealsUnconsumed = computed(() => { const d = new Date().toISOString().split('T')[0]; return this.dataService.scheduledMeals().filter(s => s.date === d); }); // removed !s.consumed to show checkable list
  todaysCalories = computed(() => { const d = new Date().toISOString().split('T')[0]; return this.dataService.scheduledMeals().filter(s => s.date === d).reduce((acc, c) => acc + c.caloriesSnapshot, 0); });
  todaysMacros = computed(() => { const d = new Date().toISOString().split('T')[0]; const meals = this.dataService.scheduledMeals().filter(s => s.date === d); return { prot: meals.reduce((acc, c) => acc + c.proteinSnapshot, 0) }; });

  // --- METHODS ---
  getCategories(type: string) { return this.categoryLists[type] || []; }
  
  // Finance
  addTransaction() {
    if (this.newTransaction.amount && this.newTransaction.category) {
      const t = { id: Date.now().toString(), ...this.newTransaction, amount: Number(this.newTransaction.amount) };
      this.dataService.finances.update(prev => [t, ...prev]);
      this.dataService.save();
      this.showTransactionModal = false;
      this.newTransaction = { type: 'variable', date: new Date().toISOString().split('T')[0], category: '', amount: null, description: '' };
    }
  }
  deleteTransaction(id: string) { if(confirm('Supprimer ?')) { this.dataService.finances.update(prev => prev.filter(t => t.id !== id)); this.dataService.save(); } }

  // Sport
  openSessionDetail(s: any) { 
    this.planningMode = false;
    const def = this.dataService.sessions().find(x => x.id === s.sessionId);
    this.sessionModalData = { ...s, name: s.sessionName, exercises: def ? def.exercises : [] }; 
  }
  selectSessionForPlanning(s: any) { this.planningMode = true; this.sessionModalData = { ...s, exercises: s.exercises }; this.scheduleData.sessionId = s.id; }
  closeSessionModal() { this.sessionModalData = null; }
  
  editExercise(ex: any) { this.editingExercise = ex; this.exerciseForm = { ...ex }; }
  saveExercise() {
    if (this.exerciseForm.name) {
      if (this.editingExercise) this.dataService.exercises.update(prev => prev.map(e => e.id === this.editingExercise.id ? { ...this.editingExercise, ...this.exerciseForm } : e));
      else this.dataService.exercises.update(prev => [...prev, { id: Date.now().toString(), ...this.exerciseForm }]);
      this.dataService.save(); this.editingExercise = null; this.exerciseForm = { equipment: 'Sans matériel' };
    }
  }
  addExToSession(ex: any) { this.newSessionExercises.push(ex); }
  removeExFromSession(ex: any) { this.newSessionExercises = this.newSessionExercises.filter(e => e !== ex); }
  saveSession() {
    if (this.newSessionName && this.newSessionExercises.length > 0) {
      this.dataService.sessions.update(prev => [...prev, { id: Date.now().toString(), name: this.newSessionName, exercises: [...this.newSessionExercises], totalDuration: 60 }]);
      this.dataService.save(); this.newSessionName = ''; this.newSessionExercises = [];
    }
  }
  confirmScheduleSession() {
    if (this.scheduleData.date && this.scheduleData.sessionId) {
      const sDef = this.dataService.sessions().find(s => s.id === this.scheduleData.sessionId);
      if (sDef) { this.dataService.scheduledSessions.update(prev => [...prev, { id: Date.now().toString(), date: this.scheduleData.date, sessionId: sDef.id, sessionName: sDef.name, completed: false }]); this.dataService.save(); this.closeSessionModal(); }
    }
  }
  removeScheduledSession(id: string) { this.dataService.scheduledSessions.update(prev => prev.filter(x => x.id !== id)); this.dataService.save(); }
  
  // Navigation vers l'édition d'une séance (depuis l'accueil)
  goToSportEdit(session: any) {
      this.activeTab.set('sport');
      this.sportView = 'sessions';
      // Optionnel: Pré-remplir le formulaire si on voulait modifier la séance (complexe ici, on redirige juste)
  }

  // Nutrition
  openMealDetail(m: any) { this.planningMode = false; this.mealModalData = { id: m.mealId, name: m.mealName, type: m.type, totalCalories: m.caloriesSnapshot, totalProtein: m.proteinSnapshot, totalCarbs: m.carbsSnapshot, totalFat: m.fatSnapshot }; }
  selectMealForPlanning(m: any) { this.planningMode = true; this.mealModalData = m; this.scheduleMealData.mealId = m.id; }
  closeMealModal() { this.mealModalData = null; }
  getMealItems(mealId: string) { const m = this.dataService.meals().find(x => x.id === mealId); return m ? m.items : []; }
  
  addIngredient() {
    if (this.newIngredient.name) {
      this.dataService.ingredients.update(prev => [...prev, { id: Date.now().toString(), ...this.newIngredient }]);
      this.dataService.save(); this.newIngredient = { baseUnit: '100g' };
    }
  }
  selectIngredient(i: any) { this.selectedIngredientForAdd = i; this.quantityToAdd = null; }
  confirmAddIngredient() { if (this.selectedIngredientForAdd && this.quantityToAdd) { this.newMealItems.push({ ingredient: this.selectedIngredientForAdd, quantity: this.quantityToAdd }); this.selectedIngredientForAdd = null; } }
  removeIngFromMeal(item: any) { this.newMealItems = this.newMealItems.filter(x => x !== item); }
  calculateItemCalories(item: any) { return item.ingredient.baseUnit === '100g' ? (item.quantity / 100) * item.ingredient.calories : item.quantity * item.ingredient.calories; }
  getNewMealTotals() {
    let cal = 0, p = 0, c = 0, f = 0;
    this.newMealItems.forEach(item => { const ratio = item.ingredient.baseUnit === '100g' ? item.quantity / 100 : item.quantity; cal += ratio * item.ingredient.calories; p += ratio * item.ingredient.protein; c += ratio * item.ingredient.carbs; f += ratio * item.ingredient.fat; });
    return { cal, p, c, f };
  }
  saveMeal() {
    if (this.newMealName && this.newMealItems.length > 0) {
      const t = this.getNewMealTotals();
      this.dataService.meals.update(prev => [...prev, { id: Date.now().toString(), name: this.newMealName, items: [...this.newMealItems], totalCalories: t.cal, totalProtein: t.p, totalCarbs: t.c, totalFat: t.f }]);
      this.dataService.save(); this.newMealName = ''; this.newMealItems = [];
    }
  }
  confirmScheduleMeal() {
    if (this.scheduleMealData.date && this.scheduleMealData.mealId) {
      const mDef = this.dataService.meals().find(m => m.id === this.scheduleMealData.mealId);
      if (mDef) { this.dataService.scheduledMeals.update(prev => [...prev, { id: Date.now().toString(), date: this.scheduleMealData.date, mealId: mDef.id, mealName: mDef.name, type: this.scheduleMealData.type, caloriesSnapshot: mDef.totalCalories, proteinSnapshot: mDef.totalProtein, carbsSnapshot: mDef.totalCarbs, fatSnapshot: mDef.totalFat, consumed: false }]); this.dataService.save(); this.closeMealModal(); }
    }
  }
  removeScheduledMeal(id: string) { this.dataService.scheduledMeals.update(prev => prev.filter(x => x.id !== id)); this.dataService.save(); }
  toggleMealConsumed(id: string) { this.dataService.scheduledMeals.update(prev => prev.map(m => m.id === id ? { ...m, consumed: !m.consumed } : m)); this.dataService.save(); }
}


