import type {IncomingMessage,ServerResponse} from 'node:http';
import {garageHandler} from '../server/garage-http.js';
export default function handler(req:IncomingMessage,res:ServerResponse){return garageHandler(req,res,true);}
