import mongoose from 'mongoose';

const PRIMARY_URI = process.env.MONGODB_URI;
const FALLBACK_URI = process.env.MONGODB_URI_FALLBACK;

if (!PRIMARY_URI && !FALLBACK_URI) {
  throw new Error('Missing MongoDB connection string. Set MONGODB_URI or MONGODB_URI_FALLBACK.');
}

// Keep a cached promise/connection during dev hot reloads
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null, uri: null };
}

function shouldRetryWithFallback(err) {
  if (!err) return false;
  const message = String(err.message || '');
  return (
    err.code === 'ETIMEOUT' ||
    err.code === 'ENOTFOUND' ||
    message.includes('querySrv') ||
    message.includes('queryTxt')
  );
}

async function connectWithUri(uri) {
  const connection = await mongoose.connect(uri, {
    bufferCommands: false,
    dbName: process.env.MONGODB_DB || undefined,
    serverSelectionTimeoutMS: 5000,
  });
  cached.uri = uri;
  return connection;
}

async function createConnection() {
  const uris = [PRIMARY_URI, FALLBACK_URI].filter(Boolean);
  let lastError;

  for (const uri of uris) {
    try {
      return await connectWithUri(uri);
    } catch (err) {
      lastError = err;
      if (uri === FALLBACK_URI || !shouldRetryWithFallback(err)) {
        throw err;
      }
      if (FALLBACK_URI) {
        console.warn('[mongodb] Primary URI failed, attempting fallback URI');
      }
    }
  }

  throw lastError || new Error('Unable to establish a MongoDB connection.');
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = createConnection();
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
