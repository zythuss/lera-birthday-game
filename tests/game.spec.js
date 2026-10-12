import {test,expect} from '@playwright/test';

test('full birthday quest: timer, pause, five dodges and postcard',async({page})=>{
 test.setTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Observe rendered targets and aim at their positions through pointer input.
 await page.addInitScript(()=>{
   const original=CanvasRenderingContext2D.prototype.fillRect;
   CanvasRenderingContext2D.prototype.fillRect=function(...args){
     if(this.canvas.id==='arena'){
       if(this.fillStyle instanceof CanvasGradient)window.drawnTargets=[];
       if(['#ea75a1','#c75479'].includes(this.fillStyle)){
         const {e:x,f:y}=this.getTransform(),ratio= Math.min(devicePixelRatio,2);
         (window.drawnTargets??=[]).push({x:x/ratio,y:y/ratio});
       }
     }
     return original.apply(this,args);
   };
 });
 await page.clock.install();await page.goto('http://localhost:5173');
 await expect(page.locator('#character canvas')).toBeVisible();
 await page.screenshot({path:'test-results/menu-desktop.png',fullPage:true});
 await page.locator('#help').click();await expect(page.locator('#help-dialog')).toBeVisible();await page.locator('.dialog-done').click();
 await page.locator('#play').click();await expect(page.locator('#valentine')).toBeVisible();await page.locator('#unlock').click();
 await page.clock.runFor(1100);await page.locator('#pause').click();const frozen=await page.locator('#time').textContent();await page.clock.runFor(2500);await expect(page.locator('#time')).toHaveText(frozen);await page.locator('#resume').click();
 for(let i=0;i<160;i++){
   await page.clock.runFor(200);
   await page.evaluate(()=>{
     const arena=document.getElementById('arena'),r=arena.getBoundingClientRect();
     for(const t of window.drawnTargets??[]){if(t.y>100&&t.y<r.height-20)arena.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+t.x,clientY:r.top+t.y,bubbles:true}));}
   });
 }
 await expect(page.locator('#loss-dialog')).not.toBeVisible();await expect(page.locator('#boss-health')).toBeVisible();
 let hits=0;
 for(let ticks=0;ticks<300&&hits<5;ticks++){
   await page.clock.runFor(100);
   const msg=await page.locator('#message').textContent();
   if(msg.startsWith('Замах'))await page.locator(msg.includes('слева')?'#right':'#left').click();
   if(msg.startsWith('Сейчас!')){
     const box=await page.locator('#arena').boundingBox();
     // Attack direction determines the persistent camera dodge and boss position.
     const text=await page.locator('#hp').textContent();
     await page.locator('#arena').click({position:{x:box.width*.38,y:box.height*.48}});
     if(await page.locator('#hp').textContent()===text)await page.locator('#arena').click({position:{x:box.width*.62,y:box.height*.48}});
     hits++;
   }
 }
 expect(hits).toBe(5);await page.clock.runFor(1100);await expect(page.locator('#ending')).toBeVisible();await expect(page.locator('#ending img')).toHaveJSProperty('naturalWidth',736);await page.screenshot({path:'test-results/ending.png',fullPage:true});expect(errors).toEqual([]);
});

test('mobile layout and touch controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:5173');await page.screenshot({path:'test-results/menu-mobile.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#play').click();await page.locator('#unlock').click();await expect(page.locator('#arena')).toBeVisible();await page.locator('#arena').click({position:{x:195,y:250}});await page.screenshot({path:'test-results/game-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('escaped target loses, retry resets and menu exits',async({page})=>{
 test.setTimeout(60000);await page.clock.install();await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:5173');await page.locator('#play').click();await page.locator('#unlock').click();
 for(let i=0;i<24;i++){await page.clock.runFor(1000);if(await page.locator('#loss-dialog').isVisible())break;}
 await expect(page.locator('#loss-dialog')).toBeVisible();await expect(page.locator('#loss-score')).toHaveText('Попадания: 0 ♡');
 const time=await page.locator('#time').textContent();await page.clock.runFor(1500);await expect(page.locator('#time')).toHaveText(time);await page.keyboard.press('Escape');await expect(page.locator('#loss-dialog')).toBeVisible();
 await page.screenshot({path:'test-results/loss-mobile.png',fullPage:true});await page.locator('#retry').click();await expect(page.locator('#loss-dialog')).not.toBeVisible();await expect(page.locator('#time')).toHaveText('00:30');await expect(page.locator('#score')).toHaveText('0 ♡');
 await page.clock.runFor(500);await page.screenshot({path:'test-results/weapon-mobile.png',fullPage:true});await page.locator('#pause').click();await page.locator('#pause-dialog .back').click();await expect(page.locator('#menu')).toBeVisible();
});

test('keyboard works after opening the game',async({page})=>{
 await page.goto('http://localhost:5173');await page.locator('#play').click();await page.locator('#unlock').click();
 await page.keyboard.press('Space');await page.keyboard.press('Escape');await expect(page.locator('#pause-dialog')).toBeVisible();
 await page.locator('#resume').click();await page.keyboard.press('Escape');await expect(page.locator('#pause-dialog')).toBeVisible();
});
