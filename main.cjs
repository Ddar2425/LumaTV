const {app,BrowserWindow,WebContentsView,ipcMain,shell,dialog}=require('electron');
const fs=require('node:fs'); const path=require('node:path');
const {pathToFileURL}=require('node:url');
let win,service; const testing=process.argv.includes('--test');
const defaults=()=>({theme:'aurora',name:'Your space',apps:[{id:'youtube',name:'YouTube',url:'https://www.youtube.com',color:'#d94343',glyph:'▶'},{id:'netflix',name:'Netflix',url:'https://www.netflix.com',color:'#b51c30',glyph:'N'},{id:'prime',name:'Prime Video',url:'https://www.primevideo.com',color:'#177db1',glyph:'prime'},{id:'disney',name:'Disney+',url:'https://www.disneyplus.com',color:'#344cb0',glyph:'D+'},{id:'spotify',name:'Spotify',url:'https://open.spotify.com',color:'#268750',glyph:'≋'}],library:[]});
const dataPath=()=>path.join(app.getPath('userData'),testing?'test-settings.json':'settings.json');
function read(){try{return {...defaults(),...JSON.parse(fs.readFileSync(dataPath(),'utf8'))};}catch{return defaults();}}
function save(data){fs.mkdirSync(path.dirname(dataPath()),{recursive:true});fs.writeFileSync(dataPath(),JSON.stringify(data,null,2));return data;}
function webURL(value){const u=new URL(value);if(!['https:','http:'].includes(u.protocol))throw Error('Use an http or https website address.');return u.href;}
function serviceStatus(info){if(win&&!win.isDestroyed())win.webContents.send('service-status',info);}
function fitService(){if(service){const [width,height]=win.getContentSize();service.setBounds({x:0,y:92,width,height:Math.max(0,height-92)});}}
function closeService(){if(service){const old=service;service=null;win.contentView.removeChildView(old);old.webContents.close();}serviceStatus({open:false});win.webContents.focus();}
function openService(item){
 if(service)closeService();
 const local=!!item.path;
 service=new WebContentsView({webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,partition:`persist:${testing?'test-':''}luma-${local?'media':String(item.id).replace(/[^a-z0-9-]/gi,'')}`}});
 const current=service,wc=current.webContents;
 const status=(message)=>{if(service===current)serviceStatus({open:true,name:item.name,message});};
 wc.session.setPermissionRequestHandler((_wc,permission,callback)=>callback(permission==='fullscreen'));
 wc.session.setPermissionCheckHandler((_wc,permission)=>permission==='fullscreen');
 wc.session.on('will-download',e=>e.preventDefault());
 wc.setWindowOpenHandler(()=>{status('This service requested a separate window. Pop-up sign-in may not be supported.');return {action:'deny'};});
 const restrict=(e,url)=>{try{if(local)throw Error();webURL(url);}catch{e.preventDefault();status('This link cannot open inside Luma.');}};
 wc.on('will-navigate',restrict);wc.on('will-redirect',restrict);
 wc.on('did-start-loading',()=>status('Loading…'));
 wc.on('did-stop-loading',()=>{if(!wc.isDestroyed())status(local?'Local player':new URL(wc.getURL()||item.url).hostname);});
 wc.on('did-fail-load',(_e,code,description,_url,isMainFrame)=>{if(isMainFrame&&code!==-3)status(`Unable to load: ${description}. Try Reload or return Home.`);});
 wc.on('before-input-event',(event,input)=>{if(input.type!=='keyDown')return;if(input.key==='F11'){event.preventDefault();win.setFullScreen(!win.isFullScreen());}if(input.key==='Escape'||(input.alt&&input.key==='Home')){event.preventDefault();closeService();}});
 win.contentView.addChildView(current);fitService();status(local?'Local player':'Loading…');
 const loading=local?wc.loadFile('media.html',{query:{source:pathToFileURL(item.path).href,title:item.name}}):wc.loadURL(webURL(item.url));
 loading.catch(()=>status('Unable to open. Check your connection or file and try Reload.'));
 wc.focus();return {embedded:true,id:item.id};
}
app.whenReady().then(()=>{
 win=new BrowserWindow({width:1440,height:900,minWidth:960,minHeight:650,fullscreen:!testing,backgroundColor:'#0c121c',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());
 win.on('resize',fitService);win.on('closed',()=>{if(service){service.webContents.close();service=null;}});
 // Remote services never receive the launcher bridge; reject any foreign sender too.
 const register=ipcMain.handle.bind(ipcMain);ipcMain.handle=(channel,handler)=>register(channel,(event,...args)=>{if(event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Untrusted sender');return handler(event,...args);});
 const updates=require('./updates.cjs').setupUpdates({app,testing,notify:info=>{if(!win.isDestroyed())win.webContents.send('update-status',info);}});
 ipcMain.handle('updates',(_,action,value)=>updates.action(action,value));
 win.webContents.once('did-finish-load',()=>updates.start());
 ipcMain.handle('state',()=>({...read(),startup:fs.existsSync(startupPath())}));
 ipcMain.handle('setting',(_,key,value)=>{if(!['theme','name'].includes(key))throw Error('Unknown setting');if(key==='theme'&&!['aurora','ember','midnight'].includes(value))throw Error('Unknown theme');const s=read();s[key]=String(value).slice(0,60);return save(s);});
 ipcMain.handle('add-web',(_,name,url)=>{const s=read();s.apps.push({id:crypto.randomUUID(),name:String(name).trim().slice(0,32)||'Website',url:webURL(url),color:'#466684',glyph:'↗'});return save(s);});
 ipcMain.handle('pick',async(_,type)=>{if(!['app','media'].includes(type))throw Error('Unknown type');const result=await dialog.showOpenDialog(win,{properties:['openFile','multiSelections'],filters:type==='app'?[{name:'Windows applications',extensions:['exe','lnk']}]:[{name:'Media',extensions:['mp4','mkv','webm','mov','mp3','flac','wav','m4v','avi']}]});if(result.canceled)return read();const s=read();for(const file of result.filePaths){const item={id:crypto.randomUUID(),name:path.basename(file,path.extname(file)),path:file,color:'#536b83',glyph:type==='app'?'▣':'▶'};(type==='app'?s.apps:s.library).push(item);}return save(s);});
 ipcMain.handle('remove',(_,id)=>{const s=read();s.apps=s.apps.filter(x=>x.id!==id);s.library=s.library.filter(x=>x.id!==id);return save(s);});
 ipcMain.handle('launch',async(_,id)=>{const s=read();const item=[...s.apps,...s.library].find(x=>x.id===id);if(!item)throw Error('Shortcut not found');if(item.url||s.library.some(x=>x.id===id))return openService(item);if(testing)return {test:true,id};const error=await shell.openPath(item.path);if(error)throw Error(error);return {ok:true};});
 ipcMain.handle('service',(_,action)=>{if(action==='home'){closeService();return;}if(!service)return;if(action==='reload')service.webContents.reload();if(action==='back'&&service.webContents.navigationHistory.canGoBack())service.webContents.navigationHistory.goBack();if(action==='focus')service.webContents.focus();});
 ipcMain.handle('window',(_,action)=>{if(action==='fullscreen')win.setFullScreen(!win.isFullScreen());if(action==='minimize')win.minimize();if(action==='quit')app.quit();});
 ipcMain.handle('startup',(_,enabled)=>{if(testing)return false;const file=startupPath();if(enabled){const exe=process.execPath.replaceAll('"','');const dir=__dirname.replaceAll('"','');const command=app.isPackaged?`""${exe}""`:`""${exe}"" ""${dir}""`;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,`Set sh = CreateObject("WScript.Shell")\r\nsh.Run "${command}", 0, False\r\n`);}else if(fs.existsSync(file))fs.unlinkSync(file);return enabled;});
 win.loadFile('index.html');
});
function startupPath(){return path.join(app.getPath('appData'),'Microsoft','Windows','Start Menu','Programs','Startup','LumaTV.vbs');}
app.on('window-all-closed',()=>app.quit());
