// lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME; // Ganti MONGODB_DB dengan MONGODB_DB_NAME

// Validasi variabel environment
if (!MONGODB_URI) {
  throw new Error(
    'Define the MONGODB_URI environment variable inside .env.local'
  );
}

if (!MONGODB_DB_NAME) {
  // Ganti MONGODB_DB dengan MONGODB_DB_NAME
  throw new Error(
    'Define the MONGODB_DB_NAME environment variable inside .env.local' // Ganti MONGODB_DB dengan MONGODB_DB_NAME
  );
}

// Cache koneksi untuk reuse di environment serverless
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  // Jika sudah ada cache, gunakan itu
  if (cachedClient && cachedDb) {
    // console.log('Using cached MongoDB connection');
    return { client: cachedClient, db: cachedDb };
  }

  // Jika belum ada, buat koneksi baru
  const client = new MongoClient(MONGODB_URI!);

  try {
    // console.log('Attempting to connect to MongoDB...');
    await client.connect();
    const db = client.db(MONGODB_DB_NAME); // Ganti MONGODB_DB dengan MONGODB_DB_NAME

    console.log('Successfully connected to MongoDB.');

    // Simpan koneksi ke cache
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // Reset cache jika koneksi gagal
    cachedClient = null;
    cachedDb = null;
    throw new Error('Could not connect to database.');
  }
}
