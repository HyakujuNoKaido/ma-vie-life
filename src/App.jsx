import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div class="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center transition-all hover:shadow-2xl">
        <div class="mb-6 flex justify-center">
          <div class="bg-blue-100 p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h1 class="text-3xl font-bold text-gray-800 mb-2">App successfully loaded</h1>
        <p class="text-gray-500 mb-8">The Angular component has been fixed and is now bootstrapping correctly.</p>

        <div class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4 text-left border border-gray-100">
            <h3 class="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-2">Status</h3>
            <div class="flex items-center space-x-2 text-green-600">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span class="font-medium">Active & Running</span>
            </div>
          </div>

          <button 
            (click)="increment()" 
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Test Interaction: {{ count() }}</span>
          </button>
        </div>
      </div>
      
      <p class="mt-8 text-sm text-gray-400">Ready for further development</p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class App {
  count = signal(0);
  
  increment() {
    this.count.update(c => c + 1);
  }
}
