import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fr from '../src/assets/i18n/fr.json';
import ar from '../src/assets/i18n/ar.json';
import type { Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const browserErrors = new WeakMap<Page,string[]>();
const expectedValidationPaths = new WeakMap<Page,Set<string>>();
const printDirectory=path.resolve('../docs/print-previews');
fs.mkdirSync(printDirectory,{recursive:true});
test.beforeEach(async({page})=>{
  const errors:string[]=[];browserErrors.set(page,errors);
  expectedValidationPaths.set(page,new Set());
  await page.exposeFunction('recordRawTranslationKey',(key:string)=>errors.push('Raw translation key: '+key));
  await page.addInitScript(()=>{
    const seen=new Set<string>();
    const inspect=()=>{
      for(const match of (document.body?.innerText||'').matchAll(/\b(?:(?:fr|ar)\.)?(?:nav|common|errors|confirmation|repairs|settings|pos|inventory|reports|dashboard|customers|sales)\.[A-Za-z]+/g)){
        if(!seen.has(match[0])){seen.add(match[0]);void (window as unknown as {recordRawTranslationKey:(key:string)=>Promise<void>}).recordRawTranslationKey(match[0]);}
      }
    };
    addEventListener('DOMContentLoaded',()=>{new MutationObserver(inspect).observe(document.body,{subtree:true,childList:true,characterData:true});inspect();});
  });
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'){
    const location=message.location().url;
    if(location && expectedValidationPaths.get(page)?.has(new URL(location).pathname) && /400/.test(message.text()))return;
    errors.push(message.text());
  }});
  page.on('requestfailed',request=>errors.push(request.url()));
  page.on('response',response=>{if(response.status()>=400){if(response.status()===400&&expectedValidationPaths.get(page)?.has(new URL(response.url()).pathname))return;errors.push(`${response.status()} ${response.url()}`);}});
  page.on('request',request=>{if(!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(request.url()))errors.push('External request: '+request.url());});
});
test.afterEach(async({page})=>expect(browserErrors.get(page)||[]).toEqual([]));

