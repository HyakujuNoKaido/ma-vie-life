import { bootstrapApplication } from '@angular/platform-browser';
import App from './app.ts'; // Importe le 'export default' de votre fichier app.ts

bootstrapApplication(App).catch((err) => console.error(err));
