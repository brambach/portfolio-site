import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {MathUtils} from 'three';
import {transpileModule} from 'typescript';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {townMaterial} from './town-materials';

const source=readFileSync(resolve(process.cwd(),process.env.ARRIVAL_SOURCE_FIXTURE||'src/prototype/car-scene.ts'),'utf8');
// Execute the production routing statements without creating a WebGL renderer.
const start=source.indexOf('if(scenicMode&&drive.stoppedAt');
const end=source.indexOf('// The finish slip already owns focus',start);
const explicitStart=source.indexOf('lookAtLake: () => {');
const explicitEnd=source.indexOf('look: (x, y) => {',explicitStart);
if(start<0||end<start||explicitStart<0||explicitEnd<explicitStart)throw new Error('Camera routing boundaries were not found');
const parkedBlock=source.slice(start,end);
const explicitBlock=source.slice(explicitStart+'lookAtLake: () => {'.length,explicitEnd).replace(/},\s*$/,'');
function route(block:string,stop:string,reduced:boolean){
  const run=new Function('drive','reducedMotion','THREE',`
    const scenicMode=true,camera={aspect:1.44},scenicLakeFrame={point:{x:10,z:0}};
    let yaw=.25,pitch=.03,targetYaw=.25,targetPitch=.03,renders=0;
    const requestRender=()=>renders++;
    ${transpileModule(block,{compilerOptions:{}}).outputText}
    return {yaw,pitch,targetYaw,targetPitch,renders};
  `);
  return run({stoppedAt:stop,access:{place:{x:10,z:0}},pose:()=>({point:{x:0,z:0},yaw:0})},{matches:reduced},{MathUtils});
}
describe('lake arrival camera routing',()=>{
  for(const reduced of [false,true]){
    it(`preserves the current lake view on automatic arrival, reduced=${reduced}`,()=>{
      expect(route(parkedBlock,'lake',reduced)).toMatchObject({yaw:.25,pitch:.03,targetYaw:.25,targetPitch:.03});
    });
    it(`preserves cafe and tennis arrival affordances, reduced=${reduced}`,()=>{
      for(const stop of ['cafe','tennis']){
        const result=route(parkedBlock,stop,reduced);
        expect(result.targetYaw).toBeCloseTo(Math.PI*.4);
        expect(result.targetPitch).toBe(.1);
        expect(result.yaw).toBe(reduced?result.targetYaw:.25);
      }
    });
  }
  it('explicit lake view requests a turn instead of jumping the current yaw',()=>{
    expect(route(explicitBlock,'lake',false)).toMatchObject({yaw:.25,pitch:.03,targetPitch:.1,renders:1});
    expect(route(explicitBlock,'lake',false).targetYaw).toBeCloseTo(Math.PI/2);
    expect(source).toContain('THREE.MathUtils.damp(yaw, targetYaw, 8, dt)');
  });
});

