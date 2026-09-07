import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

let cachedApp: Express | null = null;

async function getApp(): Promise<Express> {
  if (!cachedApp) {
    const expressInstance = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));
    configureApp(app);
    await app.init();
    cachedApp = expressInstance;
  }
  return cachedApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  app(req, res);
}
