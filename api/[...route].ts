import express from 'express';
import { apiRouter } from '../src/server/routes.js';
import { getDb } from '../src/server/db.js';

const app = express();

app.use(express.json());
app.use('/api', apiRouter);

export default async function handler(req: any, res: any) {
  await getDb();
  return app(req, res);
}