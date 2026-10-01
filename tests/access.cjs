'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),path=require('node:path');
const {installAccessProbe,assertAccess}=require('./access-probe.cjs');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 for(const mode of ['success','throw']){
  const page=await browser.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>{requests.push(r.request().url());return r.fulfill({status:200,body:'OK'});});
  if(mode==='throw')await page.addInitScript(()=>{window.accessCalls=[];window.fetch=(url,options)=>{window.accessCalls.push({url,options});throw new Error('Simulated synchronous failure');};});else await installAccessProbe(page);
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  assert.equal(await page.locator('#message').textContent(),'未使用ピースから1つ選びましょう。');
  await page.evaluate(()=>{for(const a of SOLUTIONS[puzzle().number]){selectPiece(a.id);shape=E.normalize(a.cells);const c=a.cells[0];activate(...c);}});
  assert.ok(await page.locator('#clear').isVisible());await page.locator('#next').click();assert.equal(await page.evaluate(()=>puzzleIndex),1);
  await page.waitForTimeout(150);
  if(mode==='success')await assertAccess(page,requests,1);else {assert.equal(await page.evaluate(()=>window.accessCalls.length),1);assert.deepEqual(requests,[]);}
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS: successful logging and synchronous fetch failure; game clears and next problem works without additional logging.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
