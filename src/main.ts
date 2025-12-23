import 'zone.js';
import '@angular/compiler'; // <-- LA SOLUTION MAGIQUE (Roue de secours JIT)
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app';

bootstrapApplication(App).catch((err) => {
  console.error("Erreur critique au démarrage :", err);
  document.body.innerHTML = `
    <div style="background-color: #fef2f2; color: #991b1b; padding: 20px; font-family: sans-serif;">
      <h1>⚠️ Erreur au lancement</h1>
      <pre>${err.message || err}</pre>
    </div>
  `;
});


