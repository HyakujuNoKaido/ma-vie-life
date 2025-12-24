import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

export const config: ApplicationConfig = {
  providers: [
    provideRouter([]) // Pas de routes définies car c'est une SPA "one-page" dans ton code
  ]
};
