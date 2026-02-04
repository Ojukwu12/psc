import mongoose from 'mongoose';
import env from './env.js';

let isConnected = false;

export async function connectDb() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(env.mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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
    throw error;
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

export { mongoose };