const openLaptopStart=source.indexOf('function openLaptop() {');
const openLaptopEnd=source.indexOf('function closeLaptop()',openLaptopStart);
const closeLaptopEnd=source.indexOf('function openMap()',openLaptopEnd);
const putAwayThenStart=source.indexOf('function putAwayThen(action: () => void) {');
const putAwayThenEnd=source.indexOf('function rev()',putAwayThenStart);
const laptopStateStart=source.indexOf('function laptopState(phase: LaptopPhase) {');
const laptopStateEnd=source.indexOf('function putDownObject()',laptopStateStart);
const openMapStart=source.indexOf('function openMap() {');
const openMapEnd=source.indexOf('function inspect(item: CabinObject)',openMapStart);
const inspectStart=source.indexOf('function inspect(item: CabinObject) {');
const inspectEnd=source.indexOf('const rendererSize=',inspectStart);
const exitStart=source.indexOf('function exit() {');
const exitEnd=source.indexOf('let ignitionAllowed',exitStart);
const startDriveStart=source.indexOf('async function startDrive() {');
const startDriveEnd=source.indexOf('function pointerDown',startDriveStart);
const laptopTransitionStart=source.indexOf('if (laptopPhase === "opening" || laptopPhase === "closing") {');
const afterPutDownStart=source.indexOf('if (afterPutDown && laptopPhase === "idle"',laptopTransitionStart);
const afterPutDownEnd=source.indexOf('artifacts!.update',afterPutDownStart);
if(
  openLaptopStart<0||
  openLaptopEnd<openLaptopStart||
  closeLaptopEnd<openLaptopEnd||
  putAwayThenStart<0||
  putAwayThenEnd<putAwayThenStart||
  laptopStateStart<0||
  laptopStateEnd<laptopStateStart||
  openMapStart<0||
  openMapEnd<openMapStart||
  inspectStart<0||
  inspectEnd<inspectStart||
  exitStart<0||
  exitEnd<exitStart||
  startDriveStart<0||
  startDriveEnd<startDriveStart||
  laptopTransitionStart<0||
  afterPutDownStart<laptopTransitionStart||
  afterPutDownEnd<afterPutDownStart
)throw new Error('Laptop production boundaries were not found');
const laptopStateBlock=source.slice(laptopStateStart,laptopStateEnd);
const putAwayThenBlock=source.slice(putAwayThenStart,putAwayThenEnd);
const intentStart=source.indexOf('function cancelLaptopIntent() {');
const intentEnd=intentStart<0?-1:source.indexOf('function openLaptop() {',intentStart);
const laptopIntentBlock=intentStart>=0&&intentEnd>intentStart?source.slice(intentStart,intentEnd):'';
const laptopBlock=source.slice(openLaptopStart,closeLaptopEnd);
const openMapBlock=source.slice(openMapStart,openMapEnd);
const inspectBlock=source.slice(inspectStart,inspectEnd);
const exitBlock=source.slice(exitStart,exitEnd);
const startDriveBlock=source.slice(startDriveStart,startDriveEnd);
const startPreparation=startDriveBlock.indexOf('sound.unlock();');
const disposeStart=source.indexOf('function dispose() {');
const disposeEnd=source.indexOf("renderer.domElement.removeEventListener('webglcontextlost'",disposeStart);
if(startPreparation<0||disposeStart<0||disposeEnd<=disposeStart)throw new Error('Lifecycle action boundaries were not found');
const startDrivePrelude=startDriveBlock.slice(startDriveBlock.indexOf('{')+1,startPreparation);
const disposePrelude=source.slice(source.indexOf('{',disposeStart)+1,disposeEnd);
const laptopTransitionBlock=source.slice(laptopTransitionStart,afterPutDownStart);
const afterPutDownBlock=source.slice(afterPutDownStart,afterPutDownEnd);
const goStraightStart=source.indexOf('goStraightTo(id) {');
const goStraightEnd=source.indexOf('     navigate(id) {',goStraightStart);
const navigateStart=source.indexOf('     navigate(id) {');
const navigateEnd=source.indexOf('    openLaptop,',navigateStart);
if(goStraightStart<0||goStraightEnd<goStraightStart||navigateStart<0||navigateEnd<navigateStart)throw new Error('Route action boundaries were not found');
const goStraightBody=source.slice(source.indexOf('{',goStraightStart)+1,goStraightEnd).replace(/},\s*$/,'');
const navigateBody=source.slice(source.indexOf('{',navigateStart)+1,navigateEnd).replace(/},\s*$/,'');

