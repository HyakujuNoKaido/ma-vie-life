import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app';

// Démarre l'app et affiche les erreurs dans la console si ça plante
bootstrapApplication(App).catch((err) => console.error("Erreur démarrage Angular:", err));


