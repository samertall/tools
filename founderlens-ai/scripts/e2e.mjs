import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const url = process.env.FOUNDERLENS_URL || 'https://founderlens-ai-hetic-2026.vercel.app';
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
const context = await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'artifacts',size:{width:1280,height:720}},acceptDownloads:true});
const page = await context.newPage();
page.on('pageerror',e=>console.error('[PAGE ERROR]',e.message));
page.on('console',m=>{if(m.type()==='error')console.error('[CONSOLE]',m.text());});
try {
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByRole('button',{name:'Load synthetic example'}).click();
  assert.match(await page.locator('#assumption').inputValue(),/Independent cafés/);
  await page.screenshot({path:'artifacts/01-founder-input.png',fullPage:true});
  await page.locator('#run').click();
  try {await page.locator('#results-panel').waitFor({state:'visible',timeout:540000});}
  catch(e){console.error('Agent status:',await page.locator('#status').innerText());throw e;}
  const critique=await page.locator('#critique').inputValue();
  assert.ok(critique.length>=12,'Model returned a nonempty critique');
  console.log('Real open-weight model output:',critique.slice(0,450));
  assert.equal(await page.locator('#export').isDisabled(),true,'Human gate is enforced');
  await page.screenshot({path:'artifacts/02-ai-critique.png',fullPage:true});
  await page.locator('input[name=decision][value=revise]').check();
  await page.locator('#notes').fill('The fictional café sources are not representative. I will interview five real independent café owners before making any market decision.');
  await page.locator('#ack').check();
  assert.equal(await page.locator('#export').isEnabled(),true);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  assert.match(download.suggestedFilename(),/FounderLens/);
  await download.saveAs('artifacts/founder-reviewed-report.md');
  await page.screenshot({path:'artifacts/03-human-approved.png',fullPage:true});
  console.log('PASS: Real model inference, sources, human checkpoint, report export');
} finally {await context.close();await browser.close();}
