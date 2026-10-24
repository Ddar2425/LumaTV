const fs=require('node:fs');const path=require('node:path');
function githubSource(value){const u=new URL(value);const parts=u.pathname.replace(/\/+$/,'').split('/').filter(Boolean);if(u.protocol!=='https:'||u.hostname!=='github.com'||u.username||u.password||u.search||u.hash||parts.length!==2||!parts.every(p=>/^[a-z\d_.-]+$/i.test(p)))throw Error('Enter a GitHub repository URL, such as https://github.com/owner/LumaTV');return {provider:'github',owner:parts[0],repo:parts[1],private:false};}
function setupUpdates({app,testing,notify}){
 const {autoUpdater}=require('electron-updater');
 const prefsFile=path.join(app.getPath('userData'),testing?'test-updates.json':'updates.json');
 const bundled=JSON.parse(fs.readFileSync(path.join(__dirname,'update-source.json'),'utf8'));
 let prefs={source:bundled.repository,autoCheck:true};try{prefs={...prefs,...JSON.parse(fs.readFileSync(prefsFile,'utf8'))};}catch{}
 let status={phase:'idle',currentVersion:app.getVersion(),latestVersion:null,progress:0,message:'Check for the latest Luma TV release.',source:prefs.source,autoCheck:prefs.autoCheck},busy=false;
 const snapshot=()=>({...status});const update=patch=>{status={...status,...patch};notify(snapshot());return snapshot();};
 const persist=()=>{fs.mkdirSync(path.dirname(prefsFile),{recursive:true});fs.writeFileSync(prefsFile,JSON.stringify(prefs,null,2));};
 autoUpdater.autoDownload=false;autoUpdater.autoInstallOnAppQuit=false;autoUpdater.allowDowngrade=false;autoUpdater.allowPrerelease=false;autoUpdater.forceDevUpdateConfig=testing;
 autoUpdater.disableDifferentialDownload=true;
 if(testing){fs.mkdirSync(app.getPath('userData'),{recursive:true});const testConfig=path.join(app.getPath('userData'),'test-update-config.yml');fs.writeFileSync(testConfig,'updaterCacheDirName: luma-tv-update-tests\n');autoUpdater.updateConfigPath=testConfig;}
 function feed(){if(testing&&process.env.LUMA_UPDATE_FEED){const u=new URL(process.env.LUMA_UPDATE_FEED);if(u.hostname!=='127.0.0.1')throw Error('Tests require a loopback feed');return {provider:'generic',url:u.href};}return githubSource(prefs.source);}
 autoUpdater.on('checking-for-update',()=>update({phase:'checking',message:'Checking GitHub Releases…'}));
 autoUpdater.on('update-available',info=>update({phase:'available',latestVersion:info.version,message:`Luma TV ${info.version} is available.`}));
 autoUpdater.on('update-not-available',()=>update({phase:'current',latestVersion:null,message:'You have the latest published version.'}));
 autoUpdater.on('download-progress',info=>update({phase:'downloading',progress:Math.round(info.percent),message:`Downloading update · ${Math.round(info.percent)}%`}));
 autoUpdater.on('update-downloaded',info=>update({phase:'ready',latestVersion:info.version,progress:100,message:'Update downloaded and verified. Ready to install.'}));
 autoUpdater.on('error',error=>update({phase:'error',message:/404|no published|cannot find latest/i.test(error.message)?'No release is available at this repository yet. Check the connection or try again later.':'Could not complete the update. Check your connection and try again.',progress:0}));
 async function action(name,value){
  if(name==='status')return snapshot();
  if(busy)return snapshot();
  if(name==='auto'){prefs.autoCheck=!!value;persist();return update({autoCheck:prefs.autoCheck});}
  if(name==='source'){githubSource(value);prefs.source=value.replace(/\/+$/,'');persist();return update({source:prefs.source,phase:'idle',latestVersion:null,progress:0,message:'Release repository connected. Check for updates.'});}
  if(name==='install'){if(status.phase!=='ready')throw Error('Download and verify an update first.');if(testing)return {test:true,phase:'ready'};update({phase:'installing',message:'Closing Luma to install the update…'});setImmediate(()=>autoUpdater.quitAndInstall(false,true));return snapshot();}
  if(!['check','download'].includes(name))throw Error('Unknown update action');
  if(name==='download'&&status.phase!=='available')throw Error('Check for an available update first.');
  if(!app.isPackaged&&!testing)return update({phase:'error',message:'Install Luma TV to use in-app updates.'});
  busy=true;
  try{if(name==='check'){if(status.phase==='ready')return snapshot();autoUpdater.setFeedURL(feed());await autoUpdater.checkForUpdates();}else{update({phase:'downloading',progress:0,message:'Starting download…'});await autoUpdater.downloadUpdate();}}catch(error){update({phase:'error',progress:0,message:/404|no published|cannot find latest/i.test(error.message)?'No release is available at this repository yet. Check the repository or try again later.':/sha512|checksum|digest/i.test(error.message)?'The update failed its integrity check. Nothing was installed. Please check again.':'Update failed. Check your connection and try again.'});}finally{busy=false;}return snapshot();
 }
 return {action,start:()=>{if(!testing&&prefs.autoCheck)setTimeout(()=>action('check'),5000);}};
}
module.exports={setupUpdates,githubSource};
