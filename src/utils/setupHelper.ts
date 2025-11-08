import { initializeDatabase } from '../services/databaseService';
import { logger } from '../lib/logger';

export const checkDatabaseSetup = async () => {
  logger.info('🔍 Checking database setup...');

  try {
    const isInitialized = await initializeDatabase();

    if (isInitialized) {
      logger.info('✅ Database is ready!');
    } else {
      logger.warn('❌ Database setup required - check the instructions above');
    }
  } catch (err) {
    logger.error('❌ Database setup required - initialization failed', err);
  }
};
