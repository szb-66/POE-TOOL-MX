// Worker startup is read-only and deliberately separate from live acceptance.
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {SanctumNativeClient} from '../../electron/modules/sanctum/nativeClient.js'
import {createPythonProcess} from '../../electron/modules/python/launcher.js'

const root=fileURLToPath(new URL('../../',import.meta.url))
const option=(name,fallback)=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3) ?? fallback
const mode=option('mode','startup'), runs=Number(option('runs','5'))
const cache=path.join(root,'.cache/sanctum-speed')
fs.mkdirSync(cache,{recursive:true})
const median=values=>{const a=values.toSorted((a,b)=>a-b),i=Math.floor(a.length/2);return a.length ? a.length%2?a[i]:(a[i-1]+a[i])/2:null}
const stats=values=>({median:median(values),p95:values.length?values.toSorted((a,b)=>a-b)[Math.ceil(values.length*.95)-1]:null})
const compare=(before,after)=>({before:stats(before),after:stats(after),reduction:median(before)>0?1-median(after)/median(before):null})
let report
if(mode==='startup') {
  if(!Number.isInteger(runs)||runs<5)throw new Error('启动对照至少五组')
  const snapshot=path.resolve(root,option('baseline','.cache/sanctum-speed/foreground-baseline'))
  const native=fs.readFileSync(path.join(snapshot,'src/assets/scripts/sanctum_native.py'),'utf8')
  const wrapper=path.join(cache,'foreground-baseline-worker.py')
  fs.writeFileSync(path.join(cache,'foreground-native-baseline.json'),JSON.stringify(native))
  fs.writeFileSync(wrapper,`import sys,json\nfrom pathlib import Path\nroot=Path(__file__).resolve().parents[2]\nscripts=root/'src/assets/scripts'\nsys.path.insert(0,str(scripts))\nsource=json.loads(Path(__file__).with_name('foreground-native-baseline.json').read_text(encoding='utf-8'))\nnamespace={'__file__':str(scripts/'sanctum_native.py'),'__name__':'__main__'}\nexec(compile(source,namespace['__file__'],'exec'),namespace)\n`)
  report={kind:'worker-startup-only',liveAcceptance:'not-measured',notes:'固定解释器；不包含依赖探测、游戏激活、日志预检、首次鼠标移动或实际采集。环境命令仅查询前台，不执行输入。',runs:[]}
  const commands=[['capture','environment',{}],['frames','prepareFrames',{width:1920,height:1080}],['ocr','prepareOcr',{threads:2}],['icons','prepareIcons',{}]]
  for(let pair=0;pair<runs;pair++)for(const version of pair%2?['current','baseline']:['baseline','current']) {
    const timings={}
    // Measure each role alone to avoid measuring one role's contention with another.
    for(const [role,command,input] of commands) {
      const client=new SanctumNativeClient({resolveRuntime:async()=>({path:path.join(root,'.runtime/python-runtime/python.exe')}),
        launch:options=>createPythonProcess({...options,...(version==='baseline'?{scriptPath:wrapper}:{})})})
      const started=performance.now()
      try {await client.request(command,input)}
      catch(error){if(command!=='environment'||!['游戏不在前台'].includes(error.message))throw error}
      finally {timings[role]=performance.now()-started;await client.shutdown()}
    }
    report.runs.push({pair,version,timings});console.log(JSON.stringify({pair,version,timings}))
  }
  report.summary=Object.fromEntries(commands.map(([role])=>[role,compare(...['baseline','current'].map(version=>report.runs.filter(row=>row.version===version).map(row=>row.timings[role])))]))
} else if(mode==='live') {
  const rows=JSON.parse(fs.readFileSync(path.resolve(root,option('input','')), 'utf8'))
  if(!Array.isArray(rows))throw new Error('输入须为实机采集记录数组')
  report={kind:'live-foreground-acceptance',scenarios:[],accepted:true}
  for(const scenario of ['cold','continuous','rewards','effects']) {
    const selected=rows.filter(row=>row.scenario===scenario)
    const before=selected.filter(row=>row.version==='baseline'),after=selected.filter(row=>row.version==='current')
    const valid=row=>row.live===true&&row.loadComparable===true&&typeof row.environment?.machine==='string'
      &&typeof row.environment?.scene==='string'&&[row.environment?.width,row.environment?.height,row.environment?.dpi].every(value=>Number.isFinite(value)&&value>0)
      &&(scenario!=='cold'||row.appCold===true)&&row.accuracy===1&&Number.isInteger(row.failures)&&row.failures===0
      &&[row.metrics?.clickToFirstMoveMs,row.metrics?.effectsCaptureMs,row.metrics?.effectsTotalMs,row.metrics?.roundTripMs,row.metrics?.mouseOwnedMs].every(v=>Number.isFinite(v)&&v>=0)
      &&row.metrics?.moves?.filter(move=>!move.targetId?.startsWith('effect:')&&move.intervalMs!==null).some(move=>Number.isFinite(move.intervalMs)&&move.intervalMs>0)
    const pairs=new Map()
    for(const row of selected){const pair=pairs.get(row.pair)||[];pair.push(row.version);pairs.set(row.pair,pair)}
    const ready=before.length>=5&&after.length===before.length&&selected.every(valid)
      &&pairs.size===before.length&&[...pairs.values()].every(pair=>pair.length===2&&new Set(pair).size===2)
      &&selected.every((row,i)=>i%2!==1||row.pair===selected[i-1].pair&&row.version!==selected[i-1].version
        &&['machine','scene','width','height','dpi'].every(key=>row.environment[key]===selected[i-1].environment[key]))
    const fields={startup:r=>r.metrics.clickToFirstMoveMs,roomInterval:r=>median(r.metrics.moves.filter(m=>!m.targetId?.startsWith('effect:')&&Number.isFinite(m.intervalMs)).map(m=>m.intervalMs)),
      effectsCapture:r=>r.metrics.effectsCaptureMs,effectsTotal:r=>r.metrics.effectsTotalMs,roundTrip:r=>r.metrics.roundTripMs,mouseOwned:r=>r.metrics.mouseOwnedMs}
    const timings=ready?Object.fromEntries(Object.entries(fields).map(([key,get])=>[key,compare(before.map(get),after.map(get))])):{}
    const accepted=ready&&['startup','roomInterval','effectsCapture','effectsTotal'].every(key=>timings[key].reduction>=.5)
      &&timings.roundTrip.after.median<=timings.roundTrip.before.median
    report.scenarios.push({scenario,ready,accepted,before:before.length,after:after.length,timings,
      accuracy:{before:stats(before.map(r=>r.accuracy).filter(Number.isFinite)),after:stats(after.map(r=>r.accuracy).filter(Number.isFinite))},
      failures:{before:before.reduce((sum,r)=>sum+(r.failures||0),0),after:after.reduce((sum,r)=>sum+(r.failures||0),0)}})
    report.accepted&&=accepted
  }
  if(!report.accepted)process.exitCode=1
} else throw new Error('mode 必须为 startup 或 live')
fs.writeFileSync(path.resolve(root,option('output','.cache/sanctum-speed/foreground-report.json')),JSON.stringify(report,null,2))
console.log(JSON.stringify(report.summary || {accepted:report.accepted,scenarios:report.scenarios}))
