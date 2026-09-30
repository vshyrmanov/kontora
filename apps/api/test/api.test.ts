import { addDays } from '@kontora/contracts';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { clearDb, startDb, stopDb } from './setup.js';

const { createApp } = await import('../src/app.js');
const { User } = await import('../src/models/user.model.js');
const { hashPassword } = await import('../src/modules/auth/auth.service.js');
const { today } = await import('../src/lib/time.js');

const app = createApp();
let token = '';
const authed = () => ({ Authorization: `Bearer ${token}` });

const visitAt = (day: string, time = '10:00') => `${day}T${time}:00+03:00`;
const newVisit = (overrides: Record<string, unknown> = {}) => ({
  newClient: { name: 'Олена Коваль', phone: '+380 67 123 45 67' },
  date: visitAt(today()),
  type: 'id_card',
  pickupDate: addDays(today(), 14),
  ...overrides,
});

describe('Kontora API', () => {
  before(startDb);
  after(stopDb);
  beforeEach(async () => {
    await clearDb();
    await User.create({ email: 'admin@test.ua', name: 'Адмін', role: 'admin', passwordHash: await hashPassword('password123') });
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.ua', password: 'password123' });
    token = res.body.token;
  });

  it('rejects requests without a token', async () => {
    await request(app).get('/api/visits').expect(401);
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.ua', password: 'wrongpass1' }).expect(401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('creates a visit with a new client and numbers it', async () => {
    const res = await request(app).post('/api/visits').set(authed()).send(newVisit()).expect(201);
    assert.equal(res.body.clientCreated, true);
    assert.match(res.body.visit.ref, /^К-\d{4}\/0001$/);
    assert.equal(res.body.visit.pickupStatus, 'waiting');
    assert.equal(res.body.visit.client.name, 'Олена Коваль');
  });

  it('reuses an existing client by phone', async () => {
    await request(app).post('/api/visits').set(authed()).send(newVisit()).expect(201);
    const res = await request(app)
      .post('/api/visits')
      .set(authed())
      .send(newVisit({ newClient: { name: 'Олена К.', phone: '+38 (067) 123-45-67' }, type: 'criminal_record' }))
      .expect(201);
    assert.equal(res.body.clientCreated, false);
    const clients = await request(app).get('/api/clients').set(authed()).expect(200);
    assert.equal(clients.body.total, 1);
    assert.equal(clients.body.items[0].visitsCount, 2);
    assert.equal(clients.body.items[0].pendingCount, 2);
  });

  it('validates pickup date against visit date', async () => {
    const res = await request(app)
      .post('/api/visits')
      .set(authed())
      .send(newVisit({ pickupDate: addDays(today(), -1) }))
      .expect(400);
    assert.equal(res.body.error.code, 'BAD_REQUEST');
  });

  it('returns validation details for bad input', async () => {
    const res = await request(app).post('/api/visits').set(authed()).send({ type: 'unknown' }).expect(400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('issues and un-issues a document', async () => {
    const created = await request(app).post('/api/visits').set(authed()).send(newVisit()).expect(201);
    const id = created.body.visit.id;
    const issued = await request(app).post(`/api/visits/${id}/issue`).set(authed()).expect(200);
    assert.equal(issued.body.pickupStatus, 'issued');
    assert.equal(issued.body.issuedAt, today());

    const pending = await request(app).get('/api/pickups?mode=pending').set(authed()).expect(200);
    assert.equal(pending.body.total, 0);

    const undone = await request(app).delete(`/api/visits/${id}/issue`).set(authed()).expect(200);
    assert.equal(undone.body.issuedAt, null);
  });

  it('searches visits by client name and ref', async () => {
    await request(app).post('/api/visits').set(authed()).send(newVisit()).expect(201);
    await request(app)
      .post('/api/visits')
      .set(authed())
      .send(newVisit({ newClient: { name: 'Тарас Бондаренко', phone: '+380 50 000 00 01' } }))
      .expect(201);
    const byName = await request(app).get('/api/visits').query({ q: 'тарас' }).set(authed()).expect(200);
    assert.equal(byName.body.total, 1);
    const byRef = await request(app).get('/api/visits').query({ q: '0001' }).set(authed()).expect(200);
    assert.equal(byRef.body.total, 1);
  });

  it('builds stats and dashboard', async () => {
    const day = today();
    await request(app).post('/api/visits').set(authed()).send(newVisit({ date: visitAt(day, '11:30') })).expect(201);
    const stats = await request(app)
      .get('/api/stats')
      .query({ from: addDays(day, -6), to: day })
      .set(authed())
      .expect(200);
    assert.equal(stats.body.totals.visits, 1);
    assert.equal(stats.body.totals.avgProcessingDays, 14);
    assert.equal(stats.body.series.length, 7);
    assert.equal(stats.body.byHour.find((h: { hour: number }) => h.hour === 11).value, 1);

    const dash = await request(app).get('/api/dashboard').set(authed()).expect(200);
    assert.equal(dash.body.counts.todayVisits, 1);
    assert.equal(dash.body.last14Days.length, 14);
  });

  it('only admins can delete visits', async () => {
    const created = await request(app).post('/api/visits').set(authed()).send(newVisit()).expect(201);
    await User.create({ email: 'reg@test.ua', name: 'Реєстратор', role: 'registrar', passwordHash: await hashPassword('password123') });
    const login = await request(app).post('/api/auth/login').send({ email: 'reg@test.ua', password: 'password123' });
    await request(app)
      .delete(`/api/visits/${created.body.visit.id}`)
      .set({ Authorization: `Bearer ${login.body.token}` })
      .expect(403);
    await request(app).delete(`/api/visits/${created.body.visit.id}`).set(authed()).expect(204);
  });
});
