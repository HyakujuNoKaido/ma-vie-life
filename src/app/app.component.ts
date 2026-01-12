import { Component, computed, signal, Injectable, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- IMPORTATION DE VOS DONNÉES (DATA.TS) ---
import { INITIAL_EXERCICES, INITIAL_FOODS } from '../data';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDQlNuPgVI13Jyx1h9ykM7B_6krxltlN6w",
  authDomain: "mondashboardlife.firebaseapp.com",
  projectId: "mondashboardlife",
  storageBucket: "mondashboardlife.firebasestorage.app",
  messagingSenderId: "361243061610",
  appId: "1:361243061610:web:ec830caf5da084effec913"
};

// --- PIPE DATE ---
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

// --- SERVICE DE DONNÉES ---
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

  isSyncing = signal(false);
  lastSyncTime = signal<Date | null>(null);
  
  private db: any;
  private docRef: any;
  private useCloud = false;

  constructor() { this.initSystem(); }

  private initSystem() {
    if (firebaseConfig.apiKey) {
      try {
        const app = initializeApp(firebaseConfig);
        this.db = getFirestore(app);
        this.docRef = doc(this.db, 'lifetrack_sync', 'my_data'); 
        this.useCloud = true;
        this.startCloudSync();
      } catch (e) {
        console.error("Erreur init Firebase:", e);
        this.loadLocal();
      }
    } else { this.loadLocal(); }
  }

  private startCloudSync() {
    this.isSyncing.set(true);
    onSnapshot(this.docRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.applyData(data);
        this.lastSyncTime.set(new Date());
        this.isSyncing.set(false);
      } else {
        this.save(); 
      }
    }, () => { this.isSyncing.set(false); this.loadLocal(); });
  }

  private isBrowser() { return typeof window !== 'undefined' && typeof localStorage !== 'undefined'; }

  private loadLocal() {
    if (!this.isBrowser()) return;
    const localData = localStorage.getItem('lt_full_backup');
    if (localData) this.applyData(JSON.parse(localData));
  }

  private applyData(data: any) {
    if (!data) return;
    if (data.exercises) this.exercises.set(data.exercises);
    if (data.sessions) this.sessions.set(data.sessions);
    if (data.ingredients) this.ingredients.set(data.ingredients);
    if (data.meals) this.meals.set(data.meals);
    if (data.scheduledSessions) this.scheduledSessions.set(data.scheduledSessions);
    if (data.scheduledMeals) this.scheduledMeals.set(data.scheduledMeals);
    if (data.finances) this.finances.set(data.finances);
    if (data.monthlyBudget) this.monthlyBudget.set(data.monthlyBudget);
  }

  private getAllData() {
    return {
      exercises: this.exercises(),
      sessions: this.sessions(),
      ingredients: this.ingredients(),
      meals: this.meals(),
      scheduledSessions: this.scheduledSessions(),
      scheduledMeals: this.scheduledMeals(),
      finances: this.finances(),
      monthlyBudget: this.monthlyBudget(),
      lastUpdated: new Date().toISOString()
    };
  }

  save() {
    const data = this.getAllData();
    if (this.isBrowser()) localStorage.setItem('lt_full_backup', JSON.stringify(data));
    if (this.useCloud && this.docRef) {
      this.isSyncing.set(true);
      setDoc(this.docRef, data).then(() => {
          this.isSyncing.set(false);
          this.lastSyncTime.set(new Date());
      }).catch(e => this.isSyncing.set(false));
    }
  }

  injectData() {
    // Conversion des données importées pour correspondre au format interne
    const exs = INITIAL_EXERCICES.map(e => ({
      id: e.id,
      name: e.name,
      bodyPart: e.cat,
      equipment: e.equipment,
      sets: 4,
      reps: "10",
      weight: "0"
    }));
    this.exercises.set(exs);

    const sess = { id: 'sess1', name: 'Full Body Start', exercises: exs.slice(0, 4), totalDuration: 60 };
    this.sessions.set([sess]);

    const ings = INITIAL_FOODS.map(f => ({
      id: f.id, name: f.name, baseUnit: f.unit, calories: f.calories, protein: f.protein, carbs: f.carbs || 0, fat: f.fat || 0
    }));
    this.ingredients.set(ings);

    const meal = { id: 'meal1', name: 'Repas Type', items: [{ ingredient: ings[0], quantity: 150 }, { ingredient: ings[1], quantity: 200 }], totalCalories: 440, totalProtein: 40, totalCarbs: 56, totalFat: 4 };
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

  reset() { 
      if (confirm("Tout effacer ?")) {
        this.exercises.set([]); this.sessions.set([]); this.ingredients.set([]); this.meals.set([]); 
        this.scheduledSessions.set([]); this.scheduledMeals.set([]); this.finances.set([]);
        this.save(); location.reload();
      }
  }
}

