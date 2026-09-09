import { EngineSound } from "./engine-sound";

const IDLE_REFERENCE_RPM=920;
const PULL_REFERENCE_RPM=3200;
const REDLINE_REFERENCE_RPM=3200;
const ENGINE_PITCH_SLEW_SECONDS=.035;
const PULL_LOOP_START_SECONDS=.3;
const PULL_LOOP_END_SECONDS=2.3;
const PULL_LOOP_CROSSFADE_SECONDS=.05;

export function prepareStablePullLoop(context:Pick<AudioContext,'createBuffer'>,source:AudioBuffer,startSeconds=PULL_LOOP_START_SECONDS,endSeconds=PULL_LOOP_END_SECONDS,crossfadeSeconds=PULL_LOOP_CROSSFADE_SECONDS){
  if(typeof source.getChannelData!=="function")return source;
  const sampleRate=source.sampleRate;
  const start=Math.max(0,Math.min(source.length-1,Math.floor(startSeconds*sampleRate)));
  const end=Math.max(start+1,Math.min(source.length,Math.floor(endSeconds*sampleRate)));
  const length=end-start;
  const fade=Math.max(0,Math.min(Math.floor(crossfadeSeconds*sampleRate),Math.floor(length/4)));
  const loopLength=length-fade;
  const loop=context.createBuffer(source.numberOfChannels,loopLength,sampleRate);
  for(let channel=0;channel<source.numberOfChannels;channel++){
    const input=source.getChannelData(channel);
    const output=loop.getChannelData(channel);
    for(let i=0;i<loopLength;i++)output[i]=input[start+i];
    // Overlap the tail into the head once. Trimming the overlap keeps both joins on adjacent source samples.
    for(let i=0;i<fade;i++){
      const mix=i/(fade-1||1);
      output[i]=input[end-fade+i]*(1-mix)+input[start+i]*mix;
    }
  }
  return loop;
}

