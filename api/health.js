import {apiKey} from '../lib/youcam.js';
export default function handler(req,res){if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});res.setHeader('Cache-Control','no-store');return res.status(200).json({configured:Boolean(apiKey()),provider:'YouCam Skin Analysis API v2.0'});}
