import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url);
const axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
const output='.build/accessibility/private-explorer-startup';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const reports=[];const errors=[];
const fullscreenPath='M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5';
function paintedImage() {
 const canvas=document.querySelector('#viewer .openseadragon-canvas canvas');
 if(!canvas || !canvas.width || !canvas.height)return false;
 const sample=document.createElement('canvas');sample.width=32;sample.height=32;
 const ctx=sample.getContext('2d');ctx.drawImage(canvas,0,0,32,32);
 const pixels=ctx.getImageData(0,0,32,32).data;
 let visible=0;for(let n=0;n<pixels.length;n+=4)if(pixels[n]+pixels[n+1]+pixels[n+2]>70&&pixels[n+3]>0)visible++;
 return visible>20;
}
try {
 const context=await browser.newContext({reducedMotion:'no-preference'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const file of ['index.html','south.html']) {
  // Delay every image tile: the overview must stay visible until a real tiled image is painted.
  let release;const gate=new Promise(resolve=>release=resolve);
  await page.route('**/*_files/**',async route=>{await gate;await route.continue();});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`http://127.0.0.1:8766/${file}#wide`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof ready!=='undefined'&&ready);
  const poster=page.locator('#overview');
  await poster.locator('img').or(poster.filter({hasNot:page.locator('img')})).first().evaluate(e=>e instanceof HTMLImageElement?e.decode():Promise.resolve());
  assert.ok(await poster.isVisible(),'Preview survives while tiles are delayed');
  release();
  await page.waitForFunction(paintedImage);
  await page.waitForFunction(()=>!document.querySelector('#overview'));
  for(const width of [1440,320]) {
   await page.setViewportSize({width,height:1000});
   for(let attempt=0;attempt<3;attempt++) {
    await page.goto(`http://127.0.0.1:8766/${file}#wide`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(paintedImage);
    if(file==='index.html')assert.ok(await page.locator('.brand__text').isHidden(),'Northern wide title is hidden');
    assert.equal(await page.locator('#about-open, #about-dialog, #moon-toggle, #moon-reference, #region-links, .brand__text').count(),0,'Image info, Moon comparison, region toolbar buttons and visible titles are removed');
    await page.locator('#viewer').click({position:{x:width/2,y:300}});
    assert.ok(await page.locator('#viewer, #viewer .openseadragon-canvas').evaluateAll(es=>es.every(e=>getComputedStyle(e).outlineStyle==='none')),'Pointer click adds no viewer outline');
   }
   for(const size of ['100%','200%']) {
    await page.evaluate(v=>document.documentElement.style.fontSize=v,size);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${file}: reflow ${width}, ${size}`);
   }
   await page.evaluate(()=>document.documentElement.style.fontSize='');
   assert.equal(await page.locator('#fullscreen svg path').getAttribute('d'),fullscreenPath);
   await page.evaluate(axe);
   const result=await page.evaluate(()=>axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
   reports.push({file,width,...result});
   assert.deepEqual(result.violations.map(v=>v.id),[],`${file}: automated checks`);
   await page.screenshot({path:`${output}/${file}-${width}.png`});
   await page.locator('#viewer').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('+');await page.keyboard.press('h');
  }
  await page.unrouteAll({behavior:'wait'});
  const ids=await page.evaluate(()=>Object.keys(window.EUCLID_DR1_SCENES||window.EUCLID_DR1_SOUTH_SCENES));
  for(const id of ids) {
   await page.goto(`http://127.0.0.1:8766/${file}#${id}`);
   await page.waitForFunction(()=>typeof ready!=='undefined'&&ready);
   await page.waitForFunction(paintedImage);
   assert.equal(await page.locator('#moon-toggle, #moon-reference, #region-links, .brand__text').count(),0,'Removed controls stay absent on detail scenes');
   assert.ok(await page.title(),'Detail scenes retain a browser title');
   assert.equal(await page.locator('.explorer-home-link').getAttribute('href'),'http://127.0.0.1:8767/index.html');
   assert.deepEqual(await page.locator('#home').evaluate(e=>[getComputedStyle(e).backgroundColor,getComputedStyle(e).color]),['rgb(255, 255, 255)','rgb(0, 0, 0)']);
   await page.locator('#zoom-in').click();await page.locator('#zoom-out').click();await page.locator('#home').click();
  }
  if(file==='south.html') {
   await page.emulateMedia({reducedMotion:'reduce'});
   const portals=await page.evaluate(()=>window.EUCLID_DR1_SOUTH_SCENES.wide.portals.map(p=>p.child));
   for(let choice=0;choice<portals.length;choice++) {
    await page.goto('http://127.0.0.1:8766/south.html#wide');
    await page.waitForFunction(()=>typeof ready!=='undefined'&&ready);
    await page.locator('#viewer').focus();await page.keyboard.press('E');
    for(let tab=0;tab<choice;tab++)await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.id),`detail-hotspot-${portals[choice]}`,'E and Tab reach each native region circle');
    await page.keyboard.press('Enter');
    await page.waitForFunction(id=>location.hash==='#'+id&&ready,portals[choice]);
    await page.waitForFunction(paintedImage);
   }
   await page.emulateMedia({reducedMotion:'no-preference'});
  }
 }
 for(const file of ['q2release.html','dr1-data.html']) {
  await page.goto('http://127.0.0.1:8767/'+file);
  assert.equal(await page.locator(file==='q2release.html'?'#fullscreen svg path':'#map-fullscreen svg path').getAttribute('d'),fullscreenPath);
 }
 assert.deepEqual(errors,[]);
 console.log('Both explorers: delayed tiles, repeated untouched loads, no pointer outline, all detail scenes, keyboard/reflow, removed image info and identical fullscreen icons passed.');
}finally {await writeFile(`${output}/report.json`,JSON.stringify({browser:browser.version(),reports,errors},null,2));await browser.close();}
