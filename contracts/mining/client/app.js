'use strict';
const DB_NAME='vcoin-ton-client', DB_VERSION=1, STORE_NAME='diagnostics';
function openDatabase(){return new Promise((resolve,reject)=>{
 if(!('indexedDB' in window))return reject(new Error('INDEXEDDB_UNAVAILABLE'));
 const request=indexedDB.open(DB_NAME,DB_VERSION);
 request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE_NAME)){const store=db.createObjectStore(STORE_NAME,{keyPath:'id'});store.createIndex('createdAt','createdAt');}};
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('INDEXEDDB_OPEN_FAILED'));
});}
async function readDiagnostics(){const db=await openDatabase();return new Promise((resolve,reject)=>{
 const tx=db.transaction(STORE_NAME,'readonly'),request=tx.objectStore(STORE_NAME).getAll();
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('INDEXEDDB_READ_FAILED'));tx.oncomplete=()=>db.close();
});}
function updateNetwork(){document.querySelector('#network-state').textContent=navigator.onLine?'Online':'Offline';}
async function renderState(){try{const rows=await readDiagnostics();document.querySelector('#queue-count').textContent=String(rows.length);document.querySelector('#app-state').textContent='Local storage ready';}
catch(error){document.querySelector('#app-state').textContent=error.message;}}
async function exportDiagnostics(){const message=document.querySelector('#diagnostics-message');try{
 const rows=await readDiagnostics();const report={app:'V COIN – TON',clientVersion:'offline-shell-v1',online:navigator.onLine,serviceWorkerSupported:'serviceWorker'in navigator,indexedDbAvailable:'indexedDB'in window,queuedDiagnosticEvents:rows.length,exportedAt:new Date().toISOString(),note:'This shell does not collect wallet credentials, tokens, private keys, or mining rewards.'};
 const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vcoin-ton-diagnostics.json';a.click();URL.revokeObjectURL(url);message.textContent='Diagnostics exported locally.';
}catch(error){message.textContent='Diagnostics unavailable: '+error.message;}}
document.querySelector('#export-diagnostics').addEventListener('click',exportDiagnostics);
window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);updateNetwork();renderState();
if('serviceWorker'in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('./service-worker.js').catch(()=>{document.querySelector('#app-state').textContent='Offline cache unavailable';});}
else{document.querySelector('#app-state').textContent='HTTPS required for offline installation';}
