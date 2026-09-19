const {app,BrowserWindow,dialog}=require('electron');
const path=require('path');
const fs=require('fs');
const {createServer}=require('../backend/server.cjs');
let win,server;
async function start(){
  const dataDir=path.join(app.getPath('userData'),'data');
  const seed=path.join(__dirname,'..','backend','data','db.json');
  if(!fs.existsSync(dataDir)){fs.mkdirSync(dataDir,{recursive:true});if(fs.existsSync(seed))fs.copyFileSync(seed,path.join(dataDir,'db.json'));}
  server=createServer(dataDir); const listener=await new Promise(resolve=>{const s=server.listen(0,'127.0.0.1',()=>resolve(s));});
  const port=listener.address().port;
  win=new BrowserWindow({width:1440,height:900,minWidth:1100,minHeight:700,backgroundColor:'#080d1a',autoHideMenuBar:true,webPreferences:{contextIsolation:true,nodeIntegration:false}});
  fs.writeFileSync(path.join(__dirname,'..','dist','runtime-config.js'), `window.__CARRER_X_API__='http://127.0.0.1:${port}';`);
  win.loadFile(path.join(__dirname,'..','dist','index.html'));
  win.on('closed',()=>{try{listener.close()}catch{};win=null});
}
app.whenReady().then(start).catch(e=>dialog.showErrorBox('CARRER-X failed to start',e.stack||String(e)));
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