test('inventory forms, limits, credit refusal, settings, repair refusal and keyboard state',async({page,request,browser},testInfo)=>{
  const lang=testInfo.project.metadata['lang'] as 'fr'|'ar';const t=lang==='fr'?fr:ar;const id=String(Date.now());
  await page.addInitScript(lang=>localStorage.setItem('smart-pos-language',lang),lang);
  const category=await(await request.post('/api/categories/',{data:{name:'00 Forms '+id,kind:'ACCESSORY'}})).json();
  await page.goto('/inventory');
  await page.getByRole('button',{name:t.inventory.addProduct,exact:true}).first().click();
  await page.locator('[formControlName=name]').fill('Form product '+id);await page.locator('[formControlName=sku]').fill('FORM'+id);
  await page.locator('[formControlName=category]').click();await page.getByRole('option',{name:category.name,exact:true}).click();
  await page.locator('[formControlName=cost_price]').fill('5');await page.locator('[formControlName=sell_price]').fill('25');await page.locator('[formControlName=stock_qty]').fill('3');
  const create=page.waitForResponse(r=>r.url().endsWith('/api/products/')&&r.request().method()==='POST');
  await page.getByRole('button',{name:t.common.save,exact:true}).click();const product=await(await create).json();expect(product.stock_qty).toBe(3);
  await page.locator('input').first().fill('FORM'+id);const row=page.getByRole('row').filter({hasText:'Form product '+id});
  await row.getByRole('button',{name:t.common.edit,exact:true}).click();await page.locator('[formControlName=sell_price]').fill('30');await page.getByRole('button',{name:t.common.save,exact:true}).click();
  await row.getByRole('button',{name:t.inventory.adjustStock,exact:true}).click();await page.locator('[formControlName=delta]').fill('2');await page.getByRole('button',{name:t.common.save,exact:true}).click();
  await expect.poll(async()=>(await(await request.get(`/api/products/${product.id}/`)).json()).stock_qty).toBe(5);
  await page.getByRole('button',{name:t.inventory.csv.importExport,exact:true}).click();
  const template=page.waitForEvent('download');await page.getByRole('button',{name:t.inventory.csv.downloadTemplate,exact:true}).click();expect((await template).suggestedFilename()).toContain('.csv');
  await page.getByRole('button',{name:t.common.cancel,exact:true}).click();
  const exported=page.waitForEvent('download');await page.getByRole('button',{name:t.inventory.csv.export,exact:true}).click();expect((await exported).suggestedFilename()).toContain('.csv');

  const settings=await(await request.get('/api/settings/')).json();
  try{
    await page.goto('/settings');
    await page.getByRole('textbox',{name:t.settings.receipt_footer_fr,exact:true}).fill('FR Footer '+id);await page.getByRole('textbox',{name:t.settings.receipt_footer_ar,exact:true}).fill('AR Footer '+id);
    await page.locator('[formControlName=default_language]').click();await page.getByRole('option',{name:t.settings.arabic,exact:true}).click();
    const save=page.waitForResponse(r=>r.url().endsWith('/api/settings/1/')&&r.request().method()==='PUT');await page.getByRole('button',{name:t.common.save,exact:true}).click();expect((await save).ok()).toBeTruthy();
    const fresh=await browser.newContext();const freshPage=await fresh.newPage();await freshPage.goto((testInfo.project.use.baseURL||'http://127.0.0.1:8765')+'/dashboard');await expect(freshPage.locator('html')).toHaveAttribute('lang','ar');await fresh.close();
    await page.goto('/pos');await page.keyboard.press('F2');await expect(page.locator('input').first()).toBeFocused();await page.locator('input').first().fill('FORM'+id);await page.locator('.result-row').click();
    for(let i=0;i<7;i++)await page.locator('.line-controls button').last().click();await expect(page.locator('.line-controls')).toContainText('5');
    await page.locator('.language-button').click();await expect(page.locator('.line-controls')).toContainText('5');await page.locator('.language-button').click();
    await page.locator('.price-input').fill('32.50');await page.locator('.price-input').press('Tab');await page.locator('.discount-row input').fill('2.50');await page.locator('.discount-row input').press('Tab');
    await page.keyboard.press('F9');await page.getByRole('dialog').locator('input').fill('1');await page.getByRole('button',{name:t.pos.confirmSale,exact:true}).click();await expect(page.getByRole('dialog')).toContainText(t.pos.creditCustomerRequired);
    await page.getByRole('dialog').locator('input').fill('200');const sold=page.waitForResponse(r=>r.url().endsWith('/api/sales/')&&r.request().method()==='POST');await page.getByRole('button',{name:t.pos.confirmSale,exact:true}).click();expect(Number((await(await sold).json()).total)).toBe(160);
    await expect(page.locator('#print-receipt')).toContainText((lang==='fr'?'FR':'AR')+' Footer '+id);
    await page.getByRole('button',{name:t.common.close,exact:true}).click();
    await page.locator('input').first().fill('FORM'+id);await page.locator('input').first().press('Enter');await expect(page.locator('.cart-line')).toHaveCount(0);
  }finally{await request.put('/api/settings/1/',{data:settings});}

  await page.goto('/repairs/new');await page.getByRole('button',{name:t.customers.add,exact:true}).click();await page.locator('[formControlName=name]').fill('Quick '+id);await page.getByRole('dialog').getByRole('button',{name:t.common.save,exact:true}).click();
  await page.locator('mat-select').click();await page.getByRole('option',{name:new RegExp('Quick '+id)}).click();
  await page.locator('[formControlName=device_brand]').fill('Test');await page.locator('[formControlName=device_model]').fill('Phone');await page.locator('[formControlName=issue_description]').fill('Issue');await page.locator('[formControlName=labor_cost]').fill('10');
  const created=page.waitForResponse(r=>r.url().endsWith('/api/repairs/')&&r.request().method()==='POST');await page.getByRole('button',{name:t.common.save,exact:true}).click();const ticket=await(await created).json();
  const failurePath=`/api/repairs/${ticket.id}/status/`;expectedValidationPaths.get(page)!.add(failurePath);
  await page.locator('mat-select').first().click();const blocked=page.waitForResponse(r=>new URL(r.url()).pathname===failurePath);await page.getByRole('option',{name:t.repairs.statuses.DELIVERED,exact:true}).click();expect((await blocked).status()).toBe(400);
  await expect(page.locator('mat-select').first()).toContainText(t.repairs.statuses.RECEIVED);
  await expect(page.locator('mat-snack-bar-container').filter({hasText:lang==='fr'?'solde':'رصيد'})).toBeVisible();
  await page.goto('/repairs');await page.getByRole('button',{name:t.repairs.boardView,exact:true}).click();await expect(page.locator('.board')).toBeVisible();await page.getByRole('button',{name:t.repairs.tableView,exact:true}).click();await expect(page.locator('table')).toBeVisible();
});

