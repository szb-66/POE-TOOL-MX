// Offline frozen-crop replay through the production driver and real workers.
// No game input. Null capture fields deliberately prevent a live-speed claim.
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {execFileSync} from 'node:child_process'
import {SanctumLiveDriver} from '../../electron/modules/sanctum/liveDriver.js'
import {SanctumNativeClient} from '../../electron/modules/sanctum/nativeClient.js'
import {createPythonProcess} from '../../electron/modules/python/launcher.js'

const root=fileURLToPath(new URL('../../',import.meta.url))
const args=process.argv.slice(2)
const option=(name,fallback)=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3) ?? fallback
const runs=Number(option('runs','5')), mode=option('mode','compare'), ref=option('baseline-ref','HEAD')
if(!Number.isInteger(runs)||runs<1||runs>20||!['compare','matrix','current'].includes(mode))throw new Error('参数无效')
const catalog=JSON.parse(fs.readFileSync(path.join(root,'electron/assets/sanctum/catalog.json')))
const cache=path.join(root,'.cache/sanctum-speed');fs.mkdirSync(cache,{recursive:true})
const python=path.join(root,'.runtime/python-runtime/python.exe')
const oldSource=relative=>execFileSync('git',['show',`${ref}:${relative}`],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024})
const moduleUrl=(source,relative,overrides={})=>{
  const base=pathToFileURL(path.join(root,relative))
  source=source.replace(/(from\s+['"])(\.[^'"]+)(['"])/g,(_,a,p,b)=>a+(overrides[p]||new URL(p,base).href)+b)
  return 'data:text/javascript;base64,'+Buffer.from(source).toString('base64')
}
let Baseline, wrapper
if(mode==='compare'){
  const textUrl=moduleUrl(oldSource('electron/modules/sanctum/textRecognition.js'),'electron/modules/sanctum/textRecognition.js')
  Baseline=(await import(moduleUrl(oldSource('electron/modules/sanctum/liveDriver.js'),'electron/modules/sanctum/liveDriver.js',{'./textRecognition.js':textUrl}))).SanctumLiveDriver
  const sources=Object.fromEntries(['sanctum_rewards','sanctum_ocr','sanctum_native'].map(name=>[name,oldSource(`src/assets/scripts/${name}.py`)]))
  fs.writeFileSync(path.join(cache,'baseline-sources.json'),JSON.stringify(sources))
  wrapper=path.join(cache,'baseline-worker.py')
  fs.writeFileSync(wrapper,`import sys,json,types\nfrom pathlib import Path\nroot=Path(__file__).resolve().parents[2]\nscripts=root/'src/assets/scripts'\nsys.path.insert(0,str(scripts))\nsources=json.loads(Path(__file__).with_name('baseline-sources.json').read_text(encoding='utf-8'))\nfor name,source in sources.items():\n module=types.ModuleType(name);module.__file__=str(scripts/(name+'.py'));sys.modules[name]=module\n exec(compile(source,module.__file__,'exec'),module.__dict__)\nsys.modules['sanctum_native'].main()\n`)
}
const samples=(option('scenario','rooms')==='rewards'?['reward','reward','reward','reward']:['reward','purse','pact','fountain']).map((name,index)=>{
  const bytes=fs.readFileSync(path.join(root,`test/fixtures/sanctum/ocr-${name}.png`))
  return {id:String(index),name,png:bytes.toString('base64'),region:{x:0,y:0,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)},status:'located'}
})
async function replay(config,repeat){
  const Driver=config.baseline?Baseline:SanctumLiveDriver, started=performance.now(), clients=[]
  const driver=new Driver({catalog,recognitionWorkers:config.workers,ocrThreads:config.threads,
    makeClient:options=>{
      const client=new SanctumNativeClient({...options,resolveRuntime:async()=>({path:python}),
        launch:config.baseline ? options=>createPythonProcess({...options,scriptPath:wrapper}) : createPythonProcess})
      clients.push(client);return client
    }})
  const signal=new AbortController().signal
  driver.assertLog=()=>({floorId:'floor:0'});driver.profile={};driver.runId='replay'
  driver.client={sessionId:`replay-${repeat}`,request:async(command,input)=>samples.find(s=>s.id===input.roomId),shutdown:async()=>{}}
  const rows=[]
  try{
    await driver.prepareOcr(signal)
    const initMs=performance.now()-started, jobs=[]
    for(const sample of samples)jobs.push(await driver.captureRoom(sample,{signal,guard:()=>{}}))
    const texts=await Promise.all(jobs.map(job=>job.recognition))
    for(let i=0;i<jobs.length;i++){
      const result=await jobs[i].supplement()||texts[i]
      rows.push({name:samples[i].name,metrics:result.patch.captureMetrics,status:result.patch.detailsStatus,
        facts:{rawText:result.patch.rawText,type:result.patch.type,rewards:result.patch.rewards,afflictions:result.patch.afflictions}})
    }
    const cleanup=performance.now();await driver.close()
    return {...config,repeat,initMs,cleanupMs:performance.now()-cleanup,totalMs:performance.now()-started,
      captureMs:null,locateMs:null,liveRoundTripMs:null,failures:rows.filter(r=>r.status!=='matched').length,rows}
  }finally{await driver.close();await Promise.allSettled(clients.map(c=>c.shutdown()))}
}
const configs=mode==='matrix'?[1,2].flatMap(workers=>[1,2,4].map(threads=>({workers,threads})))
  :mode==='compare'?[{baseline:true},{workers:Number(option('workers','2')),threads:Number(option('threads','2'))}]
  :[{workers:Number(option('workers','2')),threads:Number(option('threads','2'))}]
const report={mode:'offline-production-driver',baselineRef:mode==='compare'?execFileSync('git',['rev-parse',ref],{cwd:root,encoding:'utf8'}).trim():null,
  liveAcceptance:'not-measured',scenario:option('scenario','rooms'),runs:[]}
for(let repeat=0;repeat<runs;repeat++)for(const config of repeat%2?[...configs].reverse():configs){
  const row=await replay(config,repeat);report.runs.push(row)
  console.log(JSON.stringify({repeat,...config,totalMs:Math.round(row.totalMs),failures:row.failures}))
  fs.writeFileSync(path.resolve(root,option('output','.cache/sanctum-speed/benchmark.json')),JSON.stringify(report,null,2))
}
const golden=JSON.stringify(report.runs[0].rows.map(r=>r.facts))
report.equalFacts=report.runs.every(r=>JSON.stringify(r.rows.map(x=>x.facts))===golden)
const median=values=>{const sorted=values.toSorted((a,b)=>a-b);const i=Math.floor(sorted.length/2);return sorted.length%2?sorted[i]:(sorted[i-1]+sorted[i])/2}
report.summary=configs.map(config=>{
  const selected=report.runs.filter(r=>r.baseline===config.baseline&&r.workers===config.workers&&r.threads===config.threads)
  const times=selected.map(r=>r.totalMs).sort((a,b)=>a-b)
  return {...config,medianMs:median(times),p95Ms:times[Math.ceil(times.length*.95)-1],failures:selected.reduce((n,r)=>n+r.failures,0)}
})
fs.writeFileSync(path.resolve(root,option('output','.cache/sanctum-speed/benchmark.json')),JSON.stringify(report,null,2))
console.log(JSON.stringify({equalFacts:report.equalFacts,summary:report.summary}))
if(!report.equalFacts || report.runs.some(run=>run.failures))process.exitCode=1
