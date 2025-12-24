const fs = require('fs');

// Chemin vers le fichier d'environnement de prod
const targetPath = './src/environments/environment.prod.ts';

// On prépare le contenu du fichier avec les valeurs récupérées de Cloudflare (process.env)
const envConfigFile = `export const environment = {
  production: true,
  firebase: {
    apiKey: "${process.env.FIREBASE_API_KEY}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
    projectId: "${process.env.FIREBASE_PROJECT_ID}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${process.env.FIREBASE_APP_ID}"
  }
};
`;

// On écrit le fichier
fs.writeFile(targetPath, envConfigFile, function (err) {
    if (err) {
        throw console.error(err);
    } else {
        console.log(`Angular environment.prod.ts file generated correctly at ${targetPath} \n`);
    }
});
