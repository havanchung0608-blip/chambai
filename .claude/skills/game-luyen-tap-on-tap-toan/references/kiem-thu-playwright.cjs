// Kiểm thử tự động game: node kiem-thu-playwright.cjs <file.html> [thư-mục-ảnh]
// In ra lỗi JS (ERR) và chụp ảnh các màn hình để xem lại.
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1600,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 p.on('dialog',d=>d.accept());
 await p.goto('file://'+process.argv[2]);
 await p.waitForTimeout(1500);
 await p.screenshot({path:(process.argv[3]||'.')+'/s0.png'});
 await p.click('.mode[data-mode=tile]');
 for(let k=0;k<20;k++){
   const tiles=await p.$$('.tile:not(.open)'); if(!tiles.length)break;
   await tiles[0].click(); await p.waitForSelector('#qmodal:not(.hidden)',{timeout:5000});
   await p.waitForTimeout(300);
   if(k===0) await p.screenshot({path:(process.argv[3]||'.')+'/s1.png'});
   const opt=await p.$('.opt'); const ni=await p.$('#numIn');
   if(opt) await opt.click(); else if(ni){await ni.fill('13'); await p.click('#bCheck');} else {await p.click('#bReveal'); await p.click('#jOk');}
   if(await p.$('#bSol')) { await p.click('#bSol'); }
   if(k===1) await p.screenshot({path:(process.argv[3]||'.')+'/s2.png'});
   const st=await p.$('.chk'); if(st){await st.click(); await p.click('#sOk');}
   await p.click('#bClose'); await p.waitForTimeout(150);
 }
 await p.waitForTimeout(2500); await p.screenshot({path:(process.argv[3]||'.')+'/s3.png'});
 console.log('tile end visible', await p.isVisible('#end'));
 await p.click('#bMenu'); await p.click('.mode[data-mode=race]'); await p.waitForTimeout(300);
 for(let k=0;k<16;k++){
   if(await p.isVisible('#end'))break;
   const bt=await p.$$('.pick .btn:not([disabled])'); if(!bt.length)break;
   await bt[bt.length-1].click();
   await p.click('#bReveal'); const j=await p.$('#jOk'); if(j) await j.click();
   if(k===2) await p.screenshot({path:(process.argv[3]||'.')+'/s4.png'});
   await p.click('#bClose'); await p.waitForTimeout(2400);
   if(k===3) await p.screenshot({path:(process.argv[3]||'.')+'/s4b.png'});
 }
 await p.waitForTimeout(2500);
 console.log('race end', await p.isVisible('#end'));
 await p.click('#bMenu'); await p.click('.mode[data-mode=all]'); await p.waitForTimeout(300);
 await p.screenshot({path:(process.argv[3]||'.')+'/s5.png'});
 await p.click('#bNextQ'); await p.keyboard.press(' ');
 await p.click('.chk[data-i="0"]'); await p.click('.chk[data-i="2"]'); await p.click('#bAward');
 await p.screenshot({path:(process.argv[3]||'.')+'/s6.png'});
 await p.keyboard.press(' '); await p.waitForTimeout(200);
 await p.click('#bNextQ'); await p.keyboard.press('p'); await p.keyboard.press('p');
 await p.waitForTimeout(500);
 console.log('scores', await p.$$eval('.team .pt',e=>e.map(x=>x.textContent)));
 await p.setViewportSize({width:390,height:800}); await p.waitForTimeout(300); await p.screenshot({path:(process.argv[3]||'.')+'/s7.png'});
 console.log('scrollW', await p.evaluate(()=>document.documentElement.scrollWidth));
 console.log('ERR',errs); await b.close();
})();