// --- COMPONENT PRINCIPAL ---
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DateFrPipe, DecimalPipe, CurrencyPipe],
  template: `
    <div class="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-blue-600 selection:text-white">
      
      <!-- NAV MOBILE (Bottom) -->
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
          <!-- Desktop Nav Buttons (Même icônes) -->
          <button (click)="activeTab.set('home')" class="w-full flex items-center space-x-4 px-6 py-3 transition-all hover:pl-7 text-slate-400 hover:bg-slate-800"><span class="text-sm font-bold uppercase tracking-wider">Accueil</span></button>
          <button (click)="activeTab.set('sport')" class="w-full flex items-center space-x-4 px-6 py-3 transition-all hover:pl-7 text-slate-400 hover:bg-slate-800"><span class="text-sm font-bold uppercase tracking-wider">Sport</span></button>
          <button (click)="activeTab.set('nutrition')" class="w-full flex items-center space-x-4 px-6 py-3 transition-all hover:pl-7 text-slate-400 hover:bg-slate-800"><span class="text-sm font-bold uppercase tracking-wider">Nutrition</span></button>
          <button (click)="activeTab.set('finance')" class="w-full flex items-center space-x-4 px-6 py-3 transition-all hover:pl-7 text-slate-400 hover:bg-slate-800"><span class="text-sm font-bold uppercase tracking-wider">Finances</span></button>
        </nav>
        <div class="p-4 border-t border-slate-800"><button (click)="activeTab.set('data')" class="text-xs text-slate-500 hover:text-white transition w-full flex items-center gap-2 px-4 py-2 rounded hover:bg-slate-800"><span>⚙️</span><span>Système</span></button></div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="flex-1 overflow-y-auto bg-slate-950 p-4 pb-[100px] md:p-10 relative scroll-smooth no-scrollbar">
        
        <!-- HEADER MOBILE -->
        <header class="md:hidden flex justify-between items-center mb-6 pt-2">
            <div><h1 class="text-xl font-bold text-white">Life<span class="text-blue-500">Track</span></h1><p class="text-xs text-slate-400 capitalize">{{ today | dateFr:'full' }}</p></div>
            <!-- Indicateur de synchro discret (petit point) - LT REMOVED -->
            <div class="w-2 h-2 rounded-full" [class.bg-emerald-500]="!dataService.isSyncing()" [class.bg-amber-500]="dataService.isSyncing()" [class.animate-pulse]="dataService.isSyncing()"></div>
        </header>

        <!-- --- HOME TAB --- -->
        <div *ngIf="activeTab() === 'home'" class="animate-fade space-y-6">
          <header class="hidden md:flex justify-between items-end border-b border-slate-800 pb-6">
              <div><h2 class="text-3xl font-bold text-white mb-1">Tableau de bord</h2><p class="text-slate-400 capitalize">{{ today | dateFr:'full' }}</p></div>
          </header>
          
          <!-- Solde Card -->
          <div class="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
             <div class="flex justify-between items-start">
               <div>
                 <p class="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1">Solde Disponible</p>
                 <p [class]="totalBalance() >= 0 ? 'text-white' : 'text-rose-400'" class="text-4xl md:text-5xl font-black tracking-tight">CHF {{ totalBalance() | number:'1.2-2' }}</p>
               </div>
               <div class="text-right"><p class="text-slate-500 text-[10px] uppercase font-bold">Budget</p><p class="text-slate-300 font-mono font-bold">CHF {{ dataService.monthlyBudget() }}</p></div>
             </div>
             <div class="h-4 bg-slate-700/50 rounded-full mt-4 overflow-hidden"><div class="h-full bg-blue-500 transition-all" [style.width.%]="budgetPercent()"></div></div>
             <p class="text-xs text-right mt-1 text-slate-400">Budget utilisé: {{ budgetPercent() | number:'1.0-0' }}%</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <!-- Next Session -->
             <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
                <h3 class="text-white font-bold mb-4 flex items-center gap-2"><svg class="text-orange-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg> Prochaine Séance</h3>
                <div *ngIf="nextSession(); else noSession" class="flex-1 flex flex-col">
                   <div (click)="openSessionDetail(nextSession())" class="cursor-pointer bg-slate-800/50 p-4 rounded-lg hover:bg-slate-800 transition mb-3 flex-1 border border-slate-800 hover:border-blue-500/50">
                      <div class="flex justify-between items-start">
                        <div>
                           <p class="text-xl font-bold text-white">{{ nextSession().sessionName }}</p>
                           <p class="text-xs text-blue-400 uppercase font-bold mt-1">{{ nextSession().date | dateFr:'short' }}</p>
                        </div>
                        <input type="checkbox" (click)="$event.stopPropagation()" (change)="toggleSessionCompleted(nextSession().id)" [checked]="nextSession().completed" class="w-6 h-6 rounded bg-slate-900 border-slate-600 text-blue-600 focus:ring-blue-600 cursor-pointer">
                      </div>
                      <div class="mt-3"><span class="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded">Voir les exercices</span></div>
                   </div>
                </div>
                <ng-template #noSession><div class="flex-1 flex items-center justify-center text-slate-500 text-sm italic min-h-[100px]">Aucune séance planifiée.</div></ng-template>
             </div>

             <!-- Daily Meals -->
             <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
                <div class="flex justify-between items-center mb-4">
                   <h3 class="text-white font-bold flex items-center gap-2"><svg class="text-emerald-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-2.8Z"/><path d="M7 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2.8Z"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0v2.8a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2v-2.8Z"/><rect width="18" height="14" x="3" y="6" rx="2"/><path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"/></svg> Repas du Jour</h3>
                   <span class="text-xs font-mono text-emerald-400 font-bold">{{ todaysCalories() | number:'1.0-0' }} kcal</span>
                </div>
                <div class="space-y-2 flex-1 overflow-y-auto max-h-[300px]">
                   <p *ngIf="todaysMeals().length === 0" class="text-slate-600 text-sm italic text-center py-4">Rien de prévu aujourd'hui.</p>
                   <!-- SWIPE ITEM -->
                   <div *ngFor="let m of todaysMeals()" class="snap-x snap-mandatory flex w-full overflow-x-auto hide-scrollbar rounded-lg mb-2">
                      <div class="snap-center min-w-full bg-slate-800/30 p-3 flex items-center gap-3 border border-slate-800">
                          <input type="checkbox" (change)="toggleMealConsumed(m.id)" [checked]="m.consumed" class="w-6 h-6 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer">
                          <div (click)="openMealDetail(m)" class="flex-1 cursor-pointer">
                             <p class="text-white text-sm font-bold" [class.line-through]="m.consumed" [class.text-slate-500]="m.consumed">{{ m.mealName }}</p>
                             <p class="text-[10px] text-slate-500 uppercase">{{ m.type }} • {{ m.caloriesSnapshot }} kcal</p>
                          </div>
                          <span class="text-slate-600 text-xs">‹ Glisser</span>
                      </div>
                      <div class="snap-center flex">
                          <button (click)="removeScheduledMeal(m.id)" class="w-16 bg-rose-600 text-white flex items-center justify-center font-bold text-xs">Suppr.</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <!-- --- SPORT TAB --- -->
        <div *ngIf="activeTab() === 'sport'" class="space-y-6 animate-fade">
           <div class="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              <button *ngFor="let v of ['schedule', 'library', 'sessions']" (click)="sportView = v" [class]="sportView === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-900 text-slate-400 border-slate-800'" class="px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition border shadow-sm">{{ v === 'schedule' ? 'Planning' : v === 'library' ? 'Exercices' : 'Séances' }}</button>
           </div>

           <!-- Library -->
           <div *ngIf="sportView === 'library'">
              <!-- Filtres et Ajout/Modif -->
              <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6">
                 <h3 class="text-white font-bold mb-4 text-sm uppercase flex items-center gap-2">{{ editingExercise ? 'Modifier' : 'Ajouter' }} Exercice</h3>
                 <input [(ngModel)]="exerciseForm.name" placeholder="Nom de l'exercice" class="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg mb-2 text-sm">
                 <div class="grid grid-cols-2 gap-2 mb-4">
                     <input [(ngModel)]="exerciseForm.bodyPart" placeholder="Muscle (ex: Dos)" class="bg-slate-950 border border-slate-700 text-white p-3 rounded-lg text-sm">
                     <input [(ngModel)]="exerciseForm.equipment" placeholder="Matériel" class="bg-slate-950 border border-slate-700 text-white p-3 rounded-lg text-sm">
                 </div>
                 <!-- Smart Inputs pour Reps/Poids -->
                 <div class="grid grid-cols-2 gap-3 mb-2">
                    <div>
                        <label class="text-[10px] text-slate-500 uppercase">Séries x Reps</label>
                        <div class="flex gap-1">
                            <input type="number" inputmode="decimal" [(ngModel)]="exerciseForm.sets" placeholder="4" class="w-12 bg-slate-950 border border-slate-700 text-white p-2 rounded text-center">
                            <span class="py-2 text-slate-500">x</span>
                            <input type="text" [(ngModel)]="exerciseForm.reps" placeholder="10" class="flex-1 bg-slate-950 border border-slate-700 text-white p-2 rounded text-center">
                        </div>
                        <div class="flex gap-1 mt-1"><button (click)="exerciseForm.reps = 'Echec'" class="text-[9px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">À l'échec</button></div>
                    </div>
                    <div>
                        <label class="text-[10px] text-slate-500 uppercase">Poids (kg)</label>
                        <input type="text" [(ngModel)]="exerciseForm.weight" placeholder="0" class="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded text-center">
                        <div class="flex gap-1 mt-1"><button (click)="exerciseForm.weight = 'PDC'" class="text-[9px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">Poids corps</button></div>
                    </div>
                 </div>
                 
                 <div class="flex gap-2">
                     <button *ngIf="editingExercise" (click)="cancelEditExercise()" class="flex-1 bg-slate-800 text-slate-300 py-3 rounded-lg font-bold uppercase text-xs">Annuler</button>
                     <button (click)="saveExercise()" class="flex-[2] bg-blue-600 text-white py-3 rounded-lg font-bold uppercase text-xs hover:bg-blue-500">{{ editingExercise ? 'Enregistrer' : 'Ajouter' }}</button>
                 </div>
              </div>

              <!-- List with Swipe -->
              <div class="grid gap-3">
                 <div *ngFor="let ex of filteredExercises()" class="snap-x snap-mandatory flex w-full overflow-x-auto hide-scrollbar rounded-xl">
                    <div class="snap-center min-w-full bg-slate-900 border border-slate-800 p-4 flex justify-between items-center">
                        <div>
                           <p class="text-white font-bold">{{ ex.name }}</p>
                           <p class="text-xs text-slate-500 uppercase">{{ ex.bodyPart }} • {{ ex.equipment }}</p>
                           <p class="text-xs text-blue-400 mt-1">{{ ex.sets }} x {{ ex.reps }} &#64; {{ ex.weight }}</p>
                        </div>
                        <span class="text-slate-600 text-xs">‹ Glisser</span>
                    </div>
                    <div class="snap-center flex">
                        <button (click)="editExercise(ex)" class="w-16 bg-blue-600 text-white flex items-center justify-center font-bold text-xs">Modif.</button>
                        <button (click)="deleteExercise(ex.id)" class="w-16 bg-rose-600 text-white flex items-center justify-center font-bold text-xs">Suppr.</button>
                    </div>
                 </div>
              </div>
           </div>

           <!-- Schedule View -->
           <div *ngIf="sportView === 'schedule'">
              <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6">
                 <h3 class="text-slate-400 text-xs font-bold uppercase mb-4">Planifier une séance</h3>
                 <div class="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    <div *ngFor="let s of dataService.sessions()" (click)="selectSessionForPlanning(s)" class="min-w-[150px] bg-slate-950 border border-slate-700 p-3 rounded-xl hover:border-blue-500 cursor-pointer transition">
                       <p class="text-white font-bold text-sm truncate">{{ s.name }}</p>
                       <p class="text-[10px] text-slate-500">{{ s.totalDuration }} min • {{ s.exercises.length }} exos</p>
                    </div>
                 </div>
              </div>
              <h3 class="text-white font-bold mb-4">Calendrier</h3>
              <div class="grid gap-3">
                 <div *ngFor="let s of sortedScheduledSessions()" class="snap-x snap-mandatory flex w-full overflow-x-auto hide-scrollbar rounded-xl">
                    <div class="snap-center min-w-full bg-slate-900 border border-slate-800 p-4 flex items-center justify-between">
                        <div (click)="openSessionDetail(s)" class="flex-1 cursor-pointer">
                           <p class="text-xs text-blue-400 font-bold uppercase">{{ s.date | dateFr:'short' }}</p>
                           <p class="text-white font-bold text-lg" [class.line-through]="s.completed" [class.text-slate-500]="s.completed">{{ s.sessionName }}</p>
                        </div>
                        <input type="checkbox" (change)="toggleSessionCompleted(s.id)" [checked]="s.completed" class="w-6 h-6 rounded bg-slate-900 border-slate-600 text-blue-600 focus:ring-blue-600">
                    </div>
                    <div class="snap-center flex"><button (click)="removeScheduledSession(s.id)" class="w-16 bg-rose-600 text-white flex items-center justify-center font-bold text-xs">Suppr.</button></div>
                 </div>
              </div>
           </div>
           
           <!-- Sessions Builder View -->
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
                 <button (click)="saveSession()" [disabled]="!newSessionName || newSessionExercises.length === 0" class="w-full bg-blue-600 disabled:opacity-50 text-white py-3 rounded-lg font-bold uppercase text-xs mb-6">Sauvegarder</button>
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
           <div class="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              <button *ngFor="let v of ['schedule', 'ingredients', 'meals']" (click)="nutriView = v" [class]="nutriView === v ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-900 text-slate-400 border-slate-800'" class="px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition border shadow-sm">{{ v === 'schedule' ? 'Menu' : v === 'ingredients' ? 'Aliments' : 'Recettes' }}</button>
           </div>

           <div *ngIf="nutriView === 'schedule'">
              <div class="grid grid-cols-2 gap-3 mb-6">
                 <div class="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center"><p class="text-2xl font-bold text-emerald-400">{{ todaysCalories() | number:'1.0-0' }}</p><p class="text-[10px] text-slate-500 uppercase font-bold">Kcal Conso.</p></div>
                 <div class="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center"><p class="text-2xl font-bold text-blue-400">{{ todaysMacros().prot | number:'1.0-0' }}g</p><p class="text-[10px] text-slate-500 uppercase font-bold">Protéines</p></div>
              </div>
              <h3 class="text-white font-bold mb-3">Aujourd'hui</h3>
              <div class="space-y-3">
                 <div *ngFor="let m of todaysMeals()" class="snap-x snap-mandatory flex w-full overflow-x-auto hide-scrollbar rounded-xl">
                    <div class="snap-center min-w-full bg-slate-900 border border-slate-800 p-4 flex justify-between items-center">
                        <div (click)="openMealDetail(m)" class="flex-1 cursor-pointer">
                            <p class="text-white font-bold" [class.line-through]="m.consumed" [class.text-slate-500]="m.consumed">{{ m.mealName }}</p>
                            <p class="text-xs text-slate-500 uppercase">{{ m.type }} • {{ m.caloriesSnapshot | number:'1.0-0' }} kcal</p>
                        </div>
                        <input type="checkbox" (change)="toggleMealConsumed(m.id)" [checked]="m.consumed" class="w-6 h-6 rounded bg-slate-800 border-slate-600 text-emerald-600 focus:ring-emerald-600 cursor-pointer">
                    </div>
                    <div class="snap-center flex"><button (click)="removeScheduledMeal(m.id)" class="w-16 bg-rose-600 text-white flex items-center justify-center font-bold text-xs">Suppr.</button></div>
                 </div>
                 <p *ngIf="todaysMeals().length === 0" class="text-center text-slate-600 text-sm italic py-4">Rien à manger ? Ajoutez un repas.</p>
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
                 <h3 class="text-white font-bold mb-4 text-sm uppercase">{{ editingIngredient ? 'Modifier' : 'Ajouter' }} Aliment</h3>
                 <div class="grid grid-cols-3 gap-2 mb-2">
                    <div class="col-span-2"><input [(ngModel)]="newIngredient.name" placeholder="Nom (ex: Oeuf)" class="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg text-sm"></div>
                    <select [(ngModel)]="newIngredient.baseUnit" class="bg-slate-950 border border-slate-700 text-white p-3 rounded-lg text-sm"><option value="100g">100g</option><option value="1 unité">Unité</option></select>
                 </div>
                 <div class="grid grid-cols-4 gap-2 mb-4">
                    <input type="number" inputmode="decimal" [(ngModel)]="newIngredient.calories" placeholder="Kcal" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-center text-sm">
                    <input type="number" inputmode="decimal" [(ngModel)]="newIngredient.protein" placeholder="Prot" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-center text-sm">
                    <input type="number" inputmode="decimal" [(ngModel)]="newIngredient.carbs" placeholder="Gluc" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-center text-sm">
                    <input type="number" inputmode="decimal" [(ngModel)]="newIngredient.fat" placeholder="Lip" class="bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-center text-sm">
                 </div>
                 <div class="flex gap-2">
                     <button *ngIf="editingIngredient" (click)="cancelEditIngredient()" class="flex-1 bg-slate-800 text-slate-300 py-3 rounded-lg font-bold uppercase text-xs">Annuler</button>
                     <button (click)="saveIngredient()" class="flex-[2] bg-emerald-600 text-white py-3 rounded-lg font-bold uppercase text-xs hover:bg-emerald-500">{{ editingIngredient ? 'Enregistrer' : 'Ajouter' }}</button>
                 </div>
              </div>
              
              <div class="grid gap-3">
                 <div *ngFor="let i of dataService.ingredients()" class="snap-x snap-mandatory flex w-full overflow-x-auto hide-scrollbar rounded-xl">
                    <div class="snap-center min-w-full bg-slate-900 border border-slate-800 p-3 flex justify-between items-center">
                        <div>
                            <p class="text-white font-bold text-sm">{{ i.name }}</p>
                            <p class="text-[10px] text-slate-500">{{ i.calories }} kcal • {{ i.protein }}P / {{ i.carbs }}G / {{ i.fat }}L</p>
                        </div>
                        <span class="text-slate-600 text-xs">‹ Glisser</span>
                    </div>
                    <div class="snap-center flex">
                        <button (click)="editIngredient(i)" class="w-16 bg-blue-600 text-white flex items-center justify-center font-bold text-xs">Modif.</button>
                        <button (click)="deleteIngredient(i.id)" class="w-16 bg-rose-600 text-white flex items-center justify-center font-bold text-xs">Suppr.</button>
                    </div>
                 </div>
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
                    <input type="number" inputmode="decimal" [(ngModel)]="quantityToAdd" class="w-20 bg-slate-950 text-white p-2 rounded" placeholder="Qté">
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
                  <div class="flex flex-col items-end">
                      <label class="text-[10px] text-slate-500 uppercase font-bold">Budget Mensuel</label>
                      <input type="number" inputmode="decimal" [(ngModel)]="dataService.monthlyBudget" (ngModelChange)="dataService.save()" class="bg-transparent border-b border-slate-700 text-right w-24 text-white font-mono focus:border-blue-500 outline-none">
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
              <div *ngFor="let t of filteredTransactions()" class="snap-x snap-mandatory flex w-full overflow-x-auto hide-scrollbar rounded-xl">
                 <div class="snap-center min-w-full bg-slate-900 border border-slate-800 p-4 flex justify-between items-center">
                     <div class="flex gap-3 items-center">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" [ngClass]="t.type === 'revenu' ? 'bg-emerald-500/10 text-emerald-500' : (t.type === 'fixe' ? 'bg-purple-500/10 text-purple-500' : 'bg-rose-500/10 text-rose-500')">
                            <span *ngIf="t.type==='revenu'">+</span><span *ngIf="t.type!=='revenu'">-</span>
                        </div>
                        <div><p class="text-white font-bold leading-tight">{{ t.category }}</p><p class="text-xs text-slate-500">{{ t.date | dateFr:'short' }} <span *ngIf="t.description">• {{ t.description }}</span></p></div>
                     </div>
                     <div class="text-right">
                         <p class="font-bold text-lg" [ngClass]="t.type === 'revenu' ? 'text-emerald-400' : 'text-slate-200'">{{ t.type === 'revenu' ? '+' : '-' }}{{ t.amount | number:'1.0-0' }}</p>
                         <span class="text-slate-600 text-xs">‹ Glisser</span>
                     </div>
                 </div>
                 <div class="snap-center flex"><button (click)="deleteTransaction(t.id)" class="w-16 bg-rose-600 text-white flex items-center justify-center font-bold text-xs">Suppr.</button></div>
              </div>
           </div>
        </div>

        <!-- --- SETTINGS TAB --- -->
        <div *ngIf="activeTab() === 'data'" class="text-center py-20 space-y-6">
           <h2 class="text-2xl font-bold text-white">Administration</h2>
           <p class="text-slate-500 text-sm max-w-xs mx-auto">Gérez vos données locales.</p>
           <div class="flex flex-col gap-4 max-w-xs mx-auto">
              <button (click)="dataService.injectData()" class="bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/20">Injecter Données de Démo</button>
              <button (click)="dataService.reset()" class="border border-rose-900/50 text-rose-500 py-4 rounded-xl font-bold hover:bg-rose-900/20 transition">Tout Effacer (Reset)</button>
           </div>
        </div>

      </main>

      <!-- TRANSACTION MODAL -->
      <div *ngIf="showTransactionModal" class="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-fade">
         <div class="bg-slate-900 w-full md:max-w-md rounded-t-2xl md:rounded-2xl border-t md:border border-slate-800 h-[85vh] md:h-auto flex flex-col shadow-2xl">
            <div class="p-4 border-b border-slate-800 flex justify-between items-center"><h3 class="text-lg font-bold text-white">Nouvelle Transaction</h3><button (click)="showTransactionModal = false" class="text-slate-400 p-2">Fermer</button></div>
            <div class="p-6 space-y-4 flex-1 overflow-y-auto">
                <div class="grid grid-cols-3 gap-2"><button *ngFor="let t of ['variable', 'fixe', 'revenu']" (click)="newTransaction.type = t" [class.bg-blue-600]="newTransaction.type === t" [class.text-white]="newTransaction.type === t" [class.border-blue-600]="newTransaction.type === t" [class.bg-slate-800]="newTransaction.type !== t" [class.text-slate-400]="newTransaction.type !== t" [class.border-slate-700]="newTransaction.type !== t" class="py-2 rounded-lg border text-xs font-bold uppercase transition capitalize">{{ t }}</button></div>
                <div class="space-y-1"><label class="text-xs text-slate-500 uppercase font-bold">Montant</label><input type="number" inputmode="decimal" [(ngModel)]="newTransaction.amount" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-lg font-bold focus:border-blue-500 outline-none" placeholder="0.00"></div>
                <div class="space-y-1"><label class="text-xs text-slate-500 uppercase font-bold">Catégorie</label><select [(ngModel)]="newTransaction.category" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"><option value="" disabled>Sélectionner...</option><option *ngFor="let c of getCategories(newTransaction.type)" [value]="c">{{ c }}</option></select></div>
                <div class="space-y-1"><label class="text-xs text-slate-500 uppercase font-bold">Date</label><input type="date" [(ngModel)]="newTransaction.date" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"></div>
                <div class="space-y-1"><label class="text-xs text-slate-500 uppercase font-bold">Note</label><input type="text" [(ngModel)]="newTransaction.description" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" placeholder="Facultatif"></div>
            </div>
            <div class="p-4 border-t border-slate-800 bg-slate-900 pb-safe"><button (click)="addTransaction()" [disabled]="!newTransaction.amount || !newTransaction.category" class="w-full bg-blue-600 disabled:opacity-50 text-white py-4 rounded-xl font-bold uppercase text-sm shadow-lg shadow-blue-900/20">Valider</button></div>
         </div>
      </div>

      <!-- SESSION MODAL (DETAIL + EDIT) -->
      <div *ngIf="sessionModalData" class="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
         <div class="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl max-h-[80vh] flex flex-col">
            <div class="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 class="font-bold text-white">{{ sessionModalData.name }}</h3>
                <div class="flex gap-3 items-center">
                    <!-- Checkbox de complétion directement dans la modale -->
                    <span class="text-xs text-slate-500 uppercase" *ngIf="!planningMode">Fait?</span>
                    <input *ngIf="!planningMode" type="checkbox" (change)="toggleSessionCompleted(sessionModalData.id)" [checked]="sessionModalData.completed" class="w-6 h-6 rounded bg-slate-900 border-slate-600 text-blue-600 focus:ring-blue-600">
                    <button (click)="sessionModalData = null" class="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
                </div>
            </div>
            <div class="p-4 overflow-y-auto flex-1 space-y-3">
               <div *ngFor="let ex of sessionModalData.exercises" class="bg-slate-950 p-3 rounded border border-slate-800">
                  <p class="text-white font-bold">{{ ex.name }}</p>
                  <p class="text-xs text-slate-500 uppercase">{{ ex.bodyPart }} - {{ ex.equipment }}</p>
                  <p class="text-sm text-blue-400 mt-1 font-mono">{{ ex.sets }} x {{ ex.reps }} &#64; {{ ex.weight }}</p>
               </div>
            </div>
            <div *ngIf="planningMode" class="p-4 border-t border-slate-800 bg-slate-900 flex gap-2">
               <input type="date" [(ngModel)]="scheduleData.date" class="bg-slate-950 border border-slate-700 text-white p-2 rounded flex-1">
               <button (click)="confirmScheduleSession()" class="bg-blue-600 text-white px-4 rounded font-bold uppercase text-xs">Planifier</button>
            </div>
         </div>
      </div>

      <!-- MEAL MODAL (DETAIL + EDIT) -->
      <div *ngIf="mealModalData" class="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
         <div class="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl max-h-[80vh] flex flex-col">
            <div class="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 class="font-bold text-white">{{ mealModalData.name }}</h3>
                <div class="flex gap-3 items-center">
                    <span class="text-xs text-slate-500 uppercase" *ngIf="!planningMode">Mangé?</span>
                    <input *ngIf="!planningMode" type="checkbox" (change)="toggleMealConsumed(mealModalData.id)" [checked]="mealModalData.consumed" class="w-6 h-6 rounded bg-slate-900 border-slate-600 text-emerald-600 focus:ring-emerald-600">
                    <button (click)="mealModalData = null" class="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
                </div>
            </div>
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
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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

  // Modals & Forms State
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
  editingIngredient: any = null;
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

  todaysMeals = computed(() => { const d = new Date().toISOString().split('T')[0]; return this.dataService.scheduledMeals().filter(s => s.date === d); }); 
  todaysCalories = computed(() => { const d = new Date().toISOString().split('T')[0]; return this.dataService.scheduledMeals().filter(s => s.date === d && s.consumed).reduce((acc, c) => acc + c.caloriesSnapshot, 0); }); // Only consumed? Or planned? changed to planned to see total goal
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
    // On passe aussi l'état completed et l'ID de la session planifiée pour pouvoir le modifier
    this.sessionModalData = { ...s, name: s.sessionName, exercises: def ? def.exercises : [], completed: s.completed }; 
  }
  selectSessionForPlanning(s: any) { this.planningMode = true; this.sessionModalData = { ...s, exercises: s.exercises }; this.scheduleData.sessionId = s.id; }
  closeSessionModal() { this.sessionModalData = null; }
  
  editExercise(ex: any) { this.editingExercise = ex; this.exerciseForm = { ...ex }; }
  deleteExercise(id: string) { if(confirm('Supprimer exercice ?')) { this.dataService.exercises.update(prev => prev.filter(e => e.id !== id)); this.dataService.save(); } }
  cancelEditExercise() { this.editingExercise = null; this.exerciseForm = { equipment: 'Sans matériel' }; }
  
  saveExercise() {
    if (this.exerciseForm.name) {
      if (this.editingExercise) this.dataService.exercises.update(prev => prev.map(e => e.id === this.editingExercise.id ? { ...this.editingExercise, ...this.exerciseForm } : e));
      else this.dataService.exercises.update(prev => [...prev, { id: Date.now().toString(), ...this.exerciseForm }]);
      this.dataService.save(); this.cancelEditExercise();
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
  toggleSessionCompleted(id: string) { 
      this.dataService.scheduledSessions.update(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s)); 
      this.dataService.save(); 
      // Update modal data locally if open
      if(this.sessionModalData && this.sessionModalData.id === id) this.sessionModalData.completed = !this.sessionModalData.completed;
  }

  // Nutrition
  openMealDetail(m: any) { 
      this.planningMode = false; 
      this.mealModalData = { id: m.mealId, name: m.mealName, type: m.type, totalCalories: m.caloriesSnapshot, totalProtein: m.proteinSnapshot, totalCarbs: m.carbsSnapshot, totalFat: m.fatSnapshot, consumed: m.consumed }; 
  }
  selectMealForPlanning(m: any) { this.planningMode = true; this.mealModalData = m; this.scheduleMealData.mealId = m.id; }
  closeMealModal() { this.mealModalData = null; }
  getMealItems(mealId: string) { const m = this.dataService.meals().find(x => x.id === mealId); return m ? m.items : []; }
  
  // Ingredients (Add & Edit)
  editIngredient(ing: any) { this.editingIngredient = ing; this.newIngredient = { ...ing }; }
  deleteIngredient(id: string) { if(confirm('Supprimer aliment ?')) { this.dataService.ingredients.update(prev => prev.filter(i => i.id !== id)); this.dataService.save(); } }
  cancelEditIngredient() { this.editingIngredient = null; this.newIngredient = { baseUnit: '100g' }; }

  addIngredient() { this.saveIngredient(); } // Alias
  saveIngredient() {
    if (this.newIngredient.name) {
      if (this.editingIngredient) {
          this.dataService.ingredients.update(prev => prev.map(i => i.id === this.editingIngredient.id ? { ...this.editingIngredient, ...this.newIngredient } : i));
      } else {
          this.dataService.ingredients.update(prev => [...prev, { id: Date.now().toString(), ...this.newIngredient }]);
      }
      this.dataService.save(); this.cancelEditIngredient();
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
  toggleMealConsumed(id: string) { 
      this.dataService.scheduledMeals.update(prev => prev.map(m => m.id === id ? { ...m, consumed: !m.consumed } : m)); 
      this.dataService.save();
      if(this.mealModalData && this.mealModalData.id === id) this.mealModalData.consumed = !this.mealModalData.consumed;
  }
}
