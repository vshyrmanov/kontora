import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export const connectDb = async (uri: string) => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 });
  } catch (error) {
    const safeUri = uri.replace(/\/\/[^@/]+@/, '//***@');
    throw new Error(
      `Не вдалося підключитися до MongoDB (${safeUri}). Переконайтеся, що сервер запущено, ` +
        'наприклад: docker run -d --name kontora-mongo -p 27017:27017 mongo:7',
      { cause: error },
    );
  }
  await mongoose.connection.syncIndexes();
};

export const disconnectDb = () => mongoose.disconnect();
