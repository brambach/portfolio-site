import {createRaceFinishLine} from "./race-finish-line";
import {ReturnRace} from "./return-race";
import {withFirstDrawObjects} from "./first-draw-warmup";
import {contactCardPose,contactCardReadingPose} from './contact-card-motion';
import * as THREE from "three";
import {pickArtifact} from "./pick-artifact";
import {createExteriorPicker} from "./exterior-picking";
import {scenicLakeFrame} from "./journey-land";
import {readMotionPreference} from "./motion-preferences";
import {waitForGpu} from "./gpu-ready";
import {warmTextures} from "./texture-warmup";
import {loadingBatches} from "./loading-batches";
import {getExperienceMode,isTownJourney} from "./experience-mode";
import {createScenicDrive,createTownDrive} from "./scenic-drive";
import {scenicRoad} from "./scenic-route";
import {StopVisit} from "./stop-visit";
import {createCoffeeCup} from "./coffee-cup";
import {SceneResources} from "./scene-resources";
import { RenderQuality } from "./render-quality";
import { createSceneProfile } from "./scene-profile";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createCityWorld } from "./city-world";
import {createJourneyWorld} from "./journey-world";
import {journeyRoad,JOURNEY_STOPS,stopDistance,type JourneyStopId} from "./journey-route";
import {cityRoad} from "./city-path";
import {createTrafficMeshes} from "./city-traffic-mesh";
const SUN_DIRECTION = new THREE.Vector3(-.6,.8,-.4).normalize();
import {
  CityDrive,
} from "./city-route";
import type {DriveInput} from "./forest-route";
import { CarAudio } from "./car-audio";
import { addIgnition } from "./ignition";
import { addCarParts, addDoorInterior } from "./door-geometry";
import { cameraPose, cabinDiscoveryLook } from "./camera-path";
import { addCabinDetails } from "./cabin-details";
import { addCabinArtifacts } from "./cabin-artifacts";
import { loadCabinMaterials } from "./cabin-materials";
import {
  LAPTOP_SCREEN,
  laptopPose,
  readingPose,
  smooth,
} from "./laptop-motion";

import { racketPose, racketReadingPose } from "./tennis-racket";
import type { CabinObject } from "./CabinObjects";

export type LaptopPhase = "idle" | "opening" | "reading" | "closing";

export type CarScene = {
  startRace: () => boolean;
  cancelRace: () => void;
  enter: () => void;
  exit: () => void;
  look: (x: number, y: number) => void;
  center: () => void;
  openLaptop: () => void;
  closeLaptop: () => void;
  inspect: (item: CabinObject) => void;
  putDownObject: () => void;
  rev: () => void;
  screenElement: HTMLDivElement;
  startDrive: () => void;
  allowIgnition: () => void;
  stopEngine: () => void;
  honk: () => void;
  setTurbo: (enabled:boolean) => void;
  setSpeedHold: (enabled:boolean) => void;
  setCruise: (enabled: boolean) => void;
  shift: (direction:-1|1) => void;
  park: () => void;
  input: (key: DriveInput, pressed: boolean) => void;
  mute: (muted: boolean) => void;
  setMusic: (enabled:boolean) => void;
  ringCall: () => void;
  stopCall: () => void;
  volume: (volume: number) => void;
  reduceMotion: (reduce: boolean) => void;
  skipApproach: () => void;
  dispose: () => void;
  openMap: () => void;
  visitCafe: () => void;
  visitTrail: () => void;
  returnToCar: () => void;
  orderCoffee: () => void;
  navigate: (id:JourneyStopId) => void;
};

export async function createCarScene(
  host: HTMLDivElement,
  onReady: () => void,
  onArrival: (inside: boolean) => void,
  signal: AbortSignal,
): Promise<CarScene> {
  if(signal.aborted)throw new DOMException("Scene loading was cancelled.","AbortError");
  const resources=new SceneResources();
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  const profile = createSceneProfile(renderer);
  const mode=getExperienceMode(),journeyMode=mode==="journey",scenicMode=mode==="scenic",landscapeMode=mode!=="city";
  const viewportReview=import.meta.env.DEV?new URLSearchParams(location.search).get('fixedViewportReview'):null;
  const fixedViewport=viewportReview==='off'?false:scenicMode||viewportReview!==null;
  const quality = new RenderQuality(devicePixelRatio, viewportReview==='low'?.85:1.35);
  const originalHostOverflow=host.style.overflow;
  const allocatedRatio=fixedViewport?quality.maximum:quality.ratio;
  renderer.setPixelRatio(allocatedRatio);
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  host.appendChild(renderer.domElement);
  function applyRenderRatio(ratio:number){
    if(!fixedViewport){renderer.setPixelRatio(ratio);return;}
    const fraction=ratio/allocatedRatio;
    renderer.setViewport(0,0,host.clientWidth*fraction,host.clientHeight*fraction);
    renderer.setScissor(0,0,host.clientWidth*fraction,host.clientHeight*fraction);
    renderer.setScissorTest(true);
    renderer.domElement.style.transformOrigin='bottom left';
    renderer.domElement.style.transform=`scale(${1/fraction})`;
    renderer.domElement.dataset.effectiveRatio=String(ratio);
    host.style.overflow='hidden';
  }
  if(fixedViewport)applyRenderRatio(quality.ratio);
  const screenLayer = document.createElement("div");
  screenLayer.className = "physical-screen-layer";
  host.appendChild(screenLayer);
  const screenElement = document.createElement("div");
  screenElement.className = "physical-screen";
  screenElement.hidden = true;
  screenElement.inert = true;
  screenLayer.appendChild(screenElement);
  let screenPixels = host.clientWidth <= 600 || host.clientHeight <= 500 ? 600 : LAPTOP_SCREEN.pixels;
  const screenCorner = new THREE.Vector3();
  const screenOpposite = new THREE.Vector3();
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute(
    "aria-label",
    "Porsche cabin. Drag or use arrow keys to look around. Use the site menu for keyboard access to objects.",
  );
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    48,
    host.clientWidth / host.clientHeight,
    0.015,
    450,
  );
  const body = new THREE.Group();
  const door = new THREE.Group();
  door.position.set(0.79, 0.5, 0.95);
  door.userData.artifact = "door";
  const vehicle = new THREE.Group();
  vehicle.name = "Porsche with cabin";
  vehicle.add(body, door);
  scene.add(vehicle);
  const hemisphere = new THREE.HemisphereLight(0x9ba9e2, 0x252130, .7);
  scene.add(hemisphere);
  const cabinFill = new THREE.PointLight(0xffe3bc, 0.45, 2.6, 1.3);
  cabinFill.position.set(0, 1.38, 0.3);
  vehicle.add(cabinFill);
  const sun = new THREE.DirectionalLight(0xa4b8f3, 1.1);
  sun.position.copy(SUN_DIRECTION).multiplyScalar(45);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -15,
    right: 15,
    top: 15,
    bottom: -15,
    near: 0.1,
    far: 95,
  });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 2.5;
  scene.add(sun);
  let disposed = false;
  let frame = 0;
  let requestRender = () => {};
  const road=scenicMode?scenicRoad:journeyMode?journeyRoad:cityRoad;
  const ROUTE_LENGTH=road.length,OVERLOOK_DISTANCE=road.cruiseStop;
  const crawlReview=import.meta.env.DEV && new URLSearchParams(location.search).has("crawlReview");
  const drive = scenicMode?(isTownJourney()?createTownDrive():createScenicDrive(crawlReview?1:undefined)):new CityDrive(road);
  const race=new ReturnRace(drive);
  if(scenicMode) drive.requireStop("lake");
  if(import.meta.env.DEV && landscapeMode){
    const reviewStop=new URLSearchParams(location.search).get('reviewStop');
    const stop=JOURNEY_STOPS.find(item=>item.id===reviewStop);
    if(stop&&(journeyMode||drive.accessRoads.some(access=>access.id===stop.id)))drive.reviewAt(stop.id);
  }
  if(import.meta.env.DEV && new URLSearchParams(location.search).has('hornReview')){
    drive.traffic.cars.splice(1);
    Object.assign(drive.traffic.cars[0],{distance:drive.distance+14,lane:drive.lane,direction:1,speed:0,targetSpeed:6});
  }
  const trafficReview=import.meta.env.DEV?new URLSearchParams(location.search).get('trafficReview'):null;
  let fastTrafficArmed=trafficReview==='head-on-fast';
  if(trafficReview==='head-on'||trafficReview==='head-on-fast'){
    drive.setAutomatic(false);
    drive.traffic.cars.splice(1);
    const fast=trafficReview==='head-on-fast';
    Object.assign(drive.traffic.cars[0],{distance:drive.distance+(fast?500:18),lane:drive.lane,direction:-1,speed:0,targetSpeed:fast?0:6});
  }
  const visit=new StopVisit();
  const coffee=journeyMode?createCoffeeCup():new THREE.Group();coffee.visible=false;coffee.position.set(-.25,.88,.64);vehicle.add(coffee);
  if(journeyMode){
  const holderMaterial=new THREE.MeshStandardMaterial({color:"#202724",roughness:.75});
  const cupRing=new THREE.Mesh(new THREE.TorusGeometry(.039,.004,8,24),holderMaterial);cupRing.rotation.x=Math.PI/2;cupRing.position.y=.035;coffee.add(cupRing);
  const cupBracket=new THREE.Mesh(new THREE.BoxGeometry(.07,.016,.13),holderMaterial);cupBracket.position.set(0,.006,.045);coffee.add(cupBracket);
  }
  let visitSignature="";
  let telemetryAt = 0;
  const sound = new CarAudio(
    () => host.dispatchEvent(new Event("car-audio-unavailable")),
    () => requestRender(),
  );
  let queuedAction: (() => void) | null = null;
  let previousDrivePhase: string = "off";
  let ignitionPlayed = false;
  let bodyLean = 0, bodyPitch = 0;
  let progress = 0;
  let approachTime = 0;
  let approaching = true;
  let repeatArrival=false;
  try{repeatArrival=sessionStorage.getItem("bryce-arrived")==="yes";}catch{}
  let entryTime = 0;
  let entryStart = 0;
  let arrivalPause = 0;
  let destination = 0;
  let moving = false;
  let preparingMotion=false;
  let last = performance.now();
  let yaw = 0,
    pitch = 0,
    targetYaw = 0,
    targetPitch = 0;
  const deviceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceOverride=readMotionPreference();
  const reducedMotion={get matches(){return reduceOverride||deviceMotion.matches;}};
  const raycaster = new THREE.Raycaster();
  let exteriorHit:ReturnType<typeof createExteriorPicker>|undefined;
  const pointer = new THREE.Vector2();
  let down: { x: number; y: number } | null = null;
  let dragDistance = 0;
  let artifacts: ReturnType<typeof addCabinArtifacts> | undefined;
  let laptopProgress = 0,
    laptopDestination = 0;
  let laptopPhase: LaptopPhase = "idle";
  let racketProgress = 0, racketDestination = 0;
  let cardProgress=0,cardDestination=0;
  let cardPrepared=false,cardPreparing=false,cardRequested=false;
  let afterPutDown: (() => void) | null = null;
  let revTime = 0;
  const lookMatrix = new THREE.Matrix4();
  const readingRotation = new THREE.Quaternion();

  function laptopState(phase: LaptopPhase) {
    laptopPhase = phase;
    screenElement.inert = phase !== "reading";
    renderer.domElement.tabIndex = phase === "idle" ? 0 : -1;
    host.dispatchEvent(new CustomEvent("car-laptop", { detail: phase }));
  }
  function putDownObject() {
    cardRequested=false;
    racketDestination = 0;cardDestination=0;
    if (reducedMotion.matches){racketProgress=0;cardProgress=0;renderer.shadowMap.needsUpdate=true;}
    requestRender();
  }
  function motionChanged(){
    if(reducedMotion.matches){
      if(approaching&&!moving){approaching=false;progress=.56;}
      if(moving)progress=destination;
      laptopProgress=laptopDestination;racketProgress=racketDestination;cardProgress=cardDestination;renderer.shadowMap.needsUpdate=true;
      yaw=targetYaw;pitch=targetPitch;bodyLean=bodyPitch=0;
    }
    requestRender();
  }
  deviceMotion.addEventListener('change',motionChanged);
  function putAwayThen(action: () => void) {
    if (laptopPhase === "idle" && racketProgress === 0 && racketDestination === 0 && cardProgress===0 && cardDestination===0) return false;
    afterPutDown = action;
    closeLaptop();
    putDownObject();
    return true;
  }
  function rev() {
    if (progress !== 1 || drive.phase !== "parked") return;
    sound.unlock();
    sound.rev();
    drive.rev();
    revTime = 2.5;
    requestRender();
  }
  function openLaptop() {
    cardRequested=false;
    if (moving || progress !== 1 || laptopPhase !== "idle" || arrivalPause > 0)
      return;
    if (
      drive.phase === "driving" ||
      drive.phase === "parking" ||
      drive.phase === "starting"
    ) {
      queuedAction = openLaptop;
      drive.park();
      requestRender();
      return;
    }
    if (putAwayThen(openLaptop)) return;
    down = null;
    targetYaw = yaw;
    targetPitch = pitch;
    laptopDestination = 1;
    laptopState("opening");
    clearHover();
    if (reducedMotion.matches) laptopProgress = 1;
    requestRender();
  }
  function closeLaptop() {
    if (laptopPhase !== "reading" && laptopPhase !== "opening") return;
    laptopDestination = 0;
    laptopState("closing");
    if (reducedMotion.matches) laptopProgress = 0;
    requestRender();
  }
  function openMap() {
    cardRequested=false;
    if((!journeyMode&&!isTownJourney()) || visit.phase!=="idle" || moving || progress!==1)return;
    if(drive.phase==="driving" || drive.phase==="starting" || drive.phase==="parking"){
      queuedAction=openMap;drive.park();requestRender();return;
    }
    if(putAwayThen(openMap))return;
    clearHover();
    renderer.domElement.focus({preventScroll:true});
    host.dispatchEvent(new Event("car-map"));
  }
  function inspect(item: CabinObject) {
    cardRequested=item==='card';
    if (moving) return;
    if (
      drive.phase === "driving" ||
      drive.phase === "parking" ||
      drive.phase === "starting"
    ) {
      queuedAction = () => inspect(item);
      drive.park();
      requestRender();
      return;
    }
    if (putAwayThen(() => inspect(item))) return;
    if(item==='card'&&!cardPrepared&&!reducedMotion.matches){
      if(!cardPreparing){
        cardPreparing=true;
        const finish=()=>{cardPrepared=true;cardPreparing=false;if(cardRequested&&!disposed&&!moving&&progress===1)inspect(item);};
        void prepareShadows('object').then(finish,finish);
      }
      return;
    }
    if(item==="card"){cardDestination=1;if(reducedMotion.matches){cardProgress=1;renderer.shadowMap.needsUpdate=true;}clearHover();requestRender();}
    if (item === "racket") {
      racketDestination = 1;
      if (reducedMotion.matches) racketProgress = 1;
      clearHover();
      requestRender();
    }
    host.dispatchEvent(new CustomEvent("car-artifact", { detail: item }));
  }

  const rendererSize=new THREE.Vector2();
  function resize() {
    const width=host.clientWidth,height=host.clientHeight;
    renderer.getSize(rendererSize);
    if(width<=0||height<=0||(width===rendererSize.x&&height===rendererSize.y))return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height);
    if(fixedViewport)applyRenderRatio(quality.ratio);
    const pixels = screenPixels = width <= 600 || height <= 500 ? 600 : LAPTOP_SCREEN.pixels;
    screenElement.style.width = `${pixels}px`;
    screenElement.style.height = `${(pixels * LAPTOP_SCREEN.height) / LAPTOP_SCREEN.width}px`;
    requestRender();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  async function prepareShadows(phase:'entry'|'ignition'|'object'){
    profile.stage(`${phase}-shadow-preparing`);
    renderer.shadowMap.needsUpdate=true;
    renderer.render(scene,camera);
    await waitForGpu(renderer.getContext(),signal).catch(()=>false);
    if(!disposed)profile.stage(`${phase}-shadow-ready`);
  }
  async function enter() {
    if (moving || preparingMotion || progress === 1 || (visit.phase!=="idle"&&visit.phase!=="entering")) return;
    preparingMotion=true;
    sound.unlock();
    approaching=false;
    host.dispatchEvent(new Event("car-enter"));
    try{if(!reducedMotion.matches)await prepareShadows('entry');}
    finally{preparingMotion=false;}
    if(disposed)return;
    sound.door(true);
    approaching = false;
    entryTime = 0;
    entryStart = progress;
    if(scenicMode && drive.phase==='off'){const look=cabinDiscoveryLook(camera.aspect);targetYaw=look.yaw;targetPitch=look.pitch;}
    destination = 1;
    moving = true;
    last=performance.now();
    if (reducedMotion.matches) progress = 1;
    requestRender();
  }
  function exit() {
    cardRequested=false;
    if (moving || preparingMotion || progress === 0) return;
    if (putAwayThen(exit)) return;
    if (
      drive.phase === "driving" ||
      drive.phase === "parking" ||
      drive.phase === "starting"
    ) {
      queuedAction = exit;
      drive.park();
      requestRender();
      return;
    }
    sound.door(true);
    destination = 0.56;
    moving = true;
    host.dispatchEvent(new Event("car-exit"));
    if (reducedMotion.matches) progress = 0.56;
    requestRender();
  }
  let ignitionAllowed = !scenicMode;
  async function startDrive() {
    if (!ignitionAllowed || race.active) return;
    if (
      progress !== 1 || preparingMotion ||
      visit.phase!=="idle" ||
      moving ||
      drive.phase === "driving" ||
      drive.phase === "starting" ||
      drive.phase === "parking"
    )
      return;
    sound.unlock();
    preparingMotion=true;
    try{if(!reducedMotion.matches)await prepareShadows('ignition');}
    finally{preparingMotion=false;}
    if(disposed)return;
    last=performance.now();
    renderer.domElement.focus({ preventScroll: true });
    queuedAction = null;
    ignitionPlayed = false;
    drive.start();
    targetYaw = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2;
    targetPitch = 0;
    afterPutDown = null;
    closeLaptop();
    putDownObject();
    clearHover();
    requestRender();
    host.dispatchEvent(
      new CustomEvent("car-drive", {
        detail: { phase: drive.phase, overlook: false },
      }),
    );
  }
  function pointerDown(e: PointerEvent) {
    if (
      moving ||
      (laptopPhase !== "idle" && laptopPhase !== "reading") ||
      !e.isPrimary ||
      e.button !== 0
    )
      return;
    down = { x: e.clientX, y: e.clientY };
    dragDistance = 0;
    renderer.domElement.focus({ preventScroll: true });
    renderer.domElement.setPointerCapture(e.pointerId);
  }
  function pointedObject(e: PointerEvent) {
    const rect = (fixedViewport?host:renderer.domElement).getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    if(progress<1)return exteriorHit?.(raycaster.ray)?"door":undefined;
    return pickArtifact(raycaster.intersectObject(vehicle));
  }
  function clearHover() {
    host.dispatchEvent(new CustomEvent("car-hover", { detail: null }));
  }
  function pointerMove(e: PointerEvent) {
    if (moving) return;
    if (progress !== 1) {
      if (!down) {
        const id = pointedObject(e);
        renderer.domElement.style.cursor = id ? "pointer" : "default";
        host.dispatchEvent(
          new CustomEvent("car-hover", {
            detail: id
              ? { label: "Open door", x: e.clientX, y: e.clientY }
              : null,
          }),
        );
      }
      return;
    }
    if (laptopPhase !== "idle" && laptopPhase !== "reading") return;
    if (!down) {
      const id = pointedObject(e);
      const labels: Record<string, string> = {
        laptop: "Open laptop",
        racket: "Pick up tennis racket",
        journal: "See the photo board",
        map: "Unfold the route map",
        card: "Read contact card",
        door: "Open door",
        ignition: "Turn the key",
      };
      renderer.domElement.style.cursor = id ? "pointer" : "grab";
      host.dispatchEvent(
        new CustomEvent("car-hover", {
          detail: id ? { label: labels[id], x: e.clientX, y: e.clientY } : null,
        }),
      );
      return;
    }
    if (laptopPhase !== "idle") return;
    clearHover();
    dragDistance += Math.hypot(e.clientX - down.x, e.clientY - down.y);
    targetYaw -= (e.clientX - down.x) * 0.004;
    targetPitch = THREE.MathUtils.clamp(
      targetPitch + (e.clientY - down.y) * 0.003,
      -0.55,
      0.55,
    );
    down = { x: e.clientX, y: e.clientY };
    requestRender();
  }
  function pointerUp(e: PointerEvent) {
    if (
      !moving &&
      down &&
      dragDistance < 10 &&
      Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10
    ) {
      const rect = (fixedViewport?host:renderer.domElement).getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      if (progress < 1 && exteriorHit?.(raycaster.ray)) enter();
      if (progress === 1 && artifacts) {
        const id = pointedObject(e);
        clearHover();
        if (id === "ignition") startDrive();
        else if (id === "door") exit();
        else if (id === "laptop") openLaptop();
        else if (id === "map") openMap();
        else if (id === "journal" || id === "card" || id === "racket") inspect(id);
      }
    }
    down = null;
    if (renderer.domElement.hasPointerCapture(e.pointerId))
      renderer.domElement.releasePointerCapture(e.pointerId);
  }
  renderer.domElement.addEventListener("pointerdown", pointerDown);
  renderer.domElement.addEventListener("pointermove", pointerMove);
  renderer.domElement.addEventListener("pointerup", pointerUp);
  renderer.domElement.addEventListener("pointercancel", () => {
    down = null;
  });
  renderer.domElement.addEventListener("pointerleave", clearHover);
  function shift(direction:-1|1) {
    drive.shift(direction);
    renderer.domElement.focus({preventScroll:true});
    requestRender();
  }
  let hornCount=0,lastHornEgg=0;
  function honk(){if(performance.now()-lastHornEgg>500){lastHornEgg=performance.now();hornCount++;if(hornCount===3)host.dispatchEvent(new CustomEvent("car-egg",{detail:"Three honks. You’re officially comfortable in someone else’s car."}));}sound.honk();const acknowledged=drive.phase!=="off"&&drive.traffic.honk(drive.pose());profile.stage(acknowledged?"horn-acknowledged":"horn-no-response");requestRender();}
  function keyDown(e: KeyboardEvent) {
    if(e.metaKey||e.ctrlKey||e.altKey)return;
    if (race.state.phase==="countdown")return;
    if (progress !== 1 || moving || document.querySelector("dialog[open]")) {
      if (progress < 1 && e.key === "Enter") enter();
      return;
    }
    if(e.code === "KeyH"){e.preventDefault();if(!e.repeat)honk();return;}
    if(e.code === "KeyC"){e.preventDefault();if(!e.repeat)drive.setSpeedHold(drive.speedHold===null);return;}
    if (e.code === "KeyQ" || e.code === "KeyE") {
      e.preventDefault();if(!e.repeat)shift(e.code === "KeyQ" ? -1 : 1);return;
    }
    if (e.code === "KeyK") {
      e.preventDefault();
      startDrive();
      return;
    }
    if (
      drive.phase === "driving" ||
      drive.phase === "parking" ||
      drive.phase === "starting"
    ) {
      const keys: Record<string, DriveInput> = {
        ArrowLeft: "left",
        KeyA: "left",
        ArrowRight: "right",
        KeyD: "right",
        ArrowUp: "gas",
        KeyW: "gas",
        ArrowDown: "brake",
        KeyS: "brake",
      };
      if (keys[e.code]) {
        e.preventDefault();
        drive.input(keys[e.code],true);
      }
      if (e.code === "Space") {
        e.preventDefault();
        drive.park();
      }
      return;
    }
    if (laptopPhase !== "idle") return;
    const direction: Record<string, [number, number]> = {
      ArrowLeft: [0.15, 0],
      ArrowRight: [-0.15, 0],
      ArrowUp: [0, 0.1],
      ArrowDown: [0, -0.1],
    };
    const change = direction[e.key];
    if (!change) return;
    e.preventDefault();
    targetYaw += change[0];
    targetPitch = THREE.MathUtils.clamp(targetPitch + change[1], -0.55, 0.55);
    clearHover();
    requestRender();
  }
  renderer.domElement.addEventListener("keydown", keyDown);
  function keyUp(e: KeyboardEvent) {
    const keys: Record<string, DriveInput> = {
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
      ArrowUp: "gas",
      KeyW: "gas",
      ArrowDown: "brake",
      KeyS: "brake",
    };
    if (keys[e.code]) drive.controls[keys[e.code]] = false;
  }
  function blur() {
    down = null;
    drive.clearInput();
  }
  function visibility() {
    blur();
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      sound.suspend();
    } else {
      last = performance.now();
      sound.resume();
      requestRender();
    }
  }
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);

  let compiling=false;
  function contextLost(){
    if(disposed)return;
    dispose();
    host.dispatchEvent(new Event('car-unavailable'));
  }
  function releaseRenderer(){
    resources.object(scene);
    resources.dispose();
    renderer.dispose();
    if(!renderer.getContext().isContextLost())renderer.forceContextLoss();
    profile.dispose();
  }
  function dispose() {
    if(disposed)return;
    disposed = true;
    renderer.domElement.removeEventListener('webglcontextlost',contextLost);
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener("keyup", keyUp);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", visibility);
    deviceMotion.removeEventListener('change',motionChanged);
    sound.dispose();
    // compileAsync polls shader programs, so they must outlive its final readiness check.
    if(!compiling)releaseRenderer();
    renderer.domElement.remove();
    if(fixedViewport)host.style.overflow=originalHostOverflow;
    screenLayer.remove();
    signal.removeEventListener("abort", dispose);
  }
  signal.addEventListener("abort", dispose, { once: true });

  try {
    const [gltf, env, cabinMaterials, forest] = await Promise.all([
      new GLTFLoader().loadAsync("/models/entrance/porsche-1975.glb").then(gltf=>{resources.object(gltf.scene);resources.assertActive();return gltf;}),
      Promise.resolve().then(() => {
        resources.assertActive();
        const generator=new THREE.PMREMGenerator(renderer);
        const room=new RoomEnvironment();
        const target=resources.track(generator.fromScene(room,.04));
        room.dispose();generator.dispose();
        return target.texture;
      }),
      loadCabinMaterials(resources),
      landscapeMode?createJourneyWorld(scene,resources,renderer,signal,scenicMode,profile.stage):createCityWorld(scene,resources),
    ]);
    resources.assertActive();
    profile.stage("assets-ready");host.dispatchEvent(new CustomEvent("car-loading",{detail:1}));
    scene.environment = env;
    scene.environmentIntensity = .48;
    const { leather, wood } = cabinMaterials;
    const changed = new Set<THREE.Material>();
    gltf.scene.updateMatrixWorld(true);
    const sourceMeshes:THREE.Mesh[]=[];
    gltf.scene.traverse(object=>{if(object instanceof THREE.Mesh)sourceMeshes.push(object);});
    let firstCarPart=true;
    await loadingBatches(sourceMeshes,mesh=>{
      const material = mesh.material as THREE.MeshStandardMaterial;
      // The source contains a baked ground card. Use real scene shadows instead.
      if (material.name === "material_0") return;
      if (!changed.has(material)) {
        if (material.name === "paint" || material.name === "coat") {
          material.color.set("#364b29");
          material.metalness = 0.3;
          material.roughness = 0.4;
          material.envMapIntensity = 0.65;
          material.map = null;
        }
        if (material.name === "glass") {
          material.transparent = true;
          material.opacity = 0.13;
          material.depthWrite = false;
          material.roughness = 0.08;
        }
        if (material.name === "black") {
          material.color.set("#302b24");
          material.roughness = 0.78;
        }
        changed.add(material);
      }
      addCarParts(mesh, body, door, leather, wood);
      resources.release(mesh.geometry);
      if(firstCarPart){firstCarPart=false;profile.stage('car-parts-started');}
    },signal);
    resources.assertActive();
    profile.stage('car-parts-ready');
    const instruments = addCabinDetails(vehicle, cabinMaterials);
    addDoorInterior(door, leather);
    artifacts = addCabinArtifacts(vehicle, () => requestRender(), journeyMode,scenicMode);
    const ignition = addIgnition(vehicle);
    exteriorHit=createExteriorPicker(vehicle);
    profile.stage('cabin-ready');

    const finishLine=createRaceFinishLine(road);forest.group.add(finishLine);resources.object(finishLine);
    const trafficMeshes=createTrafficMeshes(forest.group,drive.traffic);
    scene.add(sun.target);
    if (reducedMotion.matches||repeatArrival) {
      progress = 0.56;
      approaching = false;
    }
    const reviewTreeBudget=import.meta.env.DEV&&new URLSearchParams(location.search).get('treeDetailReview')==='2'?2:null;
    function updateWorld(){
      const warmth = forest.update(vehicle.position,camera.position,reviewTreeBudget??quality.treeBudget);
      sun.position.copy(vehicle.position).addScaledVector(SUN_DIRECTION, 45);
      sun.target.position.copy(vehicle.position);
      sun.intensity = landscapeMode?1+warmth*1.2:1.1;
      if(landscapeMode){sun.color.setRGB(1,.68+warmth*.2,.5+warmth*.28);hemisphere.intensity=.5+warmth*.25;}
    }
    const motionPhaseNow=()=>moving?(destination===1?'entry':'exit'):approaching?'approach':laptopPhase==='opening'||laptopPhase==='closing'||racketProgress!==racketDestination||cardProgress!==cardDestination?'object':drive.phase==='starting'?'ignition':drive.phase==='parking'?'parking':null;
    function render(now: number) {
      if (disposed) return;
      frame = 0;
      const profileStart = profile.begin();
      const frameInterval = now - last;
      const motionPhase=motionPhaseNow();
      // Resizing the drawing buffer during the short camera transition causes a visible hitch.
      const previousTreeBudget=quality.treeBudget;
      const nextRatio = quality.sample(frameInterval, !document.hidden && !moving && !approaching && (drive.phase === "driving" || drive.phase === "parking" || drive.phase === "starting" || Math.abs(yaw-targetYaw) > .0001 || Math.abs(pitch-targetPitch) > .0001));
      if(previousTreeBudget!==quality.treeBudget)profile.stage(`tree-detail-${quality.treeBudget}`);
      if (nextRatio !== null) {applyRenderRatio(nextRatio);profile.stage(`canvas-ratio-${nextRatio}`);}
      profile.mark('quality-resize');
      const dt = Math.min((now - last) / 1000, 0.15);
      last = now;
      arrivalPause = Math.max(0, arrivalPause - dt);
      if (approaching && !moving) {
        approachTime += dt;
        progress = 0.56 * Math.min(1,approachTime / 4.8);
        if (approachTime >= 4.8) approaching = false;
      }
      if (moving) {
        if (destination === 1) {
          entryTime += dt;
          if (!reducedMotion.matches)
            progress = THREE.MathUtils.lerp(
              entryStart,
              1,
              smooth(Math.max(0, entryTime - 0.85) / 4.8),
            );
        } else progress = Math.max(0.56, progress - dt / 5.2);
        if (progress === destination) {
          moving = false;
          arrivalPause = 0.45;
          if (destination !== 1) yaw = pitch = targetYaw = targetPitch = 0;
          else {
            renderer.domElement.focus({ preventScroll: true });
            sound.door(false);
          }
          clearHover();
          onArrival(destination === 1);
          if(destination===1)visit.seated();
        }
      }
      const startupReady =
        laptopPhase === "idle" && racketProgress === 0 && cardProgress===0 &&
        Math.abs(yaw - targetYaw) < 0.04 &&
        Math.abs(pitch - targetPitch) < 0.03;
      if (drive.phase === "starting" && startupReady && !ignitionPlayed && !drive.engineOn) {
        sound.ignite();
        ignitionPlayed = true;
      }
      race.update(now);
      drive.update(dt*(crawlReview&&drive.phase==="parking"?.2:1), startupReady, reducedMotion.matches);
      if(fastTrafficArmed&&drive.speed>=15){
        fastTrafficArmed=false;
        Object.assign(drive.traffic.cars[0],{distance:drive.distance+65,lane:drive.lane,direction:-1,speed:18,targetSpeed:18});
        renderer.domElement.dataset.trafficEncounter=JSON.stringify({playerKmh:drive.speed*3.6,oncomingKmh:64.8,gapMetres:65});
      }
      finishLine.visible=race.state.phase!=="idle";
      trafficMeshes.update();
      profile.mark('simulation');
      if (previousDrivePhase !== drive.phase) {
        previousDrivePhase = drive.phase;
        // A reduced-motion arrival can be the last frame before the scene idles.
        telemetryAt = -Infinity;
        const atOverlook =
          Math.abs(
            THREE.MathUtils.euclideanModulo(drive.distance, ROUTE_LENGTH) -
              OVERLOOK_DISTANCE,
          ) < 10;
        host.dispatchEvent(
          new CustomEvent("car-drive", {
            detail: { phase: drive.phase, overlook: atOverlook },
          }),
        );
        if (drive.phase === "parked" && queuedAction) {
          const action = queuedAction;
          queuedAction = null;
          action();
        } else if (drive.phase === "parked") {
          if(scenicMode&&drive.stoppedAt){
            const view=drive.stoppedAt==="lake"?scenicLakeFrame.point:drive.access!.place;
            const parked=drive.pose(),relative=Math.atan2(view.x-parked.point.x,view.z-parked.point.z)-parked.yaw;
            const toward=drive.stoppedAt!=="lake"&&camera.aspect>1.1?Math.atan2(Math.sin(relative),Math.cos(relative))*.8:relative;
            targetYaw=yaw+Math.atan2(Math.sin(toward-yaw),Math.cos(toward-yaw));targetPitch=.1;
            if(reducedMotion.matches){yaw=targetYaw;pitch=targetPitch;}
          }
          renderer.domElement.focus({ preventScroll: true });
        }
      }
      const travel = drive.pose();
      vehicle.position.copy(travel.point);
      const ahead = drive.ahead(3);
      const curvature = Math.atan2(Math.sin(ahead.yaw-travel.yaw),Math.cos(ahead.yaw-travel.yaw))/3;
      const acceleration = THREE.MathUtils.clamp(drive.acceleration,-5,3.5);
      bodyLean = THREE.MathUtils.damp(bodyLean,reducedMotion.matches ? 0 : THREE.MathUtils.clamp((curvature*drive.speed*drive.speed + drive.heading*drive.speed)*.0015,-.018,.018),4,dt);
      bodyPitch = THREE.MathUtils.damp(bodyPitch,reducedMotion.matches ? 0 : acceleration*.0016,4,dt);
      vehicle.rotation.set(-travel.slope+bodyPitch, travel.yaw, bodyLean, "YXZ");
      ignition.update(
        drive.phase === "starting" && ignitionPlayed ? Math.min(1, drive.startup * 2) : 0,
        progress,
      );
      revTime = Math.max(0, revTime - dt);
      const engineState = sound.update(
        drive.speed,
        drive.engineOn,
        progress,
        drive.controls.gas, drive.controls.brake, dt, drive.engineState,
      );
      if (now-telemetryAt>100) {
        telemetryAt=now;
        host.dispatchEvent(new CustomEvent('car-race',{detail:{...race.state}}));
        host.dispatchEvent(new CustomEvent('car-telemetry',{detail:{speed:Math.round(drive.speed*3.6),rpm:Math.round(engineState.rpm/50)*50,gear:engineState.gear,approach:drive.requiredApproach,automatic:drive.automatic,turbo:drive.turbo,speedHold:drive.speedHold,collision:drive.collisionTime>0,distance:drive.distance,x:drive.position.x,z:drive.position.z,stop:drive.stoppedAt,engineOn:drive.engineOn}}));
      }
      instruments.update(drive.speed, drive.steering + (drive.phase==="driving"?THREE.MathUtils.clamp(curvature*6,-.4,.4):0), drive.engineOn, engineState.rpm);
      profile.mark('audio-instruments');
      if (drive.engineOn) renderer.shadowMap.needsUpdate = true;
      if (laptopPhase === "opening" || laptopPhase === "closing") {
        laptopProgress = THREE.MathUtils.clamp(
          laptopProgress + ((laptopDestination ? 1 : -1) * dt) / 2.6,
          0,
          1,
        );
        renderer.shadowMap.needsUpdate = true;
        if (laptopProgress === laptopDestination) {
          laptopState(laptopDestination ? "reading" : "idle");
          if (!laptopDestination && !afterPutDown)
            renderer.domElement.focus({ preventScroll: true });
        }
      }
      if (racketProgress !== racketDestination) {
        racketProgress = THREE.MathUtils.clamp(racketProgress + (racketDestination ? 1 : -1) * dt / 1.25, 0, 1);
        renderer.shadowMap.needsUpdate = true;
      }
      if(cardProgress!==cardDestination){
        cardProgress=THREE.MathUtils.clamp(cardProgress+(cardDestination?1:-1)*dt/1.1,0,1);
        renderer.shadowMap.needsUpdate=true;
      }
      if (afterPutDown && laptopPhase === "idle" && racketProgress === 0 && cardProgress===0) {
        const action = afterPutDown;
        afterPutDown = null;
        action();
      }
      artifacts!.update(laptopProgress, racketProgress,cardProgress);
      yaw = reducedMotion.matches?targetYaw:THREE.MathUtils.damp(yaw, targetYaw, 8, dt);
      pitch = reducedMotion.matches?targetPitch:THREE.MathUtils.damp(pitch, targetPitch, 8, dt);
      const pose = cameraPose(progress, camera.aspect, yaw, pitch);
      const worldPosition = vehicle.localToWorld(pose.position);
      const worldTarget = vehicle.localToWorld(pose.target);
      camera.fov = pose.fov;
      camera.position.copy(worldPosition);
      camera.lookAt(worldTarget);
      if (laptopProgress > 0) {
        const reading = readingPose(camera.aspect);
        vehicle.localToWorld(reading.position);
        vehicle.localToWorld(reading.target);
        const weight = laptopPose(laptopProgress).cameraWeight;
        camera.position.lerp(reading.position, weight);
        lookMatrix.lookAt(reading.position, reading.target, camera.up);
        readingRotation.setFromRotationMatrix(lookMatrix);
        camera.quaternion.slerp(readingRotation, weight);
        camera.fov = THREE.MathUtils.lerp(pose.fov, reading.fov, weight);
      }
      if (racketProgress > 0 || cardProgress>0) {
        const reading = cardProgress>0?contactCardReadingPose(camera.aspect):racketReadingPose(camera.aspect);
        vehicle.localToWorld(reading.position);
        vehicle.localToWorld(reading.target);
        const weight = cardProgress>0?contactCardPose(cardProgress,scenicMode).cameraWeight:racketPose(racketProgress).cameraWeight;
        camera.position.lerp(reading.position, weight);
        lookMatrix.lookAt(reading.position, reading.target, camera.up);
        readingRotation.setFromRotationMatrix(lookMatrix);
        camera.quaternion.slerp(readingRotation, weight);
        camera.fov = THREE.MathUtils.lerp(pose.fov, reading.fov, weight);
      }
      if(visit.phase==='leaving' && !moving && progress===.56)visit.outside(camera.position,worldTarget);
      const previousVisitPhase=visit.phase;
      visit.update(dt,reducedMotion.matches);
      if(visit.phase==='walking'||visit.phase==='exploring'||visit.phase==='returning'){
        const walking=visit.pose()!;camera.position.copy(walking.position);camera.lookAt(walking.target);camera.fov=THREE.MathUtils.lerp(pose.fov,62,THREE.MathUtils.smoothstep(visit.progress,0,1));
      }
      if(visit.phase==='entering'&&previousVisitPhase!=='entering')enter();
      coffee.visible=visit.hasCoffee && (visit.phase==='idle'||visit.phase==='entering');
      if('setCoffee' in forest)forest.setCoffee(visit.hasCoffee && visit.stop==='cafe' && visit.phase==='exploring');
      sound.forest(visit.stop==='trailhead' && visit.phase!=='idle' && visit.phase!=='entering');
      const signature=visit.phase+visit.hasCoffee+visit.stop;
      if(signature!==visitSignature){visitSignature=signature;host.dispatchEvent(new CustomEvent('car-visit',{detail:{phase:visit.phase,coffee:visit.hasCoffee,stop:visit.stop}}));}
      camera.updateProjectionMatrix();
      profile.mark('camera-objects');
      updateWorld();
      profile.mark('world');
      const doorAngle = moving
        ? destination === 1
          ? -1.05 *
            smooth(entryTime / 0.8) *
            (1 - smooth((progress - 0.94) / 0.06))
          : pose.doorAngle
        : 0;
      if (Math.abs(door.rotation.y - doorAngle) > 0.0001)
        renderer.shadowMap.needsUpdate = true;
      door.rotation.y = doorAngle;
      profile.gpuBegin();
      renderer.render(scene, camera);
      profile.gpuEnd();
      profile.mark('draw');
      profile.end(profileStart, frameInterval, drive.distance, drive.phase === "driving");
      profile.motion(motionPhase,frameInterval,performance.now()-profileStart,now);
      if(motionPhase!==motionPhaseNow())profile.motion(motionPhaseNow(),0);
      screenElement.hidden = laptopPhase !== "reading";
      if (laptopPhase === "reading") {
        // The reading camera faces the display squarely. Project its corners into a flat, clickable DOM surface.
        screenCorner.set(-LAPTOP_SCREEN.width/2,LAPTOP_SCREEN.height/2,0).applyMatrix4(artifacts!.screen.matrixWorld).project(camera);
        screenOpposite.set(LAPTOP_SCREEN.width/2,-LAPTOP_SCREEN.height/2,0).applyMatrix4(artifacts!.screen.matrixWorld).project(camera);
        const left = (screenCorner.x+1)*host.clientWidth/2;
        const top = (1-screenCorner.y)*host.clientHeight/2;
        const width = (screenOpposite.x-screenCorner.x)*host.clientWidth/2;
        screenElement.style.width = `${screenPixels}px`;
        screenElement.style.height = `${screenPixels*LAPTOP_SCREEN.height/LAPTOP_SCREEN.width}px`;
        screenElement.style.transform = `translate(${left}px,${top}px) scale(${width/screenPixels})`;
      }
      if (
        Math.abs(bodyPitch) > .00001 || Math.abs(bodyLean) > .00001 ||
        revTime > 0 || (!drive.engineOn && drive.engineState.rpm > 1) || racketProgress !== racketDestination || cardProgress!==cardDestination ||
        race.active || arrivalPause > 0 ||
        approaching ||
        visit.phase!=="idle" ||
        moving ||
        drive.phase === "starting" ||
        drive.phase === "driving" ||
        drive.phase === "parking" ||
        laptopPhase === "opening" ||
        laptopPhase === "closing" ||
        Math.abs(yaw - targetYaw) > 0.0001 ||
        Math.abs(pitch - targetPitch) > 0.0001
      )
        requestRender();
    }
    requestRender = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(render);
    };
    const initialTravel=drive.pose();
    vehicle.position.copy(initialTravel.point);
    vehicle.rotation.set(-initialTravel.slope,initialTravel.yaw,0,"YXZ");
    vehicle.updateMatrixWorld(true);
    profile.watch(scene);
    function prepareView(value:number){
      const pose=cameraPose(value,camera.aspect,0,0);
      camera.position.copy(vehicle.localToWorld(pose.position));
      camera.lookAt(vehicle.localToWorld(pose.target));
      camera.fov=pose.fov;camera.updateProjectionMatrix();
      door.rotation.y=value>.56&&value<1?-1.05:0;
      updateWorld();
    }
    prepareView(progress);
    profile.stage("scene-prepared");
    compiling=true;
    profile.stage('compiling');
    try{
      const compilation=renderer.compileAsync(scene,camera);
      profile.stage('shaders-submitted');
      await compilation;
    }
    finally{compiling=false;if(disposed)releaseRenderer();}
    resources.assertActive();
    profile.stage('compiled');
    await warmTextures(scene,renderer,signal);
    resources.assertActive();
    profile.stage('textures-uploaded');
    // Upload off-camera road buffers too, before entry turns them into view.
    const culledObjects:THREE.Object3D[]=[];
    scene.traverse(object=>{if((object instanceof THREE.Mesh||object instanceof THREE.Line||object instanceof THREE.Points||object instanceof THREE.Sprite)&&object.frustumCulled){culledObjects.push(object);object.frustumCulled=false;}});
    try{
      prepareView(1);renderer.shadowMap.needsUpdate=true;
      withFirstDrawObjects(scene,()=>renderer.render(scene,camera));
      profile.stage('warmup-seat');host.dispatchEvent(new CustomEvent('car-loading',{detail:2}));
    }finally{for(const object of culledObjects)object.frustumCulled=true;}
    for(const view of [.72,progress]){
      prepareView(view);renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);
      profile.stage(view===.72?'warmup-entry':'warmup-outside');
    }
    profile.stage('gpu-wait-started');host.dispatchEvent(new CustomEvent('car-loading',{detail:3}));
    const gpuReady=await waitForGpu(renderer.getContext(),signal);
    resources.assertActive();profile.stage(gpuReady?"gpu-settled":"gpu-wait-ended");
    profile.stage("ready");
    if (!disposed) {
      renderer.domElement.addEventListener('webglcontextlost',contextLost);
      last = performance.now();
      onReady();
      requestRender();
    }
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    startRace(){
      if(progress!==1||moving||laptopPhase!=="idle"||!ignitionAllowed)return false;
      sound.unlock();const started=race.start(performance.now());
      if(started){targetYaw=0;targetPitch=0;sound.ignite();renderer.domElement.focus({preventScroll:true});requestRender();}
      return started;
    },
    cancelRace(){race.cancel();requestRender();},
    enter,
    exit,
    visitTrail() {
      if(!journeyMode || drive.phase!=="parked" || drive.stoppedAt!=="trailhead" || moving || laptopPhase!=="idle")return;
      if(!visit.begin("trailhead"))return;drive.engineOn=false;drive.clearInput();exit();requestRender();
    },
    visitCafe() {
      if(!journeyMode || drive.phase!=="parked" || drive.stoppedAt!=="cafe" || moving || laptopPhase!=="idle")return;
      if(!visit.begin("cafe"))return;drive.engineOn=false;drive.clearInput();exit();requestRender();
    },
    returnToCar() {visit.back();requestRender();},
    orderCoffee() {visit.order();requestRender();},
    openMap,
    navigate(id) {if(race.active)race.cancel();drive.navigate(stopDistance(id));if(drive.phase!=="driving")startDrive();requestRender();},
    openLaptop,
    closeLaptop,
    inspect,
    putDownObject,
    rev,
    screenElement,
    ringCall(){sound.ringCall();},
    stopCall(){sound.stopCall();},
    setMusic(enabled){sound.setMusic(enabled);},
    startDrive,
    allowIgnition() { ignitionAllowed = true; renderer.domElement.focus({preventScroll:true}); },
    stopEngine(){if(race.active)return;if(drive.stopEngine()){telemetryAt=0;requestRender();}},
    honk(){honk();renderer.domElement.focus({preventScroll:true});},
    setSpeedHold(enabled){drive.setSpeedHold(enabled);renderer.domElement.focus({preventScroll:true});requestRender();},
    setTurbo(enabled){if(race.active)return;drive.setTurbo(enabled);renderer.domElement.focus({preventScroll:true});requestRender();},
    setCruise(enabled) {if(race.active)return;drive.setAutomatic(enabled);renderer.domElement.focus({preventScroll:true});requestRender();},
    shift,
    park: () => {
      drive.park();
      requestRender();
    },
    input: (key, pressed) => {
      if(visit.phase!=="idle"||race.state.phase==="countdown")return;
      drive.input(key,pressed);
      requestRender();
    },
    mute: (value) => sound.setMuted(value),
    volume: (value) => sound.setVolume(value),
    reduceMotion(value){reduceOverride=value;motionChanged();},
    skipApproach: () => {
      approaching = false;
      progress = 0.56;
      requestRender();
    },
    look: (x, y) => {
      targetYaw += x;
      targetPitch = THREE.MathUtils.clamp(targetPitch + y, -0.55, 0.55);
      requestRender();
    },
    center: () => {
      targetYaw = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2;
      targetPitch = 0;
      requestRender();
    },
    dispose,
  };
}
