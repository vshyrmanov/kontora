import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export const connectDb = async (uri: string) => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  await mongoose.connection.syncIndexes();
};

export const disconnectDb = () => mongoose.disconnect();
