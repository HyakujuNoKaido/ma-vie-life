import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.ts'

// Ce fichier fait le lien entre votre HTML (balise #root) et votre code React (App.jsx)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
