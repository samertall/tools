/**
 * Real browser recording. NO HAR fixtures, API interception, synthetic-mode toggles
 * or screenshots from third-party products. Fails unless LIVE CMC data and a
 * computed health index are visible in the production app.
 * Run only as part of the independent CI smoke test.
 */
import { chromium } from 'playwright';
import { mkdirSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const ROOT=resolve(import.meta.dirname,'..');
const OUT=join(ROOT,'demo');
const RAW=join(OUT,'.raw');
mkdirSync(RAW,{recursive:true});
const origin=process.env.SIGNAL_ATLAS_URL||'https://signal-atlas-cmc-2026.vercel.app';
const sleep=async(page,ms)=>await page.waitForTimeout(ms);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir:RAW,size:{width:1280,height:720}}});
const page=await context.newPage();
page.on('pageerror',err=>console.error('Browser error: '+err.message));
try{
  const res=await page.goto(origin,{waitUntil:'domcontentloaded',timeout:60000});
  if(!res||!res.ok())throw new Error('Production homepage HTTP response unavailable');
  await page.waitForFunction(()=>{
     const pill=document.querySelector('#source-pill')?.textContent||'';
     const score=document.querySelector('#score')?.textContent||'';
     const tiles=document.querySelectorAll('#heatmap .tile').length;
     return pill.includes('LIVE') && /^\d+$/.test(score.trim()) && tiles>=20;
  },null,{timeout:80000});
  console.log('LIVE validated: score',await page.locator('#score').innerText(),
              'tiles',await page.locator('#heatmap .tile').count());
  await page.screenshot({path:join(OUT,'screenshot-live-overview.png')});
  await sleep(page,5500);
  await page.mouse.wheel(0,590);await sleep(page,4700);
  await page.mouse.wheel(0,560);await sleep(page,4700);
  await page.locator('#desktop-nav button[data-tab="screener"]').click();
  await sleep(page,2300);
  await page.locator('#scanner-results button[data-action="watch"]').first().click();
  await sleep(page,800);
  await page.locator('#scanner-results button[data-action="watch"]').nth(1).click();
  await sleep(page,800);
  await page.locator('#search').fill('BTC');
  await sleep(page,2400);
  await page.locator('#search').fill('');
  await page.locator('#filter').selectOption('gainers');
  await sleep(page,3000);
  await page.locator('#filter').selectOption('all');
  await page.locator('#desktop-nav button[data-tab="portfolio"]').click();
  await sleep(page,3300);
  await page.locator('#shock').evaluate(el=>{el.value='-25';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await sleep(page,4200);
  await page.locator('#shock').evaluate(el=>{el.value='10';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await sleep(page,3400);
  await page.locator('#desktop-nav button[data-tab="evidence"]').click();
  await page.locator('#evidence-list .evidence-item').first().waitFor({timeout:15000});
  await page.screenshot({path:join(OUT,'screenshot-api-evidence.png')});
  await sleep(page,6000);
  await page.mouse.wheel(0,660);await sleep(page,4200);
  await page.mouse.wheel(0,-720);await sleep(page,3500);
  await page.locator('#desktop-nav button[data-tab="overview"]').click();
  await sleep(page,5500);
  console.log('LIVE UI recording completed');
}finally{
  const video=page.video();
  await context.close();
  if(video){
    const path=await video.path();
    copyFileSync(path,join(OUT,'signal-atlas-live-demo.webm'));
    console.log('Recorded video at '+join(OUT,'signal-atlas-live-demo.webm'));
  }
  await browser.close();
}