test('checkout, credit collection, void, repair, expenses and report', async ({ page, request }, testInfo) => {
  const lang = testInfo.project.metadata['lang'] as 'fr'|'ar';
  const t = lang === 'fr' ? fr : ar;
  await page.addInitScript(lang => localStorage.setItem('smart-pos-language', lang), lang);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => { if(message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(request.url()));
  page.on('request', request => { if(!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(request.url())) errors.push(`external: ${request.url()}`); });
  page.on('response', response => { if(response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const id = `${Date.now()}-${testInfo.project.name}`;
  const categoryResponse = await request.post('/api/categories/', {data:{name:`E2E ${id}`,kind:'ACCESSORY'}});
  expect(categoryResponse.ok()).toBeTruthy();
  const category = await categoryResponse.json();
  const product = await (await request.post('/api/products/', {data:{name:`Cable ${id}`,sku:id,category:category.id,cost_price:'5.00',sell_price:'25.00',stock_qty:10}})).json();
  const customer = await (await request.post('/api/customers/', {data:{name:`Client ${id}`,phone:'0555123456'}})).json();
  await page.goto('/pos');
  await page.locator('input').first().fill(id);
  await page.locator('.result-row').first().click();
  await page.keyboard.press('F9');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').locator('mat-select').first().click();
  await page.getByRole('option', {name:new RegExp(customer.name)}).click();
  await page.getByRole('dialog').locator('input[type=number]').fill('10');
  const created = page.waitForResponse(r=>r.url().endsWith('/api/sales/') && r.request().method()==='POST');
  await page.getByRole('button',{name:t.pos.confirmSale,exact:true}).click();
  const sale = await (await created).json();
  expect(Number(sale.balance)).toBe(15);
  await expect(page.locator('#print-receipt')).toBeVisible();
  await expect(page.locator('#print-receipt')).toContainText(lang==='fr'?'25,00':'25.00');
  await page.pdf({path:path.join(printDirectory,`${testInfo.project.name}-receipt.pdf`),width:'80mm',height:'200mm',printBackground:true,margin:{top:'4mm',bottom:'4mm',left:'4mm',right:'4mm'}});
  await page.getByRole('button',{name:t.common.close,exact:true}).click();
  expect((await (await request.get(`/api/products/${product.id}/`)).json()).stock_qty).toBe(9);

  await page.goto('/customers');
  await page.locator('input').first().fill(customer.name);
  const row = page.getByRole('row').filter({hasText:customer.name});
  await row.getByRole('button',{name:t.customers.details}).click();
  await page.getByRole('button',{name:t.customers.collect,exact:true}).click();
  await page.getByRole('dialog').last().locator('input').fill('15');
  const collection=page.waitForResponse(r=>r.url().endsWith('/collect/'));
  await page.getByRole('button',{name:t.common.confirm,exact:true}).click();
  expect((await collection).ok()).toBeTruthy();
  expect(Number((await (await request.get(`/api/sales/${sale.id}/`)).json()).balance)).toBe(0);
  await page.goto('/sales');
  const saleRow=page.getByRole('row').filter({hasText:sale.number});
  await saleRow.getByRole('button',{name:t.sales.void,exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:t.common.confirm,exact:true}).click();
  await expect(saleRow).toContainText(t.sales.statuses.VOIDED);
  expect((await (await request.get(`/api/products/${product.id}/`)).json()).stock_qty).toBe(10);

  await page.goto('/repairs/new');
  await page.locator('mat-select').click();
  await page.getByRole('option',{name:new RegExp(customer.name)}).click();
  await page.locator('[formControlName=device_brand]').fill('Test');
  await page.locator('[formControlName=device_model]').fill('Phone');
  await page.locator('[formControlName=issue_description]').fill('Broken screen');
  await page.locator('[formControlName=labor_cost]').fill('30');
  await page.locator('[formControlName=deposit_paid]').fill('10');
  const ticketResponse=page.waitForResponse(r=>r.url().endsWith('/api/repairs/') && r.request().method()==='POST');
  await page.getByRole('button',{name:t.common.save,exact:true}).click();
  const ticket=await (await ticketResponse).json();
  expect(Number(ticket.deposit_paid)).toBe(10);
  await expect(page).toHaveURL(new RegExp(`/repairs/${ticket.id}$`));
  await page.locator('input').first().fill(id);
  const addPart=page.waitForResponse(r=>r.url().endsWith('/add-part/'));
  await page.getByRole('button',{name:t.common.add,exact:true}).click();
  const part=await (await addPart).json();
  expect((await (await request.get(`/api/products/${product.id}/`)).json()).stock_qty).toBe(9);
  await page.getByRole('button',{name:t.common.remove,exact:true}).click();
  await expect.poll(async()=>(await (await request.get(`/api/products/${product.id}/`)).json()).stock_qty).toBe(10);
  await page.getByRole('button',{name:t.repairs.recordPayment,exact:true}).click();
  const payment=page.waitForResponse(r=>r.url().endsWith('/payment/'));
  await page.getByRole('dialog').getByRole('button',{name:t.common.confirm,exact:true}).click();
  expect((await payment).ok()).toBeTruthy();
  await page.locator('mat-select').first().click();
  await page.getByRole('option',{name:t.repairs.statuses.READY,exact:true}).click();
  await expect(page.getByRole('button',{name:t.repairs.whatsapp})).toBeVisible();
  await page.locator('mat-select').first().click();
  await page.getByRole('option',{name:t.repairs.statuses.DELIVERED,exact:true}).click();
  await expect.poll(async()=> (await (await request.get(`/api/repairs/${ticket.id}/`)).json()).status).toBe('DELIVERED');
  await page.pdf({path:path.join(printDirectory,`${testInfo.project.name}-repair.pdf`),format:'A4',printBackground:true});

  await page.goto('/expenses');
  await page.getByRole('button',{name:t.expenses.add,exact:true}).click();
  await page.locator('[formControlName=label]').fill(`Expense ${id}`);
  await page.locator('[formControlName=amount]').fill('7.50');
  await page.getByRole('button',{name:t.common.save,exact:true}).click();
  await expect(page.getByRole('row').filter({hasText:`Expense ${id}`})).toBeVisible();
  const expenseRow=page.getByRole('row').filter({hasText:`Expense ${id}`});
  await expenseRow.getByRole('button',{name:t.common.edit,exact:true}).click();
  await page.locator('[formControlName=amount]').fill('8.50');
  await page.getByRole('button',{name:t.common.save,exact:true}).click();
  await expect(expenseRow).toContainText(lang==='fr'?'8,50':'8.50');
  await expenseRow.getByRole('button',{name:t.common.remove,exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:t.common.confirm,exact:true}).click();
  await expect(expenseRow).toHaveCount(0);
  await page.goto('/reports');
  await expect(page.locator('.print-document')).toBeVisible();
  await page.pdf({path:path.join(printDirectory,`${testInfo.project.name}-report.pdf`),format:'A4',printBackground:true});
  const report=await (await request.get('/api/reports/end-of-day/')).json();
  const sum=(values:Record<string,string>)=>Object.values(values).reduce((a,b)=>a+Math.round(Number(b)*100),0);
  expect(Math.round(Number(report.net_total)*100)).toBe(sum(report.sales_collected_by_method)+sum(report.debts_collected_by_method)+Math.round(Number(report.repair_income)*100)-Math.round(Number(report.expenses_total)*100));
  await page.locator('.language-button').click();
  await expect(page.locator('html')).toHaveAttribute('dir',lang==='fr'?'rtl':'ltr');
  await page.locator('.language-button').click();
  await expect(page.locator('html')).toHaveAttribute('dir',lang==='fr'?'ltr':'rtl');
  expect(errors).toEqual([]);
});

test('receive valid IMEI, reject invalid check digit, scan sale, CSV preview and import',async({page,request},testInfo)=>{
  const lang=testInfo.project.metadata['lang'] as 'fr'|'ar';const t=lang==='fr'?fr:ar;
  await page.addInitScript(lang=>localStorage.setItem('smart-pos-language',lang),lang);
  const id=String(Date.now());
  const digits=id.padStart(14,'3').slice(-14);let sum=0;[...digits].forEach((c,i)=>{let n=Number(c)*(i%2?2:1);sum+=n>9?n-9:n;});const imei=digits+String((10-sum%10)%10);
  const category=await(await request.post('/api/categories/',{data:{name:'Phones '+id,kind:'PHONE'}})).json();
  const product=await(await request.post('/api/products/',{data:{name:'Phone '+id,sku:'P'+id,category:category.id,track_imei:true,cost_price:'800',sell_price:'1234.50',warranty_days:30}})).json();
  await page.goto('/inventory/phones/'+product.id);
  await page.getByRole('button',{name:t.inventory.receivePhone,exact:true}).first().click();
  await page.locator('[formControlName=imei]').fill(imei.slice(0,14)+String((Number(imei[14])+1)%10));
  await page.getByRole('button',{name:t.common.save,exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(t.inventory.imeiChecksum);
  await page.locator('[formControlName=imei]').fill(imei);
  const received=page.waitForResponse(r=>r.url().endsWith('/api/phone-units/')&&r.request().method()==='POST');
  await page.getByRole('button',{name:t.common.save,exact:true}).click();expect((await received).ok()).toBeTruthy();
  await expect(page.getByRole('cell',{name:imei,exact:true})).toBeVisible();
  await page.goto('/pos');
  await page.locator('input').first().fill(imei);await page.locator('input').first().press('Enter');
  await expect(page.locator('.cart-line')).toContainText(imei);
  await page.keyboard.press('F9');
  await page.getByRole('dialog').locator('input').fill('1300');
  await expect(page.getByRole('dialog')).toContainText(t.pos.changeDue);
  const sold=page.waitForResponse(r=>r.url().endsWith('/api/sales/')&&r.request().method()==='POST');
  await page.getByRole('button',{name:t.pos.confirmSale,exact:true}).click();const sale=await(await sold).json();expect(Number(sale.total)).toBe(1234.50);
  await expect(page.locator('#print-receipt')).toContainText(imei);
  await expect(page.locator('#print-receipt')).toContainText(t.pos.warranty);
  const device=await(await request.get('/api/devices/lookup/?imei='+imei)).json();expect(device.warranty.active).toBe(true);
  await page.goto('/devices');await page.locator('input').fill(imei);await page.getByRole('button',{name:t.common.search,exact:true}).click();await expect(page.locator('.banner')).toContainText(t.devices.underWarranty);
  await page.goto('/inventory');await page.getByRole('button',{name:t.inventory.csv.importExport,exact:true}).click();
  const csv=`sku;name;category;cost_price;sell_price;stock_qty\nCSV${id};Câble كابل ${id};Import;1.25;2.50;3\n`;
  await page.locator('input[type=file]').setInputFiles({name:'catalog.csv',mimeType:'text/csv',buffer:Buffer.from('\ufeff'+csv)});
  const preview=page.waitForResponse(r=>r.url().includes('import-csv/?dry_run=true'));
  await page.getByRole('button',{name:t.inventory.csv.checkFile,exact:true}).click();expect((await(await preview).json()).errors).toEqual([]);
  expect((await(await request.get('/api/products/?search=CSV'+id)).json()).count).toBe(0);
  const imported=page.waitForResponse(r=>r.url().includes('import-csv/?dry_run=false'));
  await page.getByRole('button',{name:t.inventory.csv.import,exact:true}).click();expect((await imported).ok()).toBeTruthy();
  const importedProduct=(await(await request.get('/api/products/?search=CSV'+id)).json()).results[0];expect(importedProduct.stock_qty).toBe(3);
  const movements=await(await request.get('/api/stock-movements/?product='+importedProduct.id)).json();expect(movements.results[0].quantity_change).toBe(3);
});

test('routes are accessible and local', async ({page},testInfo)=>{
  const lang=testInfo.project.metadata['lang'];
  await page.addInitScript(lang=>localStorage.setItem('smart-pos-language',String(lang)),lang);
  for(const route of ['dashboard','inventory','pos','sales','repairs','repairs/new','customers','devices','expenses','reports','settings']){
    await page.goto('/'+route);
    await page.waitForTimeout(300);
    const violations=(await new AxeBuilder({page}).analyze()).violations.filter(v=>['serious','critical'].includes(v.impact||''));
    expect(violations,route).toEqual([]);
    await expect(page.locator('main')).not.toContainText(/\b(?:nav|common|dashboard|inventory|repairs|reports|settings)\.[a-zA-Z]+/);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),route).toBe(false);
    expect(await page.evaluate(()=>document.fonts.check('24px "Material Icons"')),route+' icon font').toBe(true);
  }
});
