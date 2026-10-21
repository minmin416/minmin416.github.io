import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('optimized inquiry separates acknowledgements, waits for durable ack, preserves failed input', async ({ page }) => {
 const root=await mkdtemp(path.join(tmpdir(),'riverplo-inquiry-'));
 let server;
 try {
  for(const file of ['index.html','night.html','inquiry-entry.js','inquiry.css','privacy.html'])await writeFile(path.join(root,file),await readFile(file));
  execFileSync(process.execPath,['tools/optimize.mjs',root]);
  server=createServer(async(req,res)=>{try{const file=new URL(req.url,'http://local').pathname.slice(1)||'index.html';if(file.includes('..'))throw Error('path');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await readFile(path.join(root,file)));}catch{res.writeHead(404).end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let requests=0,ack;
  page.on('requestfailed',r=>console.log('SYNTHETIC request failed',r.failure()?.errorText));page.on('pageerror',e=>console.log('Page error',e.message));
  await page.route('https://riverplo-inquiry-api.river-personal-work.workers.dev/v1/inquiries',async route=>{if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST'}});return;}requests++;const data=route.request().postDataJSON();expect(data.noticeVersion).toBe('riverplo-inquiries-2026-10-21-v2');expect(data.collectionConsent).toBe(true);expect(data.overseasConsent).toBe(true);await new Promise(resolve=>ack=resolve);await route.fulfill({status:201,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:JSON.stringify({ok:true,id:data.id})});});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?night=0');
  await page.locator('.open-inquiry').click();
  await page.locator('textarea').fill('SYNTHETIC TEST ONLY');
  const send=page.locator('button[type=submit]');
  await send.click(); expect(requests).toBe(0);
  await expect(send).toHaveText('국외이전 동의 · 전송');
  await expect(page.locator('.step-notice')).toBeVisible();
  await send.click(); await expect(send).toBeDisabled();
  await expect(page.locator('textarea')).toBeDisabled();
  await expect.poll(()=>requests).toBe(1);
  await expect(send).toHaveText('Sending…');
  ack(); await expect(send).toHaveText('Success',{timeout:10000});
  await page.unrouteAll({behavior:'wait'});
  await page.route('https://riverplo-inquiry-api.river-personal-work.workers.dev/v1/inquiries',route=>route.abort());
  await page.locator('textarea').fill('SYNTHETIC FAILURE ONLY');
  await send.click(); await send.click();
  await expect(send).toHaveText('Try again');
  await expect(page.locator('textarea')).toHaveValue('SYNTHETIC FAILURE ONLY');
  await page.setViewportSize({width:320,height:568});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 } finally { if(server)await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true}); }
});
