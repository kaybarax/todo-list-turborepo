import { Elysia } from 'elysia';
import { indexRoute } from './routes/index.route';

export const app = new Elysia().use(indexRoute);
