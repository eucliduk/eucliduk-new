import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

export async function checkPeopleGalaxy({browser, base, axe, output}) {
  await mkdir(output,{recursive:true});
  const reports=[];
  for (const theme of ['light','dark']) {
    const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:theme,reducedMotion:'reduce'});
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(new URL('humans.html?contrast=standard',base).href);
    const markers=page.locator('.people-marker');const panel=page.locator('.people-profile-preview');
    assert.equal(await markers.count(),19);
    assert.equal(await page.locator('.people-galaxy-caption, .people-list-toggle, [data-portrait-toggle], .people-name-picker').count(),0);
    assert.equal(await markers.locator('.people-avatar img').count(),19,'Every paired fingerprint has a portrait thumbnail');
    assert.ok(await markers.locator('.people-avatar img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth===192&&image.alt==='')));
    assert.equal(await page.locator('[data-people-galaxy]').getAttribute('data-portraits'),'paused','Reduced motion keeps portraits still');
    assert.equal(await markers.first().evaluate(e=>getComputedStyle(e).animationName),'none','Reduced motion disables portrait floating');
    assert.ok(await markers.locator('.people-avatar').first().evaluate(e=>parseFloat(getComputedStyle(e).transitionDuration)<=.001),'Reduced motion has no perceptible fade (the shared stylesheet uses 0.01ms)');
    assert.ok(await page.locator('.fingerprint-marks > path').evaluateAll(paths=>paths.every(path=>path.getAttribute('d').includes('Q'))),'Traced fingerprint contours use smooth curves');
    assert.equal(await page.locator('.portrait-card').count(),19,'Existing profiles remain available');
    assert.equal(await page.locator('.portrait-card').first().evaluate(e=>getComputedStyle(e).backgroundColor),theme==='dark'?'rgb(0, 0, 0)':'rgb(255, 255, 255)','Profile cards use a neutral surface for their theme');
    assert.ok(await page.locator('.portrait-card :is(.portrait-name, .portrait-tag, .portrait-quote)').evaluateAll((elements,expected)=>elements.every(e=>getComputedStyle(e).color===expected),theme==='dark'?'rgb(255, 255, 255)':'rgb(0, 0, 0)'),'Profile card text contrasts with its neutral surface');
    const colours=await page.evaluate(()=>({
      ink:getComputedStyle(document.body).color,
      marks:getComputedStyle(document.querySelector('.people-galaxy .fingerprint-marks')).fill,
      backdrop:getComputedStyle(document.querySelector('.people-galaxy-stage')).backgroundColor,
      plaque:getComputedStyle(document.querySelector('.people-galaxy .plaque-face')).display
    }));
    assert.equal(colours.marks,colours.ink,`${theme}: artwork follows the page ink colour`);
    assert.equal(colours.backdrop,'rgba(0, 0, 0, 0)','Artwork blends into the page');
    assert.equal(colours.plaque,'none','The plaque box is removed');
    assert.equal(await markers.first().evaluate(e=>getComputedStyle(e,'::after').content),'none','Fingerprints have no decorative circles');
    assert.equal(await page.locator('.people-profile-mark').first().evaluate(e=>getComputedStyle(e).fill),theme==='light'?'rgb(187, 216, 242)':'rgb(228, 210, 242)','Interactive fingerprints use light blue or light purple for the theme');
    const heading=await page.locator('.people-hero').boundingBox();
    const stageBounds=await page.locator('.people-galaxy-stage').boundingBox();
    assert.ok(stageBounds.y<=heading.y+1,'Wide-screen galaxy uses the space beside the header');
    assert.ok(await page.locator('#people-list').isVisible(),'All profiles are always available');
    assert.equal(await page.locator('#people-list > h2').count(),0,'No repeated section heading');
    const filterButtons=page.locator('[data-people-library] [data-resource-filter]');
    assert.deepEqual(await filterButtons.allTextContents(),['All','RAS London 2023','Rome 2024','RAS London 2024','Leiden 2025']);
    for (const [value,count] of [['2023-12',5],['2024-06',5],['2024-12',5],['2025-03',4],['all',19]]) {
      const filter=page.locator(`[data-people-library] [data-resource-filter="${value}"]`);
      await filter.focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('.portrait-card:visible').count(),count);
      assert.equal(await filter.getAttribute('aria-pressed'),'true');
    }

    const artworkLink=page.getByRole('link',{name:'Fingertip Galaxy',exact:true});
    assert.equal(await artworkLink.getAttribute('href'),'https://www.esa.int/media/the-fingertip-galaxy-reflecting-euclid-in-art');
    await artworkLink.focus();
    assert.ok(await artworkLink.evaluate(e=>e===document.activeElement),'Artwork lettering is keyboard accessible');
    assert.equal(await page.locator('.people-artwork-credit a').getAttribute('href'),'https://www.pettibone.co.uk/mssl-space-lab-residency');
    for(let index=0;index<19;index++) {
      await page.keyboard.press('Escape');
      const marker=markers.nth(index);const key=await marker.getAttribute('data-person');
      await marker.evaluate(e=>e.scrollIntoView({block:'center'}));
      await marker.hover();
      assert.ok(await panel.isHidden(), 'Hovering over a face circle does not open a profile');
      await marker.click();
      assert.ok(await panel.isVisible(), 'Selecting a face circle opens its profile');
      const anchor=await marker.boundingBox();const popup=await panel.boundingBox();
      assert.ok(Math.min(Math.abs(popup.x-anchor.x-anchor.width),Math.abs(anchor.x-popup.x-popup.width))<=16,'Desktop popup appears beside its fingerprint');
      const profile=page.locator(`#human-${key}`);
      // Compare the stored name: the list is hidden and CSS uppercases visible headings.
      assert.equal((await panel.locator('h3').textContent()).trim(),(await profile.locator('.portrait-name').textContent()).trim());
      assert.equal(await panel.locator('img').getAttribute('src'),await profile.locator('img').getAttribute('src'));
      assert.equal(await panel.locator('blockquote').innerText(),await profile.locator('.portrait-quote').innerText());
    }
    await panel.hover();await page.waitForTimeout(300);assert.ok(await panel.isVisible(),'Selected profile remains available under the pointer');
    await page.keyboard.press('Escape');assert.ok(await panel.isHidden(),'Escape dismisses selected content');
    await markers.first().focus();assert.ok(await panel.isVisible(),'Keyboard focus opens a profile');
    await page.keyboard.press('Enter');
    assert.ok(await panel.locator('button').evaluate(e=>e===document.activeElement),'Keyboard activation reaches popup controls');
    await page.keyboard.press('Escape');
    assert.ok(await panel.isHidden());assert.ok(await markers.first().evaluate(e=>e===document.activeElement),'Escape returns focus without reopening');
    await markers.nth(5).click();await page.mouse.move(5,5);await page.waitForTimeout(300);
    assert.ok(await panel.isVisible(),'Click pins the profile after the pointer leaves');
    await page.screenshot({path:resolve(output,`profile-${theme}.png`)});
    for(const contrast of ['standard','high']) {
      if(contrast==='high') {
        await page.keyboard.press('Escape');
        await page.getByRole('link',{name:'High contrast version',exact:true}).click();
        await page.waitForURL(u=>u.searchParams.get('contrast')==='high');
        await page.locator('.people-marker').first().focus();
        await page.keyboard.press('Enter');
      }
      await page.evaluate(axe);
      const result=await page.evaluate(()=>window.axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
      reports.push({file:'humans.html',theme,contrast:`${contrast}-fingerprint-popup`,violations:result.violations,incomplete:result.incomplete});
      assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],`${theme}/${contrast} popup accessibility`);
    }
    await page.keyboard.press('Escape');
    await page.locator('.people-marker').nth(2).focus();
    await page.keyboard.press('Enter');
    await panel.locator('a').click();
    assert.ok(await panel.isHidden());
    assert.ok(await page.locator('#people-list').isVisible(),'Profile link reveals the list');
    assert.ok(await page.locator('.portrait-card').nth(2).evaluate(e=>e===document.activeElement),'The team-list link focuses the selected profile');
    assert.deepEqual(errors,[]);
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:320,height:800},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await context.newPage();await page.goto(new URL('humans.html',base).href);
  const panel=page.locator('.people-profile-preview');const marker=page.locator('.people-marker').first();
  const art=await page.locator('.people-galaxy-artwork').boundingBox();
  const stage=await page.locator('.people-galaxy-stage').boundingBox();
  assert.ok(art.height>art.width,'Portrait screens show a vertical galaxy');
  assert.ok(art.width<=stage.width+1&&art.height<=stage.height+1,'Rotated artwork fits its stage');
  assert.ok(art.x>=stage.x-1&&art.x+art.width<=stage.x+stage.width+1,'The whole rotated artwork remains visible');
  await page.screenshot({path:resolve(output,'galaxy-portrait.png'),fullPage:true});
  await marker.tap();assert.ok(await panel.isVisible(),'Touch opens the selected profile');
  await panel.locator('img').evaluate(i=>i.decode());
  await page.screenshot({path:resolve(output,'profile-touch.png')});
  const targets=await page.locator('.people-marker').evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}));
  assert.ok(targets.every(r=>r.width>=24&&r.height>=24),'Map targets meet the 24px minimum');
  assert.ok(targets.every((a,i)=>targets.every((b,j)=>i===j||a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y)),'Touch target rectangles do not overlap');
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await page.addStyleTag({content:'p{line-height:1.5!important;margin-bottom:2em!important}*{letter-spacing:.12em!important;word-spacing:.16em!important;font-family:serif!important}'});
  assert.ok(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Popup text reflows with enlarged text');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'The page has no horizontal overflow');
  await page.emulateMedia({forcedColors:'active'});
  assert.ok(await panel.isVisible());
  await panel.getByRole('button',{name:'Close profile'}).tap();assert.ok(await panel.isHidden());
  await page.setViewportSize({width:800,height:500});
  const landscape=await page.locator('.people-galaxy-artwork').boundingBox();
  assert.ok(landscape.width>landscape.height,'Landscape restores the horizontal artwork');
  await context.close();
  const animatedContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  const animated=await animatedContext.newPage();
  await animated.clock.install();
  await animated.goto(new URL('humans.html',base).href);
  const animatedGalaxy=animated.locator('[data-people-galaxy]');
  await animated.locator('.people-galaxy-stage').scrollIntoViewIfNeeded();
  await animated.clock.runFor(100);
  const featured=()=>animated.locator('.people-marker.is-featured').evaluateAll(elements=>elements.map(e=>e.dataset.person));
  const firstFeatured=await featured();
  assert.equal(firstFeatured.length,3,'Only a few portrait circles appear at once');
  assert.equal(await animatedGalaxy.getAttribute('data-portraits'),'playing');
  const floating=animated.locator('.people-marker.is-featured');
  assert.deepEqual(await floating.evaluateAll(elements=>elements.map(e=>getComputedStyle(e).animationDuration)),['6s','8s','9s']);
  assert.ok(await floating.evaluateAll(elements=>elements.every(e=>getComputedStyle(e).animationName==='people-portrait-float' && getComputedStyle(e).animationPlayState==='running')),'Visible portraits float while playing');
  const floatOffsets=await floating.first().evaluate(element=>{
    const animation=element.getAnimations().find(a=>a.animationName==='people-portrait-float');
    const previous=animation.currentTime;
    animation.currentTime=0;const start=element.getBoundingClientRect().top;
    animation.currentTime=3000;const middle=element.getBoundingClientRect().top;
    animation.currentTime=6000;const end=element.getBoundingClientRect().top;
    animation.currentTime=previous;
    return {distance:middle-start,loop:end-start};
  });
  assert.ok(floatOffsets.distance>6 && floatOffsets.distance<9,'Float stays subtle');
  assert.ok(Math.abs(floatOffsets.loop)<.1,'Float loops without a jump');
  await animated.clock.runFor(5000);
  assert.equal(await animatedGalaxy.getAttribute('data-portraits'),'paused','Decorative introduction finishes within five seconds without a separate control');
  assert.ok(await animated.locator('.people-marker.is-featured').evaluateAll(elements=>elements.every(e=>getComputedStyle(e).animationPlayState==='paused')));
  await animated.clock.runFor(30000);
  assert.deepEqual(await featured(),firstFeatured,'Portraits remain still after the introduction');
  await animated.locator('.people-marker').first().click();
  assert.deepEqual(await featured(),['konstantinos']);
  await animated.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await animatedGalaxy.getAttribute('data-portraits'),'paused');
  await animatedContext.close();
  const noScript=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:800}});
  const fallback=await noScript.newPage();await fallback.goto(new URL('humans.html',base).href);
  assert.equal(await fallback.locator('.portrait-card').count(),19);
  assert.ok(await fallback.locator('.people-markers').isHidden());
  assert.equal(await fallback.locator('.portrait-card img').count(),19);
  assert.ok(await fallback.locator('#people-list').isVisible(),'No-JavaScript visitors retain the list');
  await fallback.setViewportSize({width:1024,height:800});
  const fallbackIntro=await fallback.locator('.people-introduction').boundingBox();
  const fallbackStage=await fallback.locator('.people-galaxy-stage').boundingBox();
  assert.ok(fallbackIntro.y>=fallbackStage.y+fallbackStage.height,'The no-JavaScript introduction stays below the artwork');
  await noScript.close();
  return reports;
}
