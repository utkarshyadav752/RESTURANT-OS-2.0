import type { Request, Response } from 'express';
import app from '../server/app.ts';

/**
 * Vercel Serverless Function Catch-All Handler
 * Handles all requests matching /api/* on Vercel deployments
 */
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