export class CarAudio {
  private callGain: GainNode | null = null;
  private callUntil=0;
  private callDuckingUntil=0;
  stopCall(){this.callDuckingUntil=0;if(this.context&&this.callGain){this.callGain.gain.cancelScheduledValues(this.context.currentTime);this.callGain.gain.setTargetAtTime(0,this.context.currentTime,.04);}}
  ringCall(){
    const context=this.context;
    if(!context||!this.master||this.disposed||context.currentTime<this.callUntil)return;
    const now=context.currentTime,level=context.createGain();this.callGain=level;this.callUntil=now+9;this.callDuckingUntil=now+9;
    level.gain.setValueAtTime(0,now);level.connect(this.master);
    for(const offset of [0,.5,3,3.5,6,6.5]){level.gain.setValueAtTime(0,now+offset);level.gain.linearRampToValueAtTime(.16,now+offset+.012);level.gain.setValueAtTime(.16,now+offset+.3);level.gain.linearRampToValueAtTime(0,now+offset+.34);}
    let remaining=2;
    for(const frequency of [659,880]){const tone=context.createOscillator();tone.type="triangle";tone.frequency.value=frequency;tone.connect(level);this.horns.add(tone);tone.onended=()=>{tone.disconnect();this.horns.delete(tone);if(--remaining===0){level.disconnect();if(this.callGain===level)this.callGain=null;}};tone.start(now);tone.stop(now+9);}
  }
  private radio: AudioBufferSourceNode | null = null;
  private radioGain: GainNode | null = null;
  private radioEnabled=true;
  setMusic(enabled:boolean){this.radioEnabled=enabled;if(!enabled&&this.context)this.radioGain?.gain.setTargetAtTime(0,this.context.currentTime,.3);}
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private engine: AudioBufferSourceNode | null = null;
  private engineGain: GainNode | null = null;
  private pull: AudioBufferSourceNode | null = null;
  private redline: AudioBufferSourceNode | null = null;
  private redlineGain: GainNode | null = null;
  private pullGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineMotion = new EngineSound();
  private revUntil = 0;
  private hornUntil = 0;
  private horns = new Set<OscillatorNode>();
  private cabinFilter: BiquadFilterNode | null = null;
  private roadGain: GainNode | null = null;
  private forestGain: GainNode | null = null;
  private forestWanted=false;
  private forestPending: Promise<void> | null=null;
  private windGain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private pending: Promise<void> | null = null;
  private loading = new Map<string, Promise<void>>();
  private sources = new Set<AudioBufferSourceNode>();
  private disposed = false;
  private downloads = new AbortController();
  volume = 0.32;
  muted = false;
  private running = false;
  constructor(
    private onUnavailable: () => void,
    private onReady: () => void = () => {},
  ) {}
  private safeFilterFrequency(value:number) {
    if(!this.context)return value;
    const finite=Number.isFinite(value)?value:0;
    return Math.min(this.context.sampleRate/2,Math.max(0,finite));
  }
  unlock() {
    if (this.disposed) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -9;
        limiter.ratio.value = 6;
        limiter.attack.value = 0.004;
        limiter.release.value = 0.2;
        this.master.connect(limiter);
        limiter.connect(this.context.destination);
        this.master.gain.value = this.muted ? 0 : this.volume;
        this.cabinFilter = this.context.createBiquadFilter();
        this.cabinFilter.type = "lowpass";
        this.cabinFilter.frequency.value = this.safeFilterFrequency(14000);
        this.cabinFilter.connect(this.master);
        this.engineFilter = this.context.createBiquadFilter();
        this.engineFilter.type = "lowpass";
        this.engineFilter.frequency.value = this.safeFilterFrequency(7500);
        this.engineFilter.connect(this.master);
        this.pending = Promise.allSettled(
          [
            "lake-radio",
            "911-idle",
            "911-pull",
            "911-redline",
            "911-blip",
            "ignition",
            "door",
            "door-open",
            "road",
            "wind",
          ].map((name) => {
            const recording = (async () => {
            const extension =
              name.startsWith("911-") || name === "ignition" || name === "lake-radio" ? "wav" : "mp3";
            const response = await fetch(
              `/audio/forest-drive/${name}.${extension}`,
              {signal:this.downloads.signal},
            );
            if (!response.ok) throw new Error("Audio could not load");
            const data=await response.arrayBuffer();
            if(this.disposed)return;
            const buffer = await this.context!.decodeAudioData(data);
            if (!this.disposed) this.buffers.set(name, name==="911-pull"?prepareStablePullLoop(this.context!,buffer):buffer);
            })();
            this.loading.set(name, recording);
            return recording;
          }),
        )
          .then((results) => {
            if (!this.disposed) {
              this.startAmbience();
              this.onReady();
              if (results.some(result => result.status === "rejected")) this.onUnavailable();
            }
          })
          .catch(() => {
            if (!this.disposed) this.onUnavailable();
          });
      }
      void this.context.resume().catch(() => {if(!this.disposed)this.onUnavailable();});
    } catch {
      this.onUnavailable();
    }
  }
  private play(
    name: string,
    gain: number,
    loop = false,
    output?: AudioNode,
    offset = 0,
    duration?: number,
  ) {
    if (!this.context || !this.buffers.has(name) || this.disposed) return null;
    const source = this.context.createBufferSource();
    source.buffer = this.buffers.get(name)!;
    source.loop = loop;
    const level = this.context.createGain();
    level.gain.value = gain;
    const length = duration ?? (loop ? 0 : source.buffer.duration-offset);
    if (length > .04) {
      const now = this.context.currentTime;
      level.gain.setValueAtTime(0, now);
      level.gain.linearRampToValueAtTime(gain, now+.015);
      level.gain.setValueAtTime(gain, now+length-.025);
      level.gain.linearRampToValueAtTime(0, now+length);
    }
    source.connect(level);
    level.connect(output ?? this.master!);
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      source.disconnect();
      level.disconnect();
    };
    if (duration) source.start(0, offset, duration);
    else source.start(0, offset);
    return { source, level };
  }
  private startAmbience() {
    const roadFilter = this.context!.createBiquadFilter();
    roadFilter.type = "highpass";
    roadFilter.frequency.value = this.safeFilterFrequency(180);
    roadFilter.connect(this.master!);
    const windFilter = this.context!.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = this.safeFilterFrequency(1400);
    windFilter.connect(this.master!);
    this.roadGain = this.play("road", 0, true, roadFilter)?.level ?? null;
    this.windGain = this.play("wind", 0, true, windFilter)?.level ?? null;
  }
  door(open: boolean) {
    const requested = performance.now();
    void this.loading.get(open ? "door-open" : "door")?.then(() => {
      if (performance.now() - requested > 1200) return;
      if (open) this.play("door-open", 0.15, false, undefined, 0.08, 0.7);
      else this.play("door", 0.24);
    }).catch(() => {});
  }
  ignite() {
    this.running = true;
    const requested = performance.now();
    void this.loading.get("ignition")?.then(() => {
      if (performance.now() - requested < 1200 && !this.disposed)
        this.play("ignition", 0.14, false, undefined, 0, .8);
    }).catch(() => {});
  }
  honk() {
    this.unlock();
    const context=this.context;
    if(!context || !this.master || this.disposed || context.currentTime<this.hornUntil)return;
    const now=context.currentTime;
    this.hornUntil=now+.4;
    const level=context.createGain();
    level.gain.setValueAtTime(0,now);
    level.gain.linearRampToValueAtTime(.16,now+.018);
    level.gain.setValueAtTime(.16,now+.28);
    level.gain.linearRampToValueAtTime(0,now+.36);
    level.connect(this.master);
    let remaining=2;
    for(const frequency of [392,494]){
      const tone=context.createOscillator();tone.type='sawtooth';tone.frequency.value=frequency;
      tone.connect(level);this.horns.add(tone);
      tone.onended=()=>{tone.disconnect();this.horns.delete(tone);if(--remaining===0)level.disconnect();};
      tone.start(now);tone.stop(now+.37);
    }
  }
  rev() {
    if(!this.running || !this.context || this.context.currentTime<this.revUntil) return;
    this.revUntil=this.context.currentTime+1.55;
  }
  update(speed: number, running: boolean, inside: number, gas: boolean|number = false, brake = false, dt = 1/60, sharedState?: {rpm:number;gear:number;load:number}) {
    this.running = running;
    const engineState=sharedState ?? this.engineMotion.update(speed,running,gas,brake,dt,!!this.context&&this.context.currentTime<this.revUntil);
    if (!this.context) return engineState;
    const now = this.context.currentTime;
    this.cabinFilter?.frequency.setTargetAtTime(
      this.safeFilterFrequency(inside > 0.95 ? 1600 : 14000),
      now,
      0.25,
    );
    if(inside>.95&&this.radioEnabled&&!this.radio){
      const loop=this.play("lake-radio",0,true,this.cabinFilter!);
      if(loop){this.radio=loop.source;this.radioGain=loop.level;}
    }
    const phoneRinging=now<this.callDuckingUntil;
    const engineDuck=phoneRinging?.45:1;
    this.radioGain?.gain.setTargetAtTime(this.radioEnabled&&inside>.95?.65*(phoneRinging?.4:1):0,now,.6);
    const movement = Math.min(1, speed / 58);
    this.roadGain?.gain.setTargetAtTime(movement * 0.08, now, 0.35);
    this.windGain?.gain.setTargetAtTime(movement * movement * 0.026, now, 0.6);
    this.engineFilter?.frequency.setTargetAtTime(this.safeFilterFrequency(inside>.95?10000:14000),now,.3);
    if (running && !this.engine) {
      const loop = this.play("911-idle", 0, true, this.engineFilter!);
      if (loop) {
        this.engine = loop.source;
        this.engineGain = loop.level;
      }
    }
    if (running && !this.pull) {
      const loop=this.play("911-pull",0,true,this.engineFilter!);
      if(loop){this.pull=loop.source;this.pullGain=loop.level;}
    }
    if (running && !this.redline) {
      const loop=this.play("911-redline",0,true,this.engineFilter!);
      if(loop){this.redline=loop.source;this.redlineGain=loop.level;}
    }
    const steady=this.redline?Math.min(1,Math.max(0,(engineState.rpm-5800)/800)):0;
    const blend=Math.min(1,Math.max(0,(engineState.rpm-1100)/1250));
    this.engine?.playbackRate.setTargetAtTime(Math.max(.92,Math.min(1.8,engineState.rpm/IDLE_REFERENCE_RPM)),now,ENGINE_PITCH_SLEW_SECONDS);
    this.pull?.playbackRate.setTargetAtTime(Math.max(.48,Math.min(2.2,engineState.rpm/PULL_REFERENCE_RPM)),now,ENGINE_PITCH_SLEW_SECONDS);
    this.engineGain?.gain.setTargetAtTime(running?engineDuck*.28*Math.cos(blend*Math.PI/2):0,now,.18);
    const pullLevel=running?Math.sin(blend*Math.PI/2)*(.35+engineState.load*.85):0;
    this.pullGain?.gain.setTargetAtTime(engineDuck*pullLevel*Math.cos(steady*Math.PI/2),now,.16);
    this.redline?.playbackRate.setTargetAtTime(Math.max(.48,Math.min(2.2,engineState.rpm/REDLINE_REFERENCE_RPM)),now,ENGINE_PITCH_SLEW_SECONDS);
    this.redlineGain?.gain.setTargetAtTime(engineDuck*pullLevel*Math.sin(steady*Math.PI/2),now,.16);
    return engineState;
  }

  forest(enabled:boolean){
    this.forestWanted=enabled;
    if(!this.context || this.disposed)return;
    if(enabled && !this.forestPending){
      this.forestPending=(async()=>{
        const response=await fetch('/audio/forest-drive/forest.mp3',{signal:this.downloads.signal});if(!response.ok)throw new Error('Forest sound could not load');
        const data=await response.arrayBuffer();if(this.disposed)return;
        const buffer=await this.context!.decodeAudioData(data);if(this.disposed)return;
        this.buffers.set('forest',buffer);this.forestGain=this.play('forest',0,true)?.level??null;
        this.forestGain?.gain.setTargetAtTime(this.forestWanted?.2:0,this.context!.currentTime,.6);
      })().catch(()=>{if(!this.disposed)this.onUnavailable();});
    }
    this.forestGain?.gain.setTargetAtTime(enabled?.2:0,this.context.currentTime,.6);
  }
  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyVolume();
  }
  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume));
    this.applyVolume();
  }
  private applyVolume() {
    if (this.context)
      this.master?.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.context.currentTime,
        0.04,
      );
  }
  suspend() {
    if(this.disposed)return;
    void this.context?.suspend().catch(()=>{if(!this.disposed)this.onUnavailable();});
  }
  resume() {
    if(this.disposed)return;
    void this.context?.resume().catch(()=>{if(!this.disposed)this.onUnavailable();});
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.downloads.abort();
    this.running = false;
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {}
    }
    this.sources.clear();
    for(const tone of this.horns){try{tone.stop();}catch{}}
    this.horns.clear();
    void this.context?.close().catch(()=>{});
    this.buffers.clear();
  }
}
