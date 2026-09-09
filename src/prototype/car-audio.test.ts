import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { CarAudio, prepareStablePullLoop } from './car-audio';

function audioHarness(sampleRate=44100) {
  const tones: {start: ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>}[] = [];
  const started: string[] = [], stopped = vi.fn(), closed = vi.fn();
  const gains: { value: number; setTargetAtTime: ReturnType<typeof vi.fn>; cancelScheduledValues:ReturnType<typeof vi.fn> }[] = [];
  const filters: { frequency: ReturnType<typeof parameter>; type: string }[] = [];
  const parameter = () => ({ value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), cancelScheduledValues:vi.fn() });
  const sources: {
    buffer:{name:string};
    playbackRate:ReturnType<typeof parameter>;
    loop:boolean;
    stop:ReturnType<typeof vi.fn>;
    start:()=>void;
  }[] = [];
  const connectable = () => ({ connect: vi.fn(), disconnect: vi.fn() });
  const ctor = vi.fn();
  const decoded=vi.fn();
  const resumed=vi.fn(async()=>{}),suspended=vi.fn(async()=>{});
  class Context {
    currentTime = 0;
    sampleRate = sampleRate;
    destination = {};
    constructor() { ctor(); }
    createGain() { const gain = parameter(); gains.push(gain); return { ...connectable(), gain }; }
    createBuffer(numberOfChannels:number,length:number,rate:number) {
      const channels=Array.from({length:numberOfChannels},()=>new Float32Array(length));
      return {numberOfChannels,length,sampleRate:rate,duration:length/rate,getChannelData:(channel:number)=>channels[channel]};
    }
    createDynamicsCompressor() { return { ...connectable(), threshold: parameter(), ratio: parameter(), attack: parameter(), release: parameter() }; }
    createBiquadFilter() { const filter={ ...connectable(), frequency: parameter(), type: '' };filters.push(filter);return filter; }
    createOscillator(){const tone={...connectable(),frequency:parameter(),type:"",start:vi.fn(),stop:vi.fn()};tones.push(tone);return tone;}
    createBufferSource() {
      const source={ ...connectable(), buffer: null as unknown as { name: string }, playbackRate: parameter(), loop: false, stop: stopped, start() { started.push(this.buffer.name); } };
      sources.push(source);
      return source;
    }
    async decodeAudioData(data: string) { decoded(data);return { name: data }; }
    async resume() { await resumed(); }
    async suspend() { await suspended(); }
    async close() { closed(); }
  }
  const fetcher = vi.fn(async (url: string) => ({ ok: true, arrayBuffer: async () => url.split('/').at(-1) }));
  vi.stubGlobal('AudioContext', Context);
  vi.stubGlobal('fetch', fetcher);
  return { tones, sources, started, stopped, closed, gains, filters, ctor, fetcher, decoded, resumed, suspended };
}

afterEach(() => vi.unstubAllGlobals());

describe('recorded cabin audio', () => {
  it('waits for a gesture and keeps the engine off when entering the cabin', async () => {
    const harness = audioHarness();
    const ready = vi.fn();
    const audio = new CarAudio(vi.fn(), ready);
    audio.setMuted(true);
    audio.update(0, false, 1);
    expect(harness.ctor).not.toHaveBeenCalled();
    expect(harness.fetcher).not.toHaveBeenCalled();
    audio.unlock();
    await vi.waitFor(() => expect(ready).toHaveBeenCalledOnce());
    expect(harness.gains[0].value).toBe(0);
    audio.update(0, false, 1);
    expect(harness.started).not.toContain('911-idle.wav');
    audio.update(0, true, 1);
    expect(harness.started).toContain('911-idle.wav');
    audio.dispose();
    expect(harness.closed).toHaveBeenCalledOnce();
    expect(harness.stopped).toHaveBeenCalledTimes(6);
  });

  it('reports a missing recording while allowing the scene to continue', async () => {
    audioHarness();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    const unavailable = vi.fn();
    const audio = new CarAudio(unavailable);
    audio.unlock();
    await vi.waitFor(() => expect(unavailable).toHaveBeenCalledOnce());
    audio.update(5, true, 1);
    audio.dispose();
  });
});

it('plays the door without waiting for a slow wind download', async () => {
  const harness=audioHarness();
  vi.stubGlobal('fetch',vi.fn(async (url:string) => {
    if(url.endsWith('wind.mp3')) return new Promise(()=>{});
    return {ok:true,arrayBuffer:async()=>url.split('/').at(-1)};
  }));
  const audio=new CarAudio(vi.fn());
  audio.unlock(); audio.door(true);
  await vi.waitFor(()=>expect(harness.started).toContain('door-open.mp3'));
  audio.dispose();
});

it('keeps one instance of each engine bed and ignores overlapping throttle blips', async () => {
  const harness=audioHarness();const ready=vi.fn();
  const audio=new CarAudio(vi.fn(),ready);audio.unlock();
  await vi.waitFor(()=>expect(ready).toHaveBeenCalled());
  for(let i=0;i<120;i++) audio.update(8,true,1,true,false,1/60);
  audio.rev(); audio.rev();
  expect(harness.started.filter(name=>name==='911-idle.wav')).toHaveLength(1);
  expect(harness.started.filter(name=>name==='911-pull.wav')).toHaveLength(1);
  expect(harness.started.filter(name=>name==='911-redline.wav')).toHaveLength(1);
  expect(harness.started.filter(name=>name==='911-blip.wav')).toHaveLength(0);
  audio.dispose();
});

it('loads the forest only for a trail visit and fades it when returning',async()=>{
  const harness=audioHarness(),ready=vi.fn(),audio=new CarAudio(vi.fn(),ready);
  audio.unlock();await vi.waitFor(()=>expect(ready).toHaveBeenCalled());
  expect(harness.fetcher.mock.calls.some(([url])=>url.endsWith('forest.mp3'))).toBe(false);
  audio.forest(true);await vi.waitFor(()=>expect(harness.started).toContain('forest.mp3'));
  audio.forest(true);expect(harness.fetcher.mock.calls.filter(([url])=>url.endsWith('forest.mp3'))).toHaveLength(1);
  audio.forest(false);expect(harness.gains.at(-1)!.setTargetAtTime).toHaveBeenLastCalledWith(0,0,.6);
  audio.dispose();expect(harness.closed).toHaveBeenCalledOnce();
});

it('does not start a late forest load after leaving the scene',async()=>{
  const harness=audioHarness(),ready=vi.fn(),audio=new CarAudio(vi.fn(),ready);
  audio.unlock();await vi.waitFor(()=>expect(ready).toHaveBeenCalled());
  let release:()=>void=()=>{};
  harness.fetcher.mockImplementation(async()=>({ok:true,arrayBuffer:()=>new Promise<string>(resolve=>{release=()=>resolve('forest.mp3');})}));
  audio.forest(true);await vi.waitFor(()=>expect(harness.fetcher).toHaveBeenCalledWith('/audio/forest-drive/forest.mp3',expect.objectContaining({signal:expect.any(AbortSignal)})));
  audio.dispose();release();await new Promise(resolve=>setTimeout(resolve,0));
  expect(harness.started).not.toContain('forest.mp3');
  expect(harness.decoded).not.toHaveBeenCalledWith('forest.mp3');
});

it('cancels pending recording requests without reporting an error after disposal',async()=>{
  const harness=audioHarness(),ready=vi.fn(),unavailable=vi.fn(),signals:AbortSignal[]=[];
  vi.stubGlobal('fetch',vi.fn((_url:string,options:RequestInit)=>new Promise((_resolve,reject)=>{
    const signal=options.signal!;signals.push(signal);
    signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')),{once:true});
  })));
  const audio=new CarAudio(unavailable,ready);audio.unlock();audio.forest(true);
  expect(signals).toHaveLength(11);
  audio.dispose();audio.dispose();
  expect(signals.every(signal=>signal.aborted)).toBe(true);
  await new Promise(resolve=>setTimeout(resolve,0));
  expect(harness.decoded).not.toHaveBeenCalled();expect(harness.started).toEqual([]);
  expect(ready).not.toHaveBeenCalled();expect(unavailable).not.toHaveBeenCalled();
  expect(harness.closed).toHaveBeenCalledOnce();
});

it('does not decode recording bodies that finish after the scene has closed',async()=>{
  const harness=audioHarness(),ready=vi.fn(),unavailable=vi.fn(),release:(()=>void)[]=[];
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:()=>new Promise<ArrayBuffer>(resolve=>{release.push(()=>resolve(new ArrayBuffer(8)));})})));
  const audio=new CarAudio(unavailable,ready);audio.unlock();
  await vi.waitFor(()=>expect(release).toHaveLength(10));
  audio.dispose();for(const finish of release)finish();
  await new Promise(resolve=>setTimeout(resolve,0));
  expect(harness.decoded).not.toHaveBeenCalled();expect(harness.started).toEqual([]);
  expect(ready).not.toHaveBeenCalled();expect(unavailable).not.toHaveBeenCalled();
});

 it('bounds horn blasts, uses the master volume and stops tones on disposal',()=>{
  const harness=audioHarness(),audio=new CarAudio(vi.fn());audio.setMuted(true);
  audio.honk();audio.honk();expect(harness.tones).toHaveLength(2);
  expect(harness.gains[0].value).toBe(0);
  for(const tone of harness.tones){expect(tone.start).toHaveBeenCalledOnce();expect(tone.stop).toHaveBeenCalledWith(.37);}
  audio.dispose();for(const tone of harness.tones)expect(tone.stop).toHaveBeenCalledTimes(2);
  audio.honk();expect(harness.tones).toHaveLength(2);
});


it('preserves mute and volume through suspension without restarting disposed audio',async()=>{
  const harness=audioHarness(),audio=new CarAudio(vi.fn());
  audio.resume();audio.suspend();expect(harness.ctor).not.toHaveBeenCalled();
  audio.setVolume(.18);audio.setMuted(true);audio.unlock();
  audio.suspend();audio.resume();
  expect(harness.suspended).toHaveBeenCalledOnce();
  expect(harness.resumed).toHaveBeenCalledTimes(2);
  expect(audio.muted).toBe(true);expect(audio.volume).toBe(.18);expect(harness.gains[0].value).toBe(0);
  audio.dispose();audio.resume();audio.suspend();
  expect(harness.resumed).toHaveBeenCalledTimes(2);expect(harness.suspended).toHaveBeenCalledOnce();
});

it('reports rejected audio lifecycle operations and ignores failures after disposal',async()=>{
  const harness=audioHarness(),unavailable=vi.fn(),audio=new CarAudio(unavailable);
  audio.unlock();
  harness.resumed.mockRejectedValueOnce(new Error('Resume denied'));
  audio.resume();await vi.waitFor(()=>expect(unavailable).toHaveBeenCalledOnce());
  harness.suspended.mockRejectedValueOnce(new Error('Suspend denied'));
  audio.suspend();await vi.waitFor(()=>expect(unavailable).toHaveBeenCalledTimes(2));
  harness.resumed.mockRejectedValueOnce(new Error('Context closed'));
  audio.resume();audio.dispose();
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  expect(unavailable).toHaveBeenCalledTimes(2);
});

it('lets visitors switch the original radio loop off independently of engine sound',async()=>{
  const harness=audioHarness(),ready=vi.fn(),audio=new CarAudio(vi.fn(),ready);
  audio.setMusic(false);audio.unlock();await vi.waitFor(()=>expect(ready).toHaveBeenCalled());
  audio.update(0,true,1);expect(harness.started).not.toContain('lake-radio.wav');
  expect(harness.started).toContain('911-idle.wav');
  audio.setMusic(true);audio.update(0,true,1);audio.update(0,true,1);
  expect(harness.started.filter(name=>name==='lake-radio.wav')).toHaveLength(1);
  audio.setMusic(false);audio.dispose();
});

it('cancels future phone rings when answered and limits a call to one voice pair',async()=>{
  const harness=audioHarness(),ready=vi.fn(),audio=new CarAudio(vi.fn(),ready);
  audio.ringCall();expect(harness.tones).toHaveLength(0);
  audio.unlock();await vi.waitFor(()=>expect(ready).toHaveBeenCalled());
  audio.ringCall();audio.ringCall();expect(harness.tones).toHaveLength(2);
  const phoneGain=harness.gains.at(-1)!;
  audio.stopCall();
  expect(phoneGain.cancelScheduledValues).toHaveBeenCalledWith(0);
  expect(phoneGain.setTargetAtTime).toHaveBeenLastCalledWith(0,0,.04);
  for(const tone of harness.tones)expect(tone.stop).toHaveBeenCalledWith(9);
  audio.dispose();for(const tone of harness.tones)expect(tone.stop).toHaveBeenCalledTimes(2);
  audio.ringCall();expect(harness.tones).toHaveLength(2);
});


it('restores the engine and radio mix after the phone stops ringing',async()=>{
  const harness=audioHarness(),ready=vi.fn(),audio=new CarAudio(vi.fn(),ready);
  audio.unlock();await vi.waitFor(()=>expect(ready).toHaveBeenCalled());
  audio.update(0,true,1);
  const mix=harness.gains.map(gain=>[gain,gain.setTargetAtTime.mock.lastCall?.[0]] as const)
    .filter((entry):entry is readonly [typeof entry[0],number]=>typeof entry[1]==='number'&&entry[1]>0);
  audio.ringCall();audio.update(0,true,1);
  expect(mix.some(([gain,level])=>gain.setTargetAtTime.mock.lastCall?.[0]<level)).toBe(true);
  audio.stopCall();audio.update(0,true,1);
  for(const [gain,level] of mix)expect(gain.setTargetAtTime.mock.lastCall?.[0]).toBeCloseTo(level);
  audio.dispose();
});

it.each([8000,24000,44100,48000])('keeps filter frequency values inside Nyquist at %s Hz',async(sampleRate)=>{
  const harness=audioHarness(sampleRate),ready=vi.fn(),audio=new CarAudio(vi.fn(),ready);
  audio.unlock();await vi.waitFor(()=>expect(ready).toHaveBeenCalled());
  for(const inside of [0,1]){
    audio.update(18,true,inside,true,false,1/60,{rpm:3600,gear:3,load:.5});
  }
  const nyquist=sampleRate/2;
  const writes=harness.filters.flatMap(filter=>[
    filter.frequency.value,
    ...filter.frequency.setTargetAtTime.mock.calls.map(([value])=>value),
  ]);
  expect(writes.every(value=>Number.isFinite(value)&&value>=0&&value<=nyquist)).toBe(true);
  audio.dispose();
});

it('drives loop playback rates from the shared displayed RPM without an extra long pitch lag',async()=>{
  const harness=audioHarness(),ready=vi.fn(),audio=new CarAudio(vi.fn(),ready);
  audio.unlock();await vi.waitFor(()=>expect(ready).toHaveBeenCalled());
  audio.update(18,true,1,.2,false,1/60,{rpm:2800,gear:4,load:.2});
  const [idle,pull,redline]=['911-idle.wav','911-pull.wav','911-redline.wav'].map(name=>{
    const index=harness.started.indexOf(name);
    expect(index).toBeGreaterThanOrEqual(0);
    return harness.sources[index];
  });
  expect(idle.playbackRate.setTargetAtTime).toHaveBeenLastCalledWith(1.8,0,.035);
  expect(pull.playbackRate.setTargetAtTime).toHaveBeenLastCalledWith(.875,0,.035);
  expect(redline.playbackRate.setTargetAtTime).toHaveBeenLastCalledWith(.875,0,.035);
  audio.update(18,true,1,.2,false,1/60,{rpm:6500,gear:4,load:.8});
  expect(redline.playbackRate.setTargetAtTime).toHaveBeenLastCalledWith(expect.closeTo(6500/3200,5),0,.035);
  audio.dispose();
});

it('keeps shared-state revs on the engine loops instead of starting the prerecorded blip',async()=>{
  const harness=audioHarness(),ready=vi.fn(),audio=new CarAudio(vi.fn(),ready);
  audio.unlock();await vi.waitFor(()=>expect(ready).toHaveBeenCalled());
  audio.update(0,true,1,0,false,1/60,{rpm:920,gear:1,load:.12});
  audio.rev();
  audio.update(0,true,1,0,false,1/60,{rpm:1500,gear:1,load:.25});
  expect(harness.started.filter(name=>name==='911-blip.wav')).toHaveLength(0);
  const idle=harness.sources[harness.started.indexOf('911-idle.wav')];
  expect(idle.playbackRate.setTargetAtTime).toHaveBeenLastCalledWith(expect.closeTo(1500/920,5),0,.035);
  audio.dispose();
});

it('keeps the fallback rev audible through the RPM-driven pull loop',async()=>{
  const harness=audioHarness(),ready=vi.fn(),audio=new CarAudio(vi.fn(),ready);
  audio.unlock();await vi.waitFor(()=>expect(ready).toHaveBeenCalled());
  for(let i=0;i<60;i++)audio.update(0,true,1,false,false,1/60);
  audio.rev();
  const state=audio.update(0,true,1,false,false,.1);
  expect(state.rpm).toBeGreaterThan(1100);
  expect(harness.gains.at(-2)!.setTargetAtTime.mock.lastCall![0]).toBeGreaterThan(0);
  audio.dispose();
});

function wavBuffer(path:string){
  const data=readFileSync(path);
  const channels=data.readUInt16LE(22),rate=data.readUInt32LE(24),bits=data.readUInt16LE(34);
  let offset=12,size=0;
  while(offset<data.length){
    const id=data.toString('ascii',offset,offset+4),chunk=data.readUInt32LE(offset+4);
    if(id==='data'){offset+=8;size=chunk;break;}
    offset+=8+chunk+(chunk%2);
  }
  if(bits!==16||!size)throw new Error('Expected 16-bit PCM WAV.');
  const frames=size/(channels*2);
  const samples=Array.from({length:channels},()=>new Float32Array(frames));
  for(let frame=0;frame<frames;frame++)for(let channel=0;channel<channels;channel++)samples[channel][frame]=data.readInt16LE(offset+(frame*channels+channel)*2)/32768;
  return {numberOfChannels:channels,length:frames,sampleRate:rate,duration:frames/rate,getChannelData:(channel:number)=>samples[channel]};
}

it('keeps every adjacent sample bounded across the circular pull crossfade',()=>{
  const sampleRate=1000,sourceData=Float32Array.from({length:4000},(_,i)=>Math.sin(2*Math.PI*17.3*i/sampleRate));
  const source={sampleRate,length:sourceData.length,numberOfChannels:1,getChannelData:()=>sourceData} as unknown as AudioBuffer;
  const context={createBuffer:(numberOfChannels:number,length:number,rate:number)=>{
    const data=new Float32Array(length);
    return {numberOfChannels,length,sampleRate:rate,duration:length/rate,getChannelData:()=>data} as unknown as AudioBuffer;
  }};
  const data=prepareStablePullLoop(context,source).getChannelData(0);
  const jumps=Array.from(data,(value,i)=>Math.abs(value-data[(i+1)%data.length]));
  expect(Math.max(...jumps)).toBeLessThanOrEqual(.16);
});

it('prepares a stable real 911-pull loop from the 0.3s to 2.3s recording region with circular continuity',()=>{
  const source=wavBuffer('public/audio/forest-drive/911-pull.wav') as AudioBuffer;
  const context={createBuffer:(channels:number,length:number,rate:number)=>{
    const data=Array.from({length:channels},()=>new Float32Array(length));
    return {numberOfChannels:channels,length,sampleRate:rate,duration:length/rate,getChannelData:(channel:number)=>data[channel]};
  }};
  const loop=prepareStablePullLoop(context as Pick<AudioContext,'createBuffer'>,source);
  expect(loop.duration).toBeCloseTo(1.95,2);
  expect(source.duration).toBeGreaterThan(9);
  for(let channel=0;channel<loop.numberOfChannels;channel++){
    const data=loop.getChannelData(channel),edge=256;
    const sourceData=source.getChannelData(channel);
    const join=Math.floor(2.3*source.sampleRate)-Math.floor(.05*source.sampleRate);
    const discontinuity=Math.abs(data[0]-data[data.length-1]);
    let body=0;
    for(let i=edge;i<edge*2;i++)body+=Math.abs(data[i]-data[i+edge]);
    expect(discontinuity).toBeCloseTo(Math.abs(sourceData[join]-sourceData[join-1]),6);
    expect(body/edge).toBeGreaterThan(.01);
  }
});
