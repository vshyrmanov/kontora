import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-42';
process.env.APP_TIMEZONE = 'Europe/Kyiv';
process.env.MONGODB_URI = 'mongodb://placeholder';

let mongo: MongoMemoryServer | undefined;

export async function startDb() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await mongoose.connection.syncIndexes();
}

export async function stopDb() {
  await mongoose.disconnect();
  await mongo?.stop();
}

export async function clearDb() {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}
