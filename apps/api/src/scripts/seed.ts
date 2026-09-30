/**
 * npm run seed            — створює адміністратора (SEED_ADMIN_*)
 * npm run seed -- --demo  — додатково заповнює базу демо-даними (лише якщо вона порожня)
 */
import { zonedDayStart } from '@kontora/contracts';
import { env } from '../config/env.js';
import { connectDb, disconnectDb } from '../db.js';
import { phoneDigits } from '../lib/text.js';
import { today } from '../lib/time.js';
import { Client } from '../models/client.model.js';
import { nextSequence } from '../models/counter.model.js';
import { User } from '../models/user.model.js';
import { Visit } from '../models/visit.model.js';
import { hashPassword } from '../modules/auth/auth.service.js';
import { generateDemo } from './demo-data.js';

const config = env();
await connectDb(config.MONGODB_URI);

const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@kontora.local';
const password = process.env.SEED_ADMIN_PASSWORD;
if (!password || password.length < 8) throw new Error('Задайте SEED_ADMIN_PASSWORD (мінімум 8 символів)');

if (await User.exists({ email })) {
  console.log(`Адміністратор ${email} вже існує`);
} else {
  await User.create({ email, name: process.env.SEED_ADMIN_NAME ?? 'Адміністратор', role: 'admin', passwordHash: await hashPassword(password) });
  console.log(`Створено адміністратора ${email}`);
}

if (process.argv.includes('--demo')) {
  if (await Visit.estimatedDocumentCount()) {
    console.log('Візити вже є в базі — демо-дані не додано');
  } else {
    const { clients, visits } = generateDemo(today());
    const created = await Client.insertMany(clients.map((c) => ({ ...c, phoneDigits: phoneDigits(c.phone) })));
    const docs = [];
    for (const v of visits) {
      const date = new Date(zonedDayStart(v.day, config.APP_TIMEZONE).getTime() + (v.hour * 60 + v.minute) * 60_000);
      const year = v.day.slice(0, 4);
      const seq = await nextSequence(`visit-${year}`);
      docs.push({
        ref: `К-${year}/${String(seq).padStart(4, '0')}`,
        client: created[v.clientIndex]!._id,
        date,
        type: v.type,
        pickupDate: v.pickupDate,
        issuedAt: v.issuedAt,
      });
    }
    await Visit.insertMany(docs);
    console.log(`Демо-дані: ${created.length} клієнтів, ${docs.length} візитів`);
  }
}

await disconnectDb();
