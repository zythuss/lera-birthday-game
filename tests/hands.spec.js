import {test,expect} from '@playwright/test';

test('supplied hands animate, recoil, freeze on pause and fit mobile',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
   const original=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
     if(image.src?.endsWith('/hands.png')){
       const {a,b,c,d,e,f}=this.getTransform();
       window.handsPose={a,b,c,d,e,f,loaded:image.naturalWidth,args};
     }
     return original.call(this,image,...args);
   };
 });
 await page.setViewportSize({width:1280,height:800});await page.goto('http://localhost:5173');await page.locator('#play').click();await page.locator('#unlock').click();
 await expect.poll(()=>page.evaluate(()=>window.handsPose?.loaded)).toBe(1448);
 const first=await page.evaluate(()=>window.handsPose);await page.waitForTimeout(250);const idle=await page.evaluate(()=>window.handsPose);expect(idle.e).not.toBe(first.e);
 await page.mouse.move(1100,220);await page.waitForTimeout(250);const aimed=await page.evaluate(()=>window.handsPose);expect(aimed.b).not.toBe(idle.b);
 await page.locator('#arena').click({position:{x:1100,y:220}});const fired=await page.evaluate(()=>window.handsPose);expect(fired.b).not.toBe(aimed.b);
 await page.waitForTimeout(300);await page.screenshot({path:'test-results/hands-desktop.png'});
 await page.locator('#pause').click();await page.waitForTimeout(80);const frozen=await page.evaluate(()=>window.handsPose);await page.waitForTimeout(300);expect(await page.evaluate(()=>window.handsPose)).toEqual(frozen);
 await page.locator('#resume').click();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);await page.screenshot({path:'test-results/hands-mobile.png'});
 expect(await page.evaluate(()=>window.handsPose.args[2])).toBeLessThan(390);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
