import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('output/project-lab', {recursive:true});
const browser=await chromium.launch();const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3000/project-lab');await page.getByRole('heading',{name:'How should the work feel?'}).waitFor();await page.waitForTimeout(800);await page.screenshot({path:'output/project-lab/index-desktop.png'});
 await page.locator('[data-direction="playable"]').click();await page.getByRole('heading',{name:'Less explaining. More trying.'}).waitFor();await page.waitForTimeout(800);await page.screenshot({path:'output/project-lab/playable-desktop.png'});
 await page.getByRole('button',{name:'Run the demo'}).click();await page.getByRole('button',{name:'Codex Coding agent'}).click();await page.waitForTimeout(2100);assert.equal(await page.getByRole('button',{name:'Inspect the output'}).count(),0,'switching agent cancels old run');
 await page.getByRole('button',{name:'Run the demo'}).click();await page.getByRole('button',{name:'Inspect the output'}).click();await page.getByRole('button',{name:'Fixes',exact:true}).click();assert.equal(await page.getByRole('heading',{name:'Your workspace, everywhere.'}).count(),0);await page.keyboard.press('Escape');await page.getByRole('button',{name:'Move workspace to cloud'}).click();await page.getByRole('button',{name:'Close local session',exact:true}).click();assert.match(await page.getByRole('status').textContent(),/Local closed/);await page.getByRole('button',{name:'Reopen local session'}).click();assert.match(await page.getByRole('status').textContent(),/Workspace in the cloud/);console.log('Playable run, cancellation, output filters, modal exit and cloud sequence passed.');
 await page.getByRole('button',{name:'Back to presentation comparison'}).click();await page.locator('[data-direction="screening"]').click();await page.getByRole('heading',{name:'AgentSky A little closer to the cloud.'}).waitFor();await page.waitForTimeout(800);await page.screenshot({path:'output/project-lab/screening-desktop.png'});assert.equal(await page.locator('video').count(),0);await page.getByRole('button',{name:'Watch the film'}).click();await page.locator('video').evaluate(v=>v.readyState>=1?null:new Promise(r=>v.addEventListener('loadedmetadata',r,{once:true})));await page.getByRole('button',{name:'Explore the output'}).click();assert.ok(await page.locator('video').evaluate(v=>v.currentTime>=18));await page.keyboard.press('Escape');assert.equal(await page.locator('video').count(),0);console.log('Film loads on demand, seeks chapters and unmounts on close.');
 await page.getByRole('button',{name:'View The designer’s archive'}).click();await page.getByRole('heading',{name:'AgentSky Form follows understanding.'}).waitFor();await page.waitForTimeout(800);await page.screenshot({path:'output/project-lab/archive-desktop.png'});await page.locator('.pl-artifact').first().click();await page.getByRole('dialog',{name:'Inspect the design'}).getByRole('button',{name:/02.*The workspace/}).click();await page.getByRole('heading',{name:'Close the window. Keep the context.'}).waitFor();await page.keyboard.press('Escape');console.log('Archive artifact selection and modal exit passed.');
 for(const width of [390,320,768]){
  await page.setViewportSize({width,height:844});
  for(const direction of ['screening','playable','archive']){
   await page.goto(`http://localhost:3000/project-lab#${direction}`);await page.locator('main h1').waitFor();await page.waitForTimeout(400);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${direction} overflow at ${width}`);
   if(width===390)await page.screenshot({path:`output/project-lab/${direction}-mobile.png`});
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://localhost:3000/project-lab#playable');await page.getByRole('button',{name:'Run the demo'}).click();await page.getByRole('button',{name:'Inspect the output'}).waitFor();console.log('320, 390 and 768px layouts and reduced-motion run passed.');
 assert.deepEqual(errors,[]);console.log('No browser exceptions.');
}finally{await browser.close()}
