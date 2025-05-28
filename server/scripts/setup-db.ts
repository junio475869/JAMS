import 'dotenv/config';
import { createTables } from '../utils/migrations';
import { seedInterviewPrepData } from './seed-interview-prep';

async function setupDatabase() {
  try {
    console.log('Creating database tables...');
    await createTables();
    console.log('Database tables created successfully');

    console.log('Seeding interview prep data...');
    await seedInterviewPrepData();
    console.log('Interview prep data seeded successfully');

    console.log('Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 