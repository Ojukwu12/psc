import mongoose from 'mongoose';
import env from './env.js';

let isConnected = false;

export async function connectDb() {
  if (isConnected) {
    return;
  }

  try {
    mongoose.set('bufferCommands', false);
    mongoose.set('bufferTimeoutMS', 1000);

    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    
    isConnected = true;
    console.log('✅ Connected to MongoDB');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    if (!env.allowDbFallback) {
      throw error;
    }

    console.warn('Continuing without MongoDB (fallback mode enabled).');
    isConnected = false;
  }
}

export async function disconnectDb() {
  if (!isConnected) {
    return;
  }
  
  await mongoose.connection.close();
  isConnected = false;
  console.log('Disconnected from MongoDB');
}

// Export aliases for test compatibility
export const initDb = connectDb;
export const closeDb = disconnectDb;

export { mongoose };
