const assert=require('node:assert/strict');const path=require('node:path');const fs=require('node:fs');const {_electron:electron}=require('playwright');
(async()=>{const fixture=require('node:http').createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Luma test service</title><h1>Running inside Luma</h1><a href="/next">Next</a><button onclick="window.open(\'https://example.com\')">Popup</button>');});await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));const fixtureURL='http://127.0.0.1:'+fixture.address().port;const app=await electron.launch({executablePath:process.env.LUMA_EXE||undefined,args:process.env.LUMA_EXE?['--test']:[__dirname,'--test'],env:{...process.env,ELECTRON_RUN_AS_NODE:undefined}});let config;try{const page=await app.firstWindow();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('.hero');config=path.join(await app.evaluate(({app})=>app.getPath('userData')),'test-settings.json');if(fs.existsSync(config))fs.unlinkSync(config);
 assert.equal(await page.title(),'Luma TV');assert.equal(await page.locator('.tile').count(),6);
 await page.getByRole('button',{name:'Apps',exact:true}).click();await page.getByRole('button',{name:'Add a shortcut',exact:true}).click();await page.locator('#web-name').fill('Test website');await page.locator('#web-url').fill(fixtureURL);await page.getByRole('button',{name:'Add shortcut',exact:true}).click();await page.getByRole('button',{name:'Test website',exact:true}).waitFor();
 const saved=await page.evaluate(()=>window.tv.state());assert(saved.apps.some(a=>a.name==='Test website'));const launch=await page.evaluate(id=>window.tv.launch(id),saved.apps.at(-1).id);assert(launch.embedded);
 await page.locator('#service-bar:not([hidden])').waitFor();assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1);
 await page.waitForTimeout(300);
 const inside=await app.evaluate(({webContents})=>webContents.getAllWebContents().find(w=>w.getURL().startsWith('http://127.0.0.1')).executeJavaScript('({title:document.title,bridge:typeof window.tv,node:typeof require})'));
 assert.equal(inside.title,'Luma test service');assert.equal(inside.bridge,'undefined');assert.equal(inside.node,'undefined');
 assert(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].contentView.children.some(v=>v.webContents&&v.webContents.getURL().startsWith('http://127.0.0.1')&&v.getBounds().height>500)));
 await app.evaluate(({webContents})=>webContents.getAllWebContents().find(w=>w.getURL().startsWith('http://127.0.0.1')).executeJavaScript('document.querySelector("button").click()'));
 await page.waitForTimeout(100);assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1);
 await page.locator('#service-home').click();await page.locator('#service-bar[hidden]').waitFor({state:'attached'});
 assert.equal(await app.evaluate(({webContents})=>webContents.getAllWebContents().filter(w=>w.getURL().startsWith('http://127.0.0.1')).length),0);
 await assert.rejects(()=>page.evaluate(()=>window.tv['add-web']('Bad','javascript:alert(1)')));
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Ember',exact:true}).click();assert.equal(await page.locator('body').getAttribute('data-theme'),'ember');await page.reload();await page.waitForSelector('.hero');assert.equal(await page.locator('body').getAttribute('data-theme'),'ember');
 await page.keyboard.press('ArrowDown');assert(await page.evaluate(()=>document.activeElement.tagName==='BUTTON'));await page.keyboard.press('F11');assert(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isFullScreen()));await page.keyboard.press('F11');
 await page.getByRole('button',{name:'Library',exact:true}).click();await page.getByRole('heading',{name:'A home for your collection'}).waitFor();
 await app.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:['C:\\LumaTest\\sample.mp4']});});
 await page.getByRole('button',{name:'+ Add media files',exact:true}).click();await page.getByRole('button',{name:'sample',exact:true}).waitFor();let imported=await page.evaluate(()=>window.tv.state());assert(imported.library[0].path.endsWith('sample.mp4'));
 await page.getByRole('button',{name:'Remove sample',exact:true}).click();await page.getByRole('heading',{name:'A home for your collection'}).waitFor();
 // Play a real generated PCM audio file in the embedded local player.
 const wav=Buffer.alloc(44+16000);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(16000,40);
 const mediaPath=path.join(require('node:os').tmpdir(),'luma-test-'+process.pid+'.wav');fs.writeFileSync(mediaPath,wav);
 try{
 await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},mediaPath);
 await page.getByRole('button',{name:'+ Add media files',exact:true}).click();const mediaState=await page.evaluate(()=>window.tv.state());assert((await page.evaluate(id=>window.tv.launch(id),mediaState.library[0].id)).embedded);
 await page.waitForTimeout(500);const playable=await app.evaluate(({webContents})=>webContents.getAllWebContents().find(w=>w.getURL().includes('/media.html')).executeJavaScript('({ready:document.querySelector("video").readyState,error:document.querySelector("video").error?.message})'));assert(playable.ready>=2,JSON.stringify(playable));
 await app.evaluate(({webContents})=>{const w=webContents.getAllWebContents().find(w=>w.getURL().includes('/media.html'));w.sendInputEvent({type:'keyDown',keyCode:'Escape'});});await page.locator('#service-bar[hidden]').waitFor({state:'attached'});
 await page.evaluate(id=>window.tv.remove(id),mediaState.library[0].id);await page.getByRole('button',{name:'Library',exact:true}).click();
 }finally{fs.unlinkSync(mediaPath);}
 await app.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>({canceled:true,filePaths:[]});});await page.getByRole('button',{name:'+ Add media files',exact:true}).click();assert.equal((await page.evaluate(()=>window.tv.state())).library.length,0);
 await page.getByRole('button',{name:'Apps',exact:true}).click();await app.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:['C:\\LumaTest\\Game.exe']});});await page.locator('[data-action="pick-app"]').click();await page.getByRole('button',{name:'Game',exact:true}).waitFor();await page.getByRole('button',{name:'Remove Game',exact:true}).click();
 await page.keyboard.press('Escape');await page.waitForSelector('.hero');
 // Feed a standard-mapped virtual gamepad into the real polling loop.
 await page.evaluate(()=>{window.testPad={buttons:Array.from({length:16},()=>({pressed:false})),axes:[0,0]};navigator.getGamepads=()=>[window.testPad];document.querySelector('nav button').focus();window.testPad.buttons[15].pressed=true;});await page.waitForTimeout(100);await page.evaluate(()=>window.testPad.buttons[15].pressed=false);assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Apps');
 await page.evaluate(()=>window.testPad.buttons[0].pressed=true);await page.waitForSelector('.page-intro');await page.evaluate(()=>window.testPad.buttons[0].pressed=false);assert.equal(await page.locator('h1').textContent(),'All your favorites.');
 await page.evaluate(()=>window.testPad.buttons[1].pressed=true);await page.waitForSelector('.hero');await page.evaluate(()=>window.testPad.buttons[1].pressed=false);
 await page.evaluate(async()=>{window.testPad=null;await window.tv.setting('theme','aurora');document.body.dataset.theme='aurora';document.activeElement.blur();});await page.setViewportSize({width:1440,height:900});await page.screenshot({path:path.join(__dirname,'preview.png')});assert.deepEqual(errors,[]);console.log('PASS: home, shortcuts, persistence, URL validation, themes, keyboard, fullscreen, library, virtual gamepad, renderer errors.');
 }finally{await app.close();fixture.close();if(config&&fs.existsSync(config))fs.unlinkSync(config);}})().catch(e=>{console.error(e);process.exitCode=1;});






