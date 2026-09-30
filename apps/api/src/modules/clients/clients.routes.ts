import { clientInputSchema, clientsQuerySchema, clientUpdateSchema, idParamSchema } from '@kontora/contracts';
import { Router } from 'express';
import { createClient, getClient, listClients, updateClient } from './clients.service.js';

export const clientsRouter = Router();

clientsRouter.get('/', async (req, res) => {
  res.json(await listClients(clientsQuerySchema.parse(req.query)));
});

clientsRouter.post('/', async (req, res) => {
  res.status(201).json(await createClient(clientInputSchema.parse(req.body)));
});

clientsRouter.get('/:id', async (req, res) => {
  res.json(await getClient(idParamSchema.parse(req.params).id));
});

clientsRouter.patch('/:id', async (req, res) => {
  res.json(await updateClient(idParamSchema.parse(req.params).id, clientUpdateSchema.parse(req.body)));
});
