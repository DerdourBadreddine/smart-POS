const { chromium }=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chromium',headless:true});
 const directory=path.resolve('../docs/print-previews');fs.mkdirSync(directory,{recursive:true});
 const base=process.env.BASE_URL||'http://127.0.0.1:8765';
 for(const language of ['fr','ar']){
  const context=await browser.newContext({viewport:{width:1366,height:768}});await context.addInitScript(language=>localStorage.setItem('smart-pos-language',language),language);
  const page=await context.newPage();await page.goto(base+'/sales');await page.locator('table button').first().click();await page.locator('#print-receipt').waitFor();await page.emulateMedia({media:'print'});
  await page.locator('#print-receipt').screenshot({path:path.join(directory,language+'-receipt.png')});
  if(await page.locator('#print-receipt').evaluate(element=>element.getBoundingClientRect().width)>300)throw new Error('Receipt is wider than 80mm');
  await page.goto(base+'/reports');await page.locator('.print-document').waitFor();await page.locator('.print-document').screenshot({path:path.join(directory,language+'-report-a4.png')});
  await page.emulateMedia({media:'screen'});await page.evaluate(()=>window.print=()=>{});await page.locator('app-page-header button').last().click();await page.emulateMedia({media:'print'});await page.locator('.print-document.narrow-print').waitFor();
  await page.locator('.print-document').screenshot({path:path.join(directory,language+'-report-80mm.png')});
  await page.pdf({path:path.join(directory,language+'-report-80mm.pdf'),width:'80mm',height:'300mm',printBackground:true,margin:{top:'4mm',bottom:'4mm',left:'4mm',right:'4mm'}});
  if(await page.locator('.print-document').evaluate(element=>element.getBoundingClientRect().width)>300)throw new Error('Narrow report is wider than 80mm');
  await context.close();
 }
 await browser.close();console.log('FR/AR receipt and A4/80mm report print previews saved and widths verified.');
})().catch(error=>{console.error(error);process.exitCode=1;});
