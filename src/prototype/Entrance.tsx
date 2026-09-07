import {readJourneyMemory,rememberJourney,rememberDiscovery,resetJourneyMemory} from './journey-memory';
import {trackJourney,recordSceneReady} from '../lib/journey-stats';
import {ContactLinks} from './ContactLinks';
import {RaceTimes,TimeToBeat} from "./RaceTimes";
import {readRaceResult,type SavedRace} from "./race-result";
import {idleRace,type RaceState} from "./return-race";
import {RacePanel} from "./RacePanel";
import {scenicAccess} from './scenic-route';
import {stopInvitation} from './stop-invitation';
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createCarScene, type CarScene, type LaptopPhase } from "./car-scene";
import { CabinObjects, type CabinObject } from "./CabinObjects";
import { ProjectLaptop } from "./ProjectLaptop";
import type {VisitPhase} from "./stop-visit";
import {JourneyMap} from "./JourneyMap";
import {JOURNEY_STOPS,type JourneyStopId} from "./journey-route";
import { getExperienceMode, isTownJourney } from "./experience-mode";
import { DriveControls } from "./DriveControls";
import type { DrivePhase } from "./forest-route";
import "./entrance.css";
import "./live-entrance.css";
import "./cabin-objects.css";
import "./journey-finish.css";

import { readSoundPreferences, saveSoundPreferences } from "./sound-preferences";
import {readMotionPreference,saveMotionPreference} from './motion-preferences';

type IntroStep = "returning" | "welcome" | "card" | "racket" | "journal" | "laptop" | "ready" | "done";

type Phase = "outside" | "entering" | "inside" | "exiting";

