import type { Request, Response } from 'express';
import app from '../server/app.ts';

/**
 * Vercel Serverless Function entry point
 * Automatically handles API routes when deployed on Vercel
 */
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