function laptopHarness(state:Partial<{moving:boolean;progress:number;laptopPhase:string;arrivalPause:number;drivePhase:string;racketProgress:number;racketDestination:number;cardProgress:number;cardDestination:number;disposed:boolean}>={}){
  const run=new Function('state',`
    let cardRequested=false;
    let pendingLaptopIntent=false;
    let disposed=state.disposed ?? false;
    let moving=state.moving ?? false;
    let progress=state.progress ?? 1;
    let laptopPhase=state.laptopPhase ?? "idle";
    let arrivalPause=state.arrivalPause ?? 0;
    let queuedAction=null;
    let afterPutDown=null;
    let down={x:1,y:1};
    let targetYaw=.2,targetPitch=.1,yaw=.2,pitch=.1,laptopDestination=0,laptopProgress=0;
    let racketProgress=state.racketProgress ?? 0,racketDestination=state.racketDestination ?? 0;
    let cardProgress=state.cardProgress ?? 0,cardDestination=state.cardDestination ?? 0;
    let cardPrepared=true,cardPreparing=false;
    let renderRequests=0,parks=0,states=[],events=[],focused=0,inspected=[];
    const requestRender=()=>renderRequests++;
    const clearHover=()=>{};
    const putDownObject=()=>{racketDestination=0;cardDestination=0;};
    const host=new EventTarget();
    host.addEventListener("car-laptop",event=>events.push(event.detail));
    host.addEventListener("car-artifact",event=>inspected.push(event.detail));
    const renderer={domElement:{tabIndex:0,focus(){focused++;}},shadowMap:{needsUpdate:false}};
    const screenElement={inert:false};
    const drive={phase:state.drivePhase ?? "parked",stoppedAt:null,requiredApproach:false,requiredStop:null,accessRoads:[{id:"lake"},{id:"cafe"}],park(){parks++;this.phase="parking";},clearInput(){},start(){this.phase="starting";},arriveAtStop(id){this.stoppedAt=id;this.phase="parked";},navigate(){this.phase="driving";},engineOn:false};
    const visit={phase:"idle"};
    const sound={door(){},unlock(){}};
    const race={active:false};
    const journeyMode=true;
    const isTownJourney=()=>false;
    const prepareShadows=()=>Promise.resolve();
    const preparingMotion=false;
    let ignitionAllowed=true;
    const ignitionPlayed=false;
    const last=0;
    let destination=0;
    const reducedMotion={matches:false};
    const dt=.2;
    const THREE={MathUtils:{clamp(value,min,max){return Math.max(min,Math.min(max,value));}}};
    ${transpileModule(laptopStateBlock+putAwayThenBlock+laptopIntentBlock+laptopBlock+openMapBlock+inspectBlock+exitBlock,{compilerOptions:{}}).outputText}
    const flush=()=>{if(typeof openPendingLaptopIntent==="function")openPendingLaptopIntent();};
    const settleLaptop=()=>{${transpileModule(laptopTransitionBlock,{compilerOptions:{}}).outputText}};
    const settleObjects=()=>{racketProgress=racketDestination;cardProgress=cardDestination;${transpileModule(afterPutDownBlock,{compilerOptions:{}}).outputText}};
    const startIntent=()=>{${transpileModule(startDrivePrelude,{compilerOptions:{}}).outputText}};
    const disposeIntent=()=>{${transpileModule(disposePrelude,{compilerOptions:{}}).outputText}};
    const stopDistance=(id)=>id==="lake"?2400:1200;
    const goStraightTo=function(id){${transpileModule(goStraightBody,{compilerOptions:{}}).outputText}};
    const navigate=function(id){${transpileModule(navigateBody,{compilerOptions:{}}).outputText}};
    return {
      openLaptop,
      closeLaptop,
      openMap,
      inspect,
      exit,
      goStraightTo,
      navigate,
      flush,
      settleLaptop,
      settleObjects,
      startIntent,
      disposeIntent,
      setSafe:()=>{arrivalPause=0;laptopPhase="idle";drive.phase="parked";},
      finishClosing:()=>{laptopPhase="idle";},
      snapshot:()=>({disposed,pendingLaptopIntent,moving,progress,laptopPhase,arrivalPause,queuedAction:Boolean(queuedAction),afterPutDown:Boolean(afterPutDown),down,targetYaw,targetPitch,laptopDestination,laptopProgress,racketProgress,racketDestination,cardProgress,cardDestination,renderRequests,parks,events:[...events],focused,inspected:[...inspected]})
    };
  `);
  return run(state);
}