export default function Entrance() {
  const experience = getExperienceMode();
  const journeyMode = experience === "journey";
  const scenicMode = experience === "scenic";
  const townMode=isTownJourney();
  const [memory,setMemory]=useState(readJourneyMemory);
  const [resetPrompt,setResetPrompt]=useState(false);
  const [intro,setIntro] = useState<IntroStep>(scenicMode ? memory.onboarded ? "returning" : "welcome" : "done");
  const introLaptopSeen = useRef(false);
  const [call,setCall]=useState<"idle"|"ringing"|"answered"|"done">("idle");
  const [dismissedStops,setDismissedStops]=useState<JourneyStopId[]>([]);
  const [raceTimes,setRaceTimes]=useState(false);
  const [raceAttempt,setRaceAttempt]=useState(0);
  const [lastResult,setLastResult]=useState<SavedRace|null>(null);
  const [loadingStep,setLoadingStep]=useState(0);
  const [openingFinished,setOpeningFinished]=useState(false);
  const [returnVisit]=useState(()=>{try{return memory.onboarded||sessionStorage.getItem("bryce-arrived")==="yes";}catch{return false;}});
  const [egg,setEgg]=useState("");
  const [race,setRace]=useState<RaceState>({...idleRace});
  const tourAutopilot=townMode && race.phase==="idle";
  const raceActive=race.phase==="racing"||race.phase==="countdown";
  const [lakeDismissed,setLakeDismissed] = useState(false);
  const [visit,setVisit]=useState<{phase:VisitPhase;coffee:boolean;stop:JourneyStopId|null}>({phase:"idle",coffee:false,stop:null});
  const visitRegion=useRef<HTMLElement>(null);
  const [routeMap,setRouteMap]=useState(false);
  const [visited,setVisited]=useState<JourneyStopId[]>(()=>memory.discoveries.filter((item):item is JourneyStopId=>["cafe","tennis","lake"].includes(item)));
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CarScene | null>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>("outside");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failureMessage,setFailureMessage]=useState("The car couldn't load.");
  const [menu, setMenu] = useState(false);
  const [hover, setHover] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const [object, setObject] = useState<CabinObject | null>(null);
  const [laptop, setLaptop] = useState<LaptopPhase>("idle");
  const [screenElement, setScreenElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [drive, setDrive] = useState<{ phase: DrivePhase; overlook: boolean }>({
    phase: "off",
    overlook: false,
  });
  const [telemetry,setTelemetry] = useState({speed:0,rpm:0,gear:1,engineOn:false,automatic:false,turbo:false,speedHold:null as number|null,approach:false,collision:false,distance:0,x:0,z:0,stop:null as JourneyStopId|null});
  const [preferences] = useState(readSoundPreferences);
  const [muted, setMuted] = useState(preferences.muted);
  const [music,setMusic]=useState(()=>{try{return localStorage.getItem("bryce-portfolio-radio")!=="off";}catch{return true;}});
  const musicRef=useRef(music);
  useEffect(()=>{musicRef.current=music;sceneRef.current?.setMusic(music);try{localStorage.setItem("bryce-portfolio-radio",music?"on":"off");}catch{}},[music]);
  const [volume, setVolume] = useState(preferences.volume);
  const [reduceMotion,setReduceMotion]=useState(readMotionPreference);
  const motionRef=useRef(reduceMotion);
  useEffect(() => saveSoundPreferences(muted, volume), [muted, volume]);
  const [audioFailed, setAudioFailed] = useState(false);
  const [hint, setHint] = useState(false);
  const hintShown = useRef(false);
  useEffect(()=>{if(failed)failureRef.current?.focus();},[failed]);
  useEffect(()=>{if(!egg)return;const timer=window.setTimeout(()=>setEgg(""),4000);return()=>window.clearTimeout(timer);},[egg]);

  useEffect(() => {
    const host = hostRef.current!;
    trackJourney("scene_loading");
    setReady(false);
    setPhase("outside");
    setObject(null);
    setLaptop("idle");
    setDrive({phase:"off",overlook:false});
    let cancelled = false;
    const controller = new AbortController();
    const unavailable=()=>{
      if(cancelled)return;
      trackJourney("scene_render_failed");
      cancelled=true;controller.abort();sceneRef.current?.dispose();sceneRef.current=null;
      setReady(false);setPhase('outside');setObject(null);setLaptop('idle');setScreenElement(null);
      setDrive({phase:'off',overlook:false});setVisit({phase:'idle',coffee:false,stop:null});setRouteMap(false);setMenu(false);setHover(null);
      setFailureMessage('The car stopped rendering. You can still read the projects.');setFailed(true);
    };
    host.addEventListener('car-unavailable',unavailable);
    const loading=(event:Event)=>setLoadingStep((event as CustomEvent<number>).detail);
    const easterEgg=(event:Event)=>setEgg((event as CustomEvent<string>).detail);
    host.addEventListener("car-loading",loading);host.addEventListener("car-egg",easterEgg);
    const title = document.title;
    document.title = "Bryce Rambach";
    const started = () => {
      setOpeningFinished(true);
      setPhase("entering");
      setMenu(false);
    };
    const journey = (event: Event) => {
      setDrive((event as CustomEvent).detail);
      setMenu(false);
    };
    const visitChanged=(event:Event)=>{setVisit((event as CustomEvent).detail);setMenu(false);};
    host.addEventListener("car-visit",visitChanged);
    const showMap=()=>setRouteMap(true);
    host.addEventListener("car-map",showMap);
    const raceChanged=(event:Event)=>setRace((event as CustomEvent<RaceState>).detail);
    host.addEventListener("car-race",raceChanged);
    const telemetryChanged = (event: Event) => {
      const detail=(event as CustomEvent<typeof telemetry>).detail;
      const next={...detail,approach:detail.approach??false,turbo:detail.turbo??false,speedHold:detail.speedHold??null};
      setTelemetry(previous=>previous.approach===next.approach && previous.speed===next.speed && previous.rpm===next.rpm && previous.gear===next.gear && previous.automatic===next.automatic && previous.turbo===next.turbo && previous.speedHold===next.speedHold && previous.collision===next.collision && previous.distance===next.distance && previous.x===next.x && previous.z===next.z && previous.stop===next.stop && previous.engineOn===next.engineOn?previous:next);
    };
    const audioUnavailable = () => setAudioFailed(true);
    const hoverObject = (event: Event) =>
      setHover((event as CustomEvent).detail);
    const laptopChanged = (event: Event) => {
      const next=(event as CustomEvent<LaptopPhase>).detail;
      setLaptop(next);
      if(next==="reading")setMemory(rememberDiscovery("laptop"));
      setMenu(false);
      setHover(null);
    };
    const leaving = () => {
      setPhase("exiting");
      setHover(null);
    };
    const inspect = (event: Event) => {
      const item = (event as CustomEvent).detail;
      if(typeof item==="string")setMemory(rememberDiscovery(item));
      if (item === "laptop" || item === "journal" || item === "card" || item === "racket")
        setObject(item);
    };
    host.addEventListener("car-enter", started);
    host.addEventListener("car-drive", journey);
    host.addEventListener("car-telemetry",telemetryChanged);
    host.addEventListener("car-audio-unavailable", audioUnavailable);
    host.addEventListener("car-exit", leaving);
    host.addEventListener("car-hover", hoverObject);
    host.addEventListener("car-artifact", inspect);
    host.addEventListener("car-laptop", laptopChanged);
    createCarScene(
      host,
      () => {
        if (!cancelled){recordSceneReady(performance.now());setReady(true);try{sessionStorage.setItem("bryce-arrived","yes");}catch{}}
      },
      (inside) => {
        if (!cancelled) setPhase(inside ? "inside" : "outside");
      },
      controller.signal,
    )
      .then((scene) => {
        if (cancelled) scene.dispose();
        else {
          sceneRef.current = scene;
          scene.mute(preferences.muted);
          scene.volume(preferences.volume);
          scene.setMusic(musicRef.current);
          scene.reduceMotion(motionRef.current);
          setScreenElement(scene.screenElement);
        }
      })
      .catch(() => {
        if (!cancelled){trackJourney("scene_load_failed");setFailed(true);}
      });
    return () => {
      cancelled = true;
      controller.abort();
      host.removeEventListener('car-unavailable',unavailable);
      host.removeEventListener("car-loading",loading);host.removeEventListener("car-egg",easterEgg);
      host.removeEventListener("car-visit",visitChanged);
      host.removeEventListener("car-map",showMap);
      host.removeEventListener("car-enter", started);
      host.removeEventListener("car-drive", journey);
      host.removeEventListener("car-telemetry",telemetryChanged);
      host.removeEventListener("car-race",raceChanged);
      host.removeEventListener("car-audio-unavailable", audioUnavailable);
      host.removeEventListener("car-exit", leaving);
      host.removeEventListener("car-hover", hoverObject);
      host.removeEventListener("car-artifact", inspect);
      host.removeEventListener("car-laptop", laptopChanged);
      sceneRef.current?.dispose();
      sceneRef.current = null;
      document.title = title;
    };
  }, []);

  useEffect(() => {
    if (phase !== "inside" || hintShown.current) return;
    hintShown.current = true;
    setHint(true);
    const timeout = window.setTimeout(() => setHint(false), 7200);
    return () => window.clearTimeout(timeout);
  }, [phase]);
  useEffect(()=>{if((!journeyMode&&!townMode) || drive.phase!=="parked")return;const stop=telemetry.stop;if(stop){setVisited(previous=>previous.includes(stop)?previous:[...previous,stop]);setMemory(rememberDiscovery(stop));}},[journeyMode,townMode,drive.phase,telemetry.stop]);
  useEffect(()=>{if(visit.phase==="exploring")visitRegion.current?.focus();},[visit.phase,visit.coffee]);
  const currentStop=(journeyMode||townMode) && drive.phase==="parked"?JOURNEY_STOPS.find(stop=>stop.id===telemetry.stop):null;
  const moving = phase === "entering" || phase === "exiting";
  const travelling =
    drive.phase === "driving" ||
    drive.phase === "parking" ||
    drive.phase === "starting";
  const ignite = () => {
    if (intro !== "done") return;
    setObject(null);
    setMenu(false);
    setHint(false);
    sceneRef.current?.startDrive();
  };
  const open = (item: CabinObject) => {
    setMemory(rememberDiscovery(item));
    setMenu(false);
    setHint(false);
    if (item === "laptop" && phase === "inside" && sceneRef.current)
      sceneRef.current.openLaptop();
    else if (phase === "inside" && sceneRef.current)
      sceneRef.current.inspect(item);
    else setObject(item);
  };
  const nextIntro = () => {
    sceneRef.current?.putDownObject();
    setObject(null);
    setIntro(previous => previous === "card" ? "ready" : previous === "racket" ? "journal" : previous === "journal" ? "laptop" : previous === "laptop" ? "ready" : previous);
  };
  useEffect(() => {
    if (phase !== "inside") return;
    if (intro === "card" || intro === "racket" || intro === "journal") sceneRef.current?.inspect(intro);
    if (intro === "laptop") sceneRef.current?.openLaptop();
  }, [intro, phase]);
  useEffect(() => {
    if (intro !== "laptop") return;
    if (laptop === "reading") introLaptopSeen.current = true;
    if (laptop === "idle" && introLaptopSeen.current) setIntro("ready");
  }, [intro, laptop]);
  useEffect(()=>{if(phase==="inside")trackJourney("car_entered");},[phase]);
  useEffect(()=>{if(telemetry.stop==="lake"&&drive.phase==="parked"){trackJourney("lake_reached");setMemory(rememberJourney({lake:true}));}},[telemetry.stop,drive.phase]);
  useEffect(()=>{if(race.phase==="racing")trackJourney("race_started");if(race.phase==="finished")trackJourney("race_finished");},[race.phase]);
  const lakeArrival = scenicMode && intro === "done" && telemetry.stop === "lake" && drive.phase === "parked" && !lakeDismissed;
  const invitation = townMode && phase === "inside" && intro === "done" && (drive.phase === "driving" || drive.phase === "off" || drive.phase === "parked") && !telemetry.approach ? stopInvitation(scenicAccess,telemetry.distance,telemetry.speed,[...visited,...dismissedStops]) : null;
  const retryRace=()=>{if(sceneRef.current?.replayRace()){setLastResult(null);setRace({...idleRace,phase:"countdown",countdown:3});setRaceAttempt(value=>value+1);setLakeDismissed(true);focusCabin();}};
  const focusCabin=()=>hostRef.current?.querySelector("canvas")?.focus({preventScroll:true});
  const callAvailable=phase==="inside"&&!object&&laptop==="idle"&&!menu&&!routeMap&&!raceTimes&&!lastResult;
  const callDistance=townMode?950:scenicAccess.find(access=>access.id==="lake")!.entry-620;
  useEffect(()=>{
    if(scenicMode&&intro==="done"&&drive.phase==="driving"&&call==="idle"&&telemetry.distance>callDistance&&telemetry.distance<scenicAccess.find(access=>access.id==="lake")!.entry-430&&callAvailable){
      setCall("ringing");sceneRef.current?.ringCall();
    }
  },[scenicMode,intro,drive.phase,call,callDistance,telemetry.distance,callAvailable]);
  useEffect(()=>{
    if(!callAvailable&&(call==="ringing"||call==="answered")){sceneRef.current?.stopCall();setCall("done");}
  },[callAvailable,call]);
  useEffect(()=>{
    if(call!=="ringing"&&call!=="answered")return;
    const timer=window.setTimeout(()=>{sceneRef.current?.stopCall();setCall("done");},call==="ringing"?9000:6000);
    return()=>window.clearTimeout(timer);
  },[call]);
  const lakeEntry = scenicAccess.find(access => access.id === "lake")!.entry;
  const lakeApproach = scenicMode && !lakeDismissed && travelling && telemetry.distance > lakeEntry - 430 && telemetry.distance < lakeEntry + 180;
  return (
    <main
      className={`entrance live-entrance live-entrance--${phase} ${ready ? "is-ready" : ""} ${reduceMotion?'has-reduced-motion':''}`}
      aria-label="Bryce's world"
      onKeyDown={(event) => {
        const target=event.target;
        if(target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'))return;
        if(event.metaKey||event.ctrlKey||event.altKey)return;
        if(raceTimes||lastResult||race.phase==="finished")return;
        if (event.code === "KeyK" && phase === "inside" && !object && !routeMap && visit.phase==="idle" && laptop==="idle" && !menu) {
          event.preventDefault();
          ignite();
        }
        if (event.code === "KeyR" && phase === "inside" && !object && !routeMap && visit.phase==="idle" && laptop==="idle" && !menu && !event.repeat) {
          event.preventDefault();
          sceneRef.current?.rev();
        }
        if (event.key === "Escape" && menu) {
          setMenu(false);
          menuRef.current?.focus();
        }
      }}
    >
      <div
        className="live-entrance__scene"
        ref={hostRef}
        onPointerDown={() => setHint(false)}
      />
      <div className="live-entrance__shade" aria-hidden="true" />
      {!moving && (
        <button
          ref={menuRef}
          className="simulation-menu-button"
          aria-label="Open site menu"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          <span aria-hidden="true">{menu ? "×" : "☰"}</span>
        </button>
      )}
      {menu && !moving && (
        <nav className="simulation-menu" aria-label="Site menu">
          <button onClick={()=>{setMenu(false);setRaceTimes(true);}}>Race times</button>
          {readRaceResult()&&<button onClick={()=>{setMenu(false);setLastResult(readRaceResult());}}>Your last time</button>}
          <button aria-pressed={music} onClick={()=>setMusic(!music)}>Radio music {music?"on":"off"}</button>
          <p className="simulation-menu-note">{music?"Passenger gets aux privileges.":"The engine gets the solo."}</p>
          {(journeyMode||townMode) && phase === "inside" && visit.phase === "idle" && <button onClick={()=>{setMenu(false);sceneRef.current?.openMap();}}>Route map</button>}
          <button onClick={() => open("laptop")}>Personal projects</button>
          <button onClick={() => open("racket")}>Tennis racket</button>
          <button onClick={() => open("journal")}>Off the clock</button>
          <button onClick={() => open("card")}>About & contact</button>
          {memory.onboarded&&<button onClick={()=>setResetPrompt(true)}>Replay the introduction</button>}
          {resetPrompt&&<section aria-label="Reset introduction"><p>Replay the introduction next time? Your race results and sound settings stay saved.</p><button onClick={()=>{resetJourneyMemory();setMemory(readJourneyMemory());setResetPrompt(false);setMenu(false);}}>Reset introduction</button><button onClick={()=>setResetPrompt(false)}>Keep my progress</button></section>}
          {phase === "outside" && ready && (
            <button
              onClick={() => {
                sceneRef.current?.skipApproach();
                setMenu(false);
                hostRef.current?.querySelector('canvas')?.focus();
              }}
            >
              Skip approach
            </button>
          )}
          {phase === "inside" && (
            <>
              <button onClick={ignite} disabled={travelling}>
                {travelling ? "On the road" : drive.phase === "parked" ? "Keep going" : "Turn the ignition key"}
              </button>
              {drive.phase === "parked" && <button onClick={() => { sceneRef.current?.rev(); setMenu(false); }}>Blip the throttle</button>}
              {travelling && (
                <button
                  onClick={() => {
                    sceneRef.current?.park();
                    setMenu(false);
                  }}
                >
                  Pull over
                </button>
              )}
              <button
                onClick={() => {
                  sceneRef.current?.center();
                  setMenu(false);
                  focusCabin();
                }}
              >
                Face forward
              </button>
              <button
                onClick={() => {
                  setMenu(false);
                  sceneRef.current?.exit();
                }}
              >
                Step outside
              </button>
            </>
          )}
          <a href="/projects">Read without the scene</a>
          <label className="simulation-motion">Movement
            <select aria-label="Movement" value={reduceMotion?'reduce':'device'} onChange={event=>{
              const reduce=event.target.value==='reduce';motionRef.current=reduce;setReduceMotion(reduce);saveMotionPreference(reduce);sceneRef.current?.reduceMotion(reduce);
            }}>
              <option value="device">Follow device</option>
              <option value="reduce">Reduce motion</option>
            </select>
          </label>
          <label className="simulation-volume">
            Volume
            <input
              aria-label="Sound volume"
              type="range"
              min="0"
              max="1"
              step=".01"
              value={volume}
              onChange={(event) => {
                setVolume(event.target.valueAsNumber);
                sceneRef.current?.volume(event.target.valueAsNumber);
              }}
            />
          </label>
          {audioFailed && (
            <p className="simulation-menu-note">
              Audio couldn't load. You can continue without sound.
            </p>
          )}
          <p className="simulation-menu-note">
            W / ↑ accelerates. S / ↓ brakes. A / D or ← / → steers. Space parks.
            Switch on Cruise to let the car follow the road. Q downshifts. E upshifts. The car upshifts at redline. C holds your speed while you steer. Gas or brake releases it. H honks the horn. K starts the engine. R revs it when parked.
          </p>
          <a
            href="/models/entrance/credits.txt"
            target="_blank"
            rel="noreferrer"
          >
            Scene credits ↗
          </a>
        </nav>
      )}
      {phase === "outside" && !failed && visit.phase==="idle" && (
        <button
          ref={enterRef}
          className={`simulation-enter simulation-enter--keyboard ${!ready ? "is-loading" : ""}`}
          aria-label={ready ? "Get in the Porsche" : "Loading the car"}
          disabled={!ready}
          onClick={() => {
            setMenu(false);
            sceneRef.current?.enter();
          }}
        >
          <span className="entry-label">Get in <span aria-hidden="true">↗</span></span>
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M7 24V11l7-5h11v18H7Z M17 6v18 M11 16h3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="m21 13 4 3-4 3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      )}
      {ready && !openingFinished && !returnVisit && !reduceMotion && phase==="outside" && <div className="arrival-film" aria-hidden="true" onAnimationEnd={event=>{if(event.target===event.currentTarget)setOpeningFinished(true);}}><div className="arrival-film__title"><span>BRYCE RAMBACH / AN INTERACTIVE ROAD TRIP</span><strong>Take the<br/><em>long way.</em></strong><small>A few things about me. A Porsche. Your way home.</small></div></div>}
      {!failed && <div className={`journey-loading ${ready?'journey-loading--ready':''} ${returnVisit?'journey-loading--return':''}`} aria-hidden={ready||undefined}><div><span>BRYCE RAMBACH</span><strong>The long way.</strong><p role={ready?undefined:"status"}>{["Getting the car ready.","Unpacking the cabin.","Finding the light.","One last look at the road."][Math.min(3,loadingStep)]}</p><div className="journey-loading__stages" aria-hidden="true">{[0,1,2,3].map(step=><i key={step} className={step<=loadingStep?'is-done':''}/>)}</div><a href="/projects" tabIndex={ready?-1:0}>Straight to the projects ↗</a></div></div>}
      {failed && (
        <section ref={failureRef} tabIndex={-1} aria-label="Scene unavailable" className="simulation-failure">
          <p>{failureMessage}</p>
          <button onClick={() => window.location.reload()}>Try again</button>
          <button onClick={() => open("laptop")}>Open personal projects</button>
          <a href="/projects">Read without the scene</a>
          <a href="mailto:bryce.rambach@gmail.com">Contact Bryce</a>
        </section>
      )}
      {!scenicMode && ready && phase === "outside" && !menu && (
        <p className="simulation-door-cue" aria-hidden="true">
          Tap the door to get in.
        </p>
      )}
      {hover && !moving && !object && !menu && (
        <span
          className="cabin-hover"
          style={{ left: hover.x, top: hover.y }}
          aria-hidden="true"
        >
          {hover.label}
        </span>
      )}
      {ready && (
        <button
          className="simulation-sound"
          aria-label={muted ? "Unmute sound" : "Mute sound"}
          aria-pressed={muted}
          onClick={() => {
            setMuted(!muted);
            sceneRef.current?.mute(!muted);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4 10h4l5-4v12l-5-4H4z" />
            {muted ? (
              <path d="m17 9 5 6m-5 0 5-6" />
            ) : (
              <path d="M17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" />
            )}
          </svg>
        </button>
      )}
      {phase === "inside" && intro === "done" && race.phase!=="countdown" && race.phase!=="finished" && !lastResult && !lakeArrival && !object && laptop === "idle" && !menu && visit.phase==="idle" && (
        <>
          {!scenicMode && !travelling && (
            <section className="city-invitation" aria-label="Choose your next stop">
              <span className="city-eyebrow">{journeyMode?"BRYCE RAMBACH / THE LONG WAY":"BRYCE RAMBACH / AFTER HOURS"}</span>
              <h1>{currentStop?currentStop.name:drive.phase === "parked" ? (journeyMode?"Stay a little longer.":"The night's still young.") : "Take the long way."}</h1>
              <button className="city-start" onClick={ignite}>{drive.phase === "parked" ? "Back on the road" : "Start driving"}<span aria-hidden="true">↗</span></button>
              {currentStop?.id==="cafe" && <button className="stop-visit-action" onClick={()=>sceneRef.current?.visitCafe()}>Step out for a flat white ↗</button>}
              {currentStop?.id==="cafe" && <button onClick={()=>open("laptop")}>What I’m building ↗</button>}
              {currentStop?.id==="tennis" && <button onClick={()=>open("racket")}>About that racket ↗</button>}
              {currentStop?.id==="trailhead" && <button className="stop-visit-action" onClick={()=>sceneRef.current?.visitTrail()}>Take the short trail ↗</button>}
              <p>{currentStop?"The route map is on the dashboard. Pick your next stop whenever you’re ready.":journeyMode?"Coffee, forest roads and a little more time.":"You steer. The city keeps going."}</p>
            </section>
          )}
          {scenicMode && !travelling && <section className="scenic-ignition" aria-label="Ignition">
            {drive.phase === "parked" && (currentStop||drive.overlook) && <h1>{currentStop?.name??"Lakeside"}.</h1>}
            {townMode && <button onClick={()=>setRouteMap(true)}>Route map</button>}
            {currentStop?.id==="cafe"&&<button onClick={()=>open("laptop")}>What I’m building ↗</button>}
            {currentStop?.id==="tennis"&&<button onClick={()=>open("racket")}>About that racket ↗</button>}
            <button onClick={()=>{if(townMode&&currentStop&&currentStop.id!=="lake")sceneRef.current?.navigate("lake");else ignite();}}>{drive.phase === "parked" ? townMode&&currentStop&&currentStop.id!=="lake"?"Continue to lake":"Back on the road" : "Turn the ignition key"}<span aria-hidden="true"> ↗</span></button>
            {townMode && currentStop?.id==="lake" && race.phase==="idle" && <button onClick={()=>{if(sceneRef.current?.startRace()){setLakeDismissed(true);focusCabin();}}}>Race back to the start ↗</button>}
            {drive.phase === "parked" && <button disabled={!telemetry.engineOn} onClick={()=>{sceneRef.current?.stopEngine();hostRef.current?.querySelector('canvas')?.focus();}}>{telemetry.engineOn ? "Turn engine off" : "Engine off"}</button>}
          </section>}
          {scenicMode && hint && intro === "done" && !travelling && <p className="cabin-exploration-hint">Open the laptop for projects. Pick up the racket or contact card to learn more.</p>}
          {travelling && (
            <div className={`city-dashboard ${telemetry.collision ? "city-dashboard--contact" : ""}`} aria-label="Driving instruments">
              <span><strong>{telemetry.speed}</strong><small>KM/H</small></span>
              <span><strong>{telemetry.rpm.toLocaleString()}</strong><small>RPM</small></span>
              <span><strong>{telemetry.gear}</strong><small>GEAR</small></span>
            </div>
          )}
          {experience === "city" && <nav className="city-cabin-nav" aria-label="Explore the cabin">
            <button onClick={() => open("laptop")}>Projects</button>
            <button onClick={() => open("journal")}>Photos</button>
            <button onClick={() => open("racket")}>Tennis</button>
            <button onClick={() => open("card")}>About</button>
          </nav>}
          {travelling && (
            <div className="city-drive-mode">
              {tourAutopilot && <strong className="autopilot-label">Autopilot · enjoy the view</strong>}
              {!tourAutopilot && !raceActive && <>
              <button disabled={tourAutopilot||raceActive||telemetry.approach} aria-pressed={telemetry.automatic} onClick={() => {
                const automatic=!telemetry.automatic;
                sceneRef.current?.setCruise(automatic);
                setTelemetry(current=>({...current,automatic}));
              }}>{tourAutopilot ? "Autopilot · enjoy the view" : telemetry.approach ? "Guiding into turnout" : telemetry.automatic ? "Cruise on" : "Cruise off"}</button>
              <button disabled={tourAutopilot||raceActive||telemetry.approach} aria-pressed={telemetry.automatic&&telemetry.turbo} onClick={()=>sceneRef.current?.setTurbo(!(telemetry.automatic&&telemetry.turbo))}>Turbo cruise {telemetry.automatic&&telemetry.turbo?"on":"off"}</button>
              <button aria-label={telemetry.speedHold!==null?"Release speed hold":"Hold current speed"} aria-keyshortcuts="C" aria-describedby="driving-mode-help" disabled={tourAutopilot || telemetry.approach || drive.phase!=="driving" || (telemetry.speedHold===null && telemetry.speed<11)} aria-pressed={telemetry.speedHold!==null} onClick={()=>sceneRef.current?.setSpeedHold(telemetry.speedHold===null)}>{telemetry.speedHold!==null?`Holding ${Math.round(telemetry.speedHold*3.6)} km/h`:`Hold ${telemetry.speed} km/h`} · C</button>
              </>}
              <button onClick={()=>sceneRef.current?.honk()} aria-label="Honk horn" aria-keyshortcuts="H">H · Honk</button>
              {!tourAutopilot && <div className="city-gears"><button disabled={tourAutopilot} aria-label="Downshift" onClick={() => sceneRef.current?.shift(-1)}>Q <span>− gear</span></button><button disabled={tourAutopilot} aria-label="Upshift" onClick={() => sceneRef.current?.shift(1)}>E <span>+ gear</span></button></div>}
              <span id="driving-mode-help">{raceActive?"W / ↑ gas · S / ↓ brake · A / D steer · Q / E shift":tourAutopilot?"I’ll handle the road. Look around, honk, or choose a stop. You get the wheel for the race.":telemetry.approach?"The car is steering. You can still brake or pull over.":drive.phase==="starting"?"Starting the engine.":drive.phase==="parking"?"Pulling over.":telemetry.automatic&&telemetry.turbo?"Faster straights, slower bends. Steer, accelerate or brake to take control.":telemetry.speedHold!==null?"You steer. Gas, brake or C releases speed hold.":telemetry.speed<11?"Reach 11 km/h to hold your speed. A / D steer.":"C holds speed · W / ↑ gas · S / ↓ brake · A / D steer"}</span>
            </div>
          )}
        </>
      )}
      {drive.phase === "driving" && !object && laptop === "idle" && !menu && (
        <DriveControls assisted={tourAutopilot||telemetry.approach||race.phase==="countdown"} input={(key, pressed) => sceneRef.current?.input(key, pressed)} park={() => sceneRef.current?.park()} />
      )}
      {journeyMode && visit.phase!=="idle" && <section ref={visitRegion} tabIndex={-1} className="stop-visit-panel" aria-label={visit.stop==='trailhead'?"Forest walk":"Café visit"}>
        <span>{visit.stop==='trailhead'?"THE LONG WAY / FOREST TRAIL":"THE LONG WAY / COFFEE STOP"}</span>
        <h2>{visit.phase==='leaving'?'Turning off the engine.':visit.phase==='walking'?(visit.stop==='trailhead'?'Follow the trail.':'A few steps to the window.'):visit.phase==='returning'||visit.phase==='entering'?'Back to the Porsche.':visit.stop==='trailhead'?'A little room to breathe.':visit.coffee?'Flat white, to go.':'Take your time.'}</h2>
        {visit.phase==='exploring' && <>
          <p>{visit.stop==='trailhead'?'Stay at the view for a moment. The Porsche is where you left it.':visit.coffee?'Your coffee is on the counter. Take it back when you’re ready.':'A quiet stop before the hills.'}</p>
          {visit.stop==='cafe' && !visit.coffee && <button onClick={()=>sceneRef.current?.orderCoffee()}>Order a flat white</button>}
        </>}
        {(visit.phase==='walking'||visit.phase==='exploring') && <button onClick={()=>sceneRef.current?.returnToCar()}>{visit.stop==='cafe' && visit.coffee?'Take coffee back to the car':'Back to the car'}</button>}
      </section>}
      {phase === "inside" && intro === "returning" && <section className="journey-note" aria-label="Welcome back"><span>THE LONG WAY / BACK AGAIN</span><h1>You know where the keys are.</h1><p>Your introduction is saved. Take another trip, or head straight to the work.</p><button onClick={()=>{sceneRef.current?.allowIgnition();setIntro("done");setHint(false);}}>Take another drive ↗</button>{memory.lake&&townMode&&<button onClick={()=>{if(sceneRef.current?.replayRace()){setIntro("done");setLakeDismissed(true);setHint(false);focusCabin();}}}>Back to the race ↗</button>}<a href="/projects">Open my projects ↗</a><button onClick={()=>setIntro("welcome")}>Show me around again</button></section>}
      {phase === "inside" && (intro === "welcome" || intro === "ready") && <section className="journey-note" aria-label="Before we go">
        <span>BRYCE RAMBACH / {intro === "welcome" ? "BEFORE WE GO" : "YOUR TURN"}</span>
        <h1>{intro === "welcome" ? "A tiny toll before the keys." : "Okay. Have fun."}</h1>
        <p>{intro === "welcome" ? "A quick introduction first. I did build a whole car to get you here. The rest of my stuff is coming along for the ride." : "Turn the key. I’ll handle the road while you look around. At the lake, you can take the wheel for a race home."}</p>
        <button onClick={() => { if (intro === "welcome") setIntro("card"); else { sceneRef.current?.allowIgnition(); setMemory(rememberJourney({onboarded:true})); trackJourney("intro_completed"); setIntro("done"); setHint(false); } }}>{intro === "welcome" ? "Fine, show me your stuff" : "Hand over the keys"}</button>
        <a href="/projects">Just here for the work?</a>
      </section>}
      {(call==="ringing"||call==="answered") && phase==="inside" && !object && laptop==="idle" && !menu && <aside className="journey-call" aria-label="Car phone">
        <span>{call==="ringing"?"INCOMING CALL":"BRYCE / CONNECTED"}</span><strong>{call==="ringing"?"Bryce":"Still there?"}</strong>
        {call==="answered"?<p>Just checking you haven’t forgotten this is a portfolio.</p>:<div><button onClick={()=>{sceneRef.current?.stopCall();setCall("answered");focusCabin();}}>Answer</button><button onClick={()=>{sceneRef.current?.stopCall();setCall("done");focusCabin();}}>Ignore</button></div>}
      </aside>}
      {invitation && !object && laptop === "idle" && !menu && <aside className="stop-invitation" aria-label={invitation.id === "cafe" ? "Café ahead" : "Tennis courts ahead"}>
        <div><span>OPTIONAL STOP</span><strong>{invitation.id === "cafe" ? "Flat white?" : "One more set?"}</strong><p>{invitation.id === "cafe" ? "The Long Way café is just ahead." : "The young prodigy’s natural habitat."}</p></div>
        <button onClick={()=>{setDismissedStops(previous=>[...previous,invitation.id]);sceneRef.current?.navigate(invitation.id);}}>Pull in ↗</button>
        <button className="stop-invitation__dismiss" aria-label="Keep going" onClick={()=>{setDismissedStops(previous=>[...previous,invitation.id]);focusCabin();}}>×</button>
      </aside>}
      {lakeApproach && !object && laptop === "idle" && <aside className="journey-caption" role="status"><strong>One stop I don’t want you to miss.</strong><span>The car will guide you into the lake turnout.</span></aside>}
      {lakeArrival && !object && laptop === "idle" && <section className="journey-note journey-note--finish" aria-label="the lake turnout">
        <span>THE LAST STOP / A LITTLE CLOSER TO HOME</span><h1>This one’s for the lake.</h1>
        <p>My family lives by the lake. It’s beautiful. This little stretch of road is my nod to it.</p>
        <p>That’s the trip. Fancy taking the wheel for the way back?</p>
        {townMode&&<TimeToBeat open={()=>setRaceTimes(true)}/>}
        {townMode && <button onClick={()=>{if(sceneRef.current?.startRace()){setLakeDismissed(true);focusCabin();}}}>Race back to the start ↗</button>}
        <button onClick={() => { setLakeDismissed(true); open("laptop"); }}>Open my projects</button>
        <div className="journey-finish-links"><a href="/projects">Read the full portfolio ↗</a><a href="mailto:bryce.rambach@gmail.com">Say hello ↗</a></div><ContactLinks/>
        <button onClick={() => {setLakeDismissed(true);focusCabin();}}>Stay a little longer</button>
      </section>}
      {raceTimes&&<RaceTimes close={()=>{setRaceTimes(false);focusCabin();}}/>}
      {lastResult&&<RacePanel retry={phase==="inside"&&memory.lake?retryRace:undefined} race={{...idleRace,phase:"finished",elapsed:lastResult.elapsed}} resume={lastResult} cancel={()=>{setLastResult(null);focusCabin();}}/>}
      {egg&&!object&&!menu&&!raceTimes&&race.phase!=="finished"&&<aside className="journey-egg" role="status">{egg}</aside>}
      {race.phase!=="idle" && !lastResult && <RacePanel key={raceAttempt} retry={memory.lake?retryRace:undefined} race={race} cancel={()=>{sceneRef.current?.cancelRace();focusCabin();}}/>}
      {(journeyMode||townMode) && routeMap && <JourneyMap firstTrip={scenicMode&&!visited.includes("lake")} stops={townMode?JOURNEY_STOPS.filter(stop=>["cafe","tennis","lake"].includes(stop.id)):undefined} accessRoads={townMode?scenicAccess:undefined} position={{x:telemetry.x,z:telemetry.z}} restoreFocus={()=>hostRef.current?.querySelector("canvas")?.focus()} distance={telemetry.distance} visited={visited} close={()=>setRouteMap(false)} navigate={id=>{setRouteMap(false);sceneRef.current?.navigate(id);}}/>}
      {object && (
        <CabinObjects
          key={object}
          object={object}
          physical={phase === "inside"}
          nextLabel={phase === "inside" && intro === object ? intro === "card" ? "Ready for the road" : intro === "racket" ? "Next: off the clock" : "Next: my projects" : undefined}
          close={() => {
            if (phase === "inside" && intro === object) { nextIntro(); return; }
            setObject(null);
            sceneRef.current?.putDownObject();
            menuRef.current?.focus();
          }}
        />
      )}
      {screenElement &&
        createPortal(
          <ProjectLaptop
            embedded
            active={laptop === "reading" && !menu}
            closeLabel={intro === "laptop" ? "Ready for the keys" : undefined}
            close={() => { sceneRef.current?.closeLaptop(); if (intro === "laptop") setIntro("ready"); }}
          />,
          screenElement,
        )}
      <span className="entrance__sr" role="status">
        {visit.phase!=="idle"
          ? visit.stop==='trailhead' ? (visit.phase==='exploring'?'You’re at the forest viewpoint. Return to the car when you’re ready.':visit.phase==='walking'?'Walking along the forest trail. You can return to the car at any time.':'Returning between the car and trail.') : visit.phase==='exploring' ? (visit.coffee?'Your flat white is ready. Return to the car when you’re ready.':'You’re at the café window. Order a flat white or return to the car.') : visit.phase==='leaving'?'Turning off the engine and stepping outside.':visit.phase==='walking'?'Walking to the café window.': 'Returning to the Porsche.'
          : travelling
          ? drive.phase === "starting"
            ? "Turning the key. Settling toward the road."
            : drive.phase === "parking"
              ? "Pulling over."
              : tourAutopilot ? "Autopilot is handling the road. Look around, honk or choose a stop. Manual controls unlock for the return race." : telemetry.approach ? "Guiding into the lake turnout. You can still brake or pull over." : (telemetry.automatic ? (telemetry.turbo?"Turbo cruise. Faster on straights, slower before bends. Steer, accelerate or brake to take control.":"Cruising along the road. Switch Cruise off to take the wheel.") : telemetry.speedHold!==null ? `Holding ${Math.round(telemetry.speedHold*3.6)} kilometres per hour. Use A or D to steer. Gas, brake or C releases speed hold.` : "You’re driving. Hold W or Up to accelerate, S or Down to brake, and A or D to steer. C holds your speed. H honks. Space parks the car.")
          : currentStop && laptop === "idle"
            ? `Parked at ${currentStop.name}. Explore the cabin or choose your next stop from the map.`
          : drive.phase === "parked" && drive.overlook && laptop === "idle"
            ? "Parked by the waterfront. Explore the cabin or get back on the road."
            : laptop === "opening"
              ? "Opening the laptop."
              : laptop === "reading"
                ? "Reading projects on the laptop. Close the laptop or press Escape to return to your seat."
                : laptop === "closing"
                  ? "Putting the laptop back on the passenger seat."
                  : moving
                    ? "Moving through the scene."
                    : phase === "inside"
                      ? "You're in the driver's seat. Drag to look around. Select a cabin object to explore, or use the site menu. Arrow keys look around."
                      : failed
                        ? "The scene is unavailable. Projects and contact are available below."
                        : ready
                          ? "The car is ready. Select the door to get in, or Tab to the entry control."
                          : "Loading the car."}
      </span>
    </main>
  );
}
