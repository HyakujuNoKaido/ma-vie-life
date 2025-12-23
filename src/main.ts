import 'zone.js'; // Obligatoire pour Angular standard
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app'; // Notez les accolades {} car c'est un export nommé maintenant

bootstrapApplication(App).catch((err) => console.error(err));


