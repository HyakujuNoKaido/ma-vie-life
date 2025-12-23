import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app';

// Cette fonction affiche les erreurs directement sur l'écran du téléphone
function showError(error: any) {
  const msg = error instanceof Error ? error.message : String(error);
  // Affiche une alerte système
  alert("ERREUR CRITIQUE:\n" + msg);
  
  // Affiche aussi l'erreur sur la page web (si l'alerte est fermée)
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; background: white; font-size: 18px; font-family: sans-serif;">
      <h1>Erreur de Démarrage</h1>
      <p>Voici le problème technique :</p>
      <pre style="background: #eee; padding: 10px; overflow: auto;">${msg}</pre>
    </div>
  `;
}

try {
  bootstrapApplication(App).catch((err) => showError(err));
} catch (e) {
  showError(e);
}


