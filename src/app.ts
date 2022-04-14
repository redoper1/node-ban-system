import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import {BanList} from './types';
import Ban, { loadBanList } from './ban';

const app: Express = express();
const port = process.env.PORT || 8000;

let attemps: {[key: string]: number} = {};


app.use(function(req, res, next){
  const banList: BanList = loadBanList();
  if (!banList[req.ip]) {
    next();
  } else {
    res.status(403).send('You are banned');
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.use(function(req, res, next){
  new Ban(req, res, undefined, attemps);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});