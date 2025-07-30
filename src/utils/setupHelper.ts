import { initializeDatabase } from '../services/databaseService'


export const checkDatabaseSetup = async () => {
  console.log('🔍 Checking database setup...')
  
  try {
    const isInitialized = await initializeDatabase()
    
    if (isInitialized) {
      console.log('✅ Database is ready!')
    } else {
      console.log('❌ Database setup required - check the instructions above')
    }
  } catch {
    console.log('❌ Database setup required - check the instructions above')
  }
}