describe('laptop open intent transitions',()=>{
  it('keeps an enabled laptop request through the arrival pause and opens once safe',()=>{
    const harness=laptopHarness({arrivalPause:.32});
    harness.openLaptop();
    expect(harness.snapshot()).toMatchObject({laptopPhase:'idle',events:[]});
    harness.openLaptop();
    harness.flush();
    expect(harness.snapshot()).toMatchObject({laptopPhase:'idle',events:[]});
    harness.setSafe();
    harness.flush();
    expect(harness.snapshot()).toMatchObject({laptopPhase:'opening',events:['opening']});
    harness.openLaptop();
    harness.flush();
    expect(harness.snapshot()).toMatchObject({pendingLaptopIntent:false,laptopPhase:'opening',laptopDestination:1,events:['opening']});
  });

  it('honours rapid close and reopen only after the laptop has finished closing',()=>{
    const harness=laptopHarness({laptopPhase:'reading'});
    harness.closeLaptop();
    harness.openLaptop();
    expect(harness.snapshot()).toMatchObject({laptopPhase:'closing',laptopDestination:0});
    harness.flush();
    expect(harness.snapshot()).toMatchObject({laptopPhase:'closing',events:['closing']});
    harness.finishClosing();
    harness.flush();
    expect(harness.snapshot()).toMatchObject({pendingLaptopIntent:false,laptopPhase:'opening',laptopDestination:1,events:['closing','opening']});
  });

  it('clears a pending laptop request when cancelled before the scene is safe',()=>{
    const harness=laptopHarness({arrivalPause:.2});
    harness.openLaptop();
    harness.closeLaptop();
    expect(harness.snapshot()).toMatchObject({pendingLaptopIntent:false,laptopPhase:'idle'});
  });

  it('does not run stale put-away laptop callbacks after close cancel',()=>{
    const harness=laptopHarness({racketProgress:1,racketDestination:1});
    harness.openLaptop();
    expect(harness.snapshot()).toMatchObject({afterPutDown:true,laptopPhase:'idle'});
    harness.closeLaptop();
    harness.settleObjects();
    expect(harness.snapshot()).toMatchObject({afterPutDown:false,laptopPhase:'idle',events:[]});
  });

  it('preserves competing cabin object priority instead of opening over it',()=>{
    const harness=laptopHarness({racketProgress:1,racketDestination:1});
    harness.openLaptop();
    expect(harness.snapshot()).toMatchObject({afterPutDown:true,laptopPhase:'idle',racketDestination:0});
  });

  it('cancels a pending laptop request when a competing object is inspected',()=>{
    const harness=laptopHarness({arrivalPause:.2});
    harness.openLaptop();
    harness.inspect('card');
    harness.setSafe();
    harness.flush();
    expect(harness.snapshot()).toMatchObject({pendingLaptopIntent:false,laptopPhase:'idle',inspected:['card']});
  });

  it('does not reopen from stale laptop intent after navigation or exit actions',()=>{
    for(const action of ['openMap','exit','goStraightTo','navigate'] as const){
      const harness=laptopHarness({racketProgress:1,racketDestination:1});
      harness.openLaptop();
      harness[action]('lake');
      harness.settleObjects();
      expect(harness.snapshot()).toMatchObject({afterPutDown:false,laptopPhase:'idle'});
    }
  });

  it('cancels pending laptop intent immediately when starting a drive intent',()=>{
    const harness=laptopHarness({arrivalPause:.2});
    harness.openLaptop();
    harness.startIntent();
    harness.setSafe();
    harness.flush();
    expect(harness.snapshot()).toMatchObject({pendingLaptopIntent:false,laptopPhase:'idle'});
  });

  it('does not leave stale laptop intent after disposal or outside movement',()=>{
    const outside=laptopHarness({progress:.56});
    outside.openLaptop();
    outside.setSafe();
    outside.flush();
    expect(outside.snapshot()).toMatchObject({laptopPhase:'idle',events:[]});
    const disposed=laptopHarness({arrivalPause:.2});
    disposed.openLaptop();
    disposed.disposeIntent();
    disposed.setSafe();
    disposed.flush();
    expect(disposed.snapshot()).toMatchObject({disposed:true,pendingLaptopIntent:false,laptopPhase:'idle'});
  });

  it('does not repeatedly park for one pending laptop request',()=>{
    const harness=laptopHarness({drivePhase:'driving'});
    harness.openLaptop();
    harness.flush();
    harness.flush();
    expect(harness.snapshot().parks).toBe(1);
  });
});

describe('selected landscape light and material calibration',()=>{
  it('uses the reviewed restrained landscape exposure and runtime light formula',()=>{
    expect(source).toContain('renderer.toneMappingExposure = landscapeMode ? 1.04 : 1.0;');
    expect(source).toContain('new THREE.HemisphereLight(0xbcc6dc, 0x4a3b2c, .34)');
    expect(source).toContain('sun.intensity = landscapeMode?1.62+warmth*.9:1.1;');
    expect(source).toContain('hemisphere.intensity=.34+warmth*.12;');
  });

  it('uses the selected plaster, glass and neutral canvas material calibration',()=>{
    const fills:string[]=[];
    const getContext=vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation((function(){
      return {
        fillStyle:'',
        strokeStyle:'',
        lineWidth:1,
        fillRect(){fills.push(String(this.fillStyle));},
        strokeRect(){},
        beginPath(){},
        moveTo(){},
        bezierCurveTo(){},
        stroke(){},
      } as unknown as CanvasRenderingContext2D;
    }) as unknown as HTMLCanvasElement['getContext']);
    const plaster=townMaterial('plaster','#ffffff');
    const glass=townMaterial('glass','#ffffff');
    expect(`#${plaster.color.getHexString()}`).toBe('#cdbb9e');
    expect(plaster.roughness).toBe(.92);
    expect(fills[0]).toBe('#efefef');
    expect(`#${glass.color.getHexString()}`).toBe('#1b2a30');
    expect(glass.roughness).toBe(.3);
    plaster.map?.dispose();
    plaster.dispose();
    glass.dispose();
    getContext.mockRestore();
  });
});

afterEach(()=>vi.restoreAllMocks());
