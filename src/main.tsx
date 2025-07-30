import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createUsersTable } from './services/databaseService'

// Log database setup instructions on app start
console.log('🚀 USA Gaming Distributor Client')
console.log('📝 Database Setup Required:')
console.log(createUsersTable())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
