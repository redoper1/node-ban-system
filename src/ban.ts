import {Request, Response } from 'express';
import { BanList } from './types';
import fs from 'fs';

class Ban {
    req: Request;
    res: Response;
    next: Function | undefined;

    constructor(req: Request, res: Response, next: Function | undefined, attempts: {[key: string]: number}) {
        this.req = req;
        this.res = res;
        this.next = next;
        this.ban(attempts);
    }

    ban(attempts: {[key: string]: number}) {
        const ip: string = this.req.ip;
        const requestUrl = this.req.originalUrl || this.req.url;

        const banList: BanList = loadBanList();
        if (banList[ip]) {
            this.res.status(403).send('You are banned');
            return;
        }

        if (!this.isForbiddenUrl(requestUrl)) {
            if (this.next !== undefined) {
                this.next();
            }
        } else {
            if (!attempts[ip]) {
                attempts[ip] = 1;
            } else {
                attempts[ip] = attempts[ip] + 1;
            }
            const maxAttempts = process.env.BAN_MAX_ATTEMPTS || 5;
            if (attempts[ip] >= maxAttempts) {
                banList[ip] = {
                    timestamp: new Date().getTime()
                };

                fs.writeFileSync('./ban.json', JSON.stringify(banList));
            }
            this.res.status(403).send('Forbidden');
            return;
        }
        this.res.status(404).send('Not found');
    }

    isForbiddenUrl(url: string) {
        const testRegEx: RegExp = new RegExp(process.env.BAN_TEST_REGEX || '(?:\.php)|(?:.env)|(?:\.xml)', 'gi');
        if (testRegEx.test(url)) {
            return true;
        }
        return false;
    }
}

export function loadBanList() {
    let banList: {[ip: string]: {timestamp: number}} | {} = {};
    if (fs.existsSync('./ban.json')) {
        const banListData: string = fs.readFileSync('./ban.json', 'utf8');
        if (!banListData) {
            banList = {};
            fs.writeFileSync('./ban.json', '{}');
        } else {
            banList = JSON.parse(banListData);
        }
    } else {
        fs.writeFileSync('./ban.json', '{}');
        banList = {};
    }
    return banList;
}

export default Ban;