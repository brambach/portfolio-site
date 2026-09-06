import { afterEach, describe, expect, it, vi } from 'vitest';
import { CarAudio } from './car-audio';

function audioHarness() {
  const tones: {start: ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>}[] = [];
  const started: string[] = [], stopped = vi.fn(), closed = vi.fn();
  const gains: { value: number; setTargetAtTime: ReturnType<typeof vi.fn>; cancelScheduledValues:ReturnType<typeof vi.fn> }[] = [];
  const parameter = () => ({ value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), cancelScheduledValues:vi.fn() });
  const connectable = () => ({ connect: vi.fn(), disconnect: vi.fn() });
  const ctor = vi.fn();
  const decoded=vi.fn();
  const resumed=vi.fn(async()=>{}),suspended=vi.fn(async()=>{});
  class Context {
    currentTime = 0;
    destination = {};
    constructor() { ctor(); }
    createGain() { const gain = parameter(); gains.push(gain); return { ...connectable(), gain }; }
    createDynamicsCompressor() { return { ...connectable(), threshold: parameter(), ratio: parameter(), attack: parameter(), release: parameter() }; }
    createBiquadFilter() { return { ...connectable(), frequency: parameter(), type: '' }; }
    createOscillator(){const tone={...connectable(),frequency:parameter(),type:"",start:vi.fn(),stop:vi.fn()};tones.push(tone);return tone;}
    createBufferSource() {
      return { ...connectable(), buffer: null as unknown as { name: string }, playbackRate: parameter(), loop: false, stop: stopped, start() { started.push(this.buffer.name); } };
    }
    async decodeAudioData(data: string) { decoded(data);return { name: data }; }
    async resume() { await resumed(); }
    async suspend() { await suspended(); }
    async close() { closed(); }
  }
  const fetcher = vi.fn(async (url: string) => ({ ok: true, arrayBuffer: async () => url.split('/').at(-1) }));
  vi.stubGlobal('AudioContext', Context);
  vi.stubGlobal('fetch', fetcher);
  return { tones, started, stopped, closed, gains, ctor, fetcher, decoded, resumed, suspended };
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
  expect(harness.started.filter(name=>name==='911-blip.wav')).toHaveLength(1);
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
