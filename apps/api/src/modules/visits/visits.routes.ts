import { idParamSchema, pickupsQuerySchema, visitCreateSchema, visitsQuerySchema, visitUpdateSchema } from '@kontora/contracts';
import { Router } from 'express';
import { currentUser, requireRole } from '../../middleware/auth.js';
import {
  createVisit,
  deleteVisit,
  getVisit,
  listPickups,
  listVisits,
  setIssued,
  updateVisit,
} from './visits.service.js';

export const visitsRouter = Router();

visitsRouter.get('/', async (req, res) => {
  res.json(await listVisits(visitsQuerySchema.parse(req.query)));
});

visitsRouter.post('/', async (req, res) => {
  res.status(201).json(await createVisit(visitCreateSchema.parse(req.body), currentUser(res.locals).id));
});

visitsRouter.get('/:id', async (req, res) => {
  res.json(await getVisit(idParamSchema.parse(req.params).id));
});

visitsRouter.patch('/:id', async (req, res) => {
  res.json(await updateVisit(idParamSchema.parse(req.params).id, visitUpdateSchema.parse(req.body)));
});

visitsRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await deleteVisit(idParamSchema.parse(req.params).id);
  res.status(204).end();
});

visitsRouter.post('/:id/issue', async (req, res) => {
  res.json(await setIssued(idParamSchema.parse(req.params).id, true));
});

visitsRouter.delete('/:id/issue', async (req, res) => {
  res.json(await setIssued(idParamSchema.parse(req.params).id, false));
});

export const pickupsRouter = Router();

pickupsRouter.get('/', async (req, res) => {
  res.json(await listPickups(pickupsQuerySchema.parse(req.query)));
});
