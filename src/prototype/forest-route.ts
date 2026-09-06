import { CatmullRomCurve3, MathUtils, Vector3 } from "three";

export const roadCurve = new CatmullRomCurve3(
  [
    [0, 0, 0],
    [0, 0.4, 45],
    [-14, 2, 90],
    [12, 3.5, 140],
    [40, 5, 175],
    [22, 7, 220],
    [-15, 10, 245],
    [-48, 11, 250],
    [-78, 10, 220],
    [-90, 7, 160],
    [-70, 3, 90],
    [-65, 1, 25],
    [-40, 0, -35],
    [-5, 0, -30],
  ].map((p) => new Vector3(...(p as [number, number, number]))),
  true,
  "centripetal",
);
roadCurve.arcLengthDivisions = 1200;
export const ROUTE_LENGTH = roadCurve.getLength();
const overlook = new Vector3(-48, 11, 250);
export const ROAD_SAMPLES = Array.from({ length: 601 }, (_, i) => ({
  point: roadCurve.getPointAt(i / 600),
  distance: (i / 600) * ROUTE_LENGTH,
}));
export const OVERLOOK_DISTANCE = ROAD_SAMPLES.reduce((a, b) =>
  a.point.distanceToSquared(overlook) < b.point.distanceToSquared(overlook)
    ? a
    : b,
).distance;
export function roadFrame(distance: number, lane = 0) {
  const u = MathUtils.euclideanModulo(distance, ROUTE_LENGTH) / ROUTE_LENGTH;
  const point = roadCurve.getPointAt(u);
  const tangent = roadCurve.getTangentAt(u).normalize();
  const side = new Vector3(tangent.z, 0, -tangent.x).normalize();
  return {
    point: point.addScaledVector(side, lane),
    tangent,
    side,
    yaw: Math.atan2(tangent.x, tangent.z),
    slope: Math.asin(tangent.y),
  };
}
export function nearestRoad(x: number, z: number) {
  let nearest = ROAD_SAMPLES[0],
    d2 = Infinity;
  for (const sample of ROAD_SAMPLES) {
    const d = (x - sample.point.x) ** 2 + (z - sample.point.z) ** 2;
    if (d < d2) {
      d2 = d;
      nearest = sample;
    }
  }
  return { ...nearest, away: Math.sqrt(d2) };
}
export function groundHeight(x: number, z: number) {
  const road = nearestRoad(x, z);
  const blend = MathUtils.smoothstep(road.away, 4, 28);
  const valley = Math.max(0, -x - 65) * 0.24 + Math.max(0, z - 255) * 0.2;
  const roadside =
    road.point.y -
    0.085 +
    blend * (Math.sin(x * 0.035) * 2.8 + Math.cos(z * 0.044) * 2 - valley);
  const hills =
    -14 +
    48 * Math.exp(-(((x + 255) / 105) ** 2)) +
    36 * Math.exp(-(((z - 450) / 95) ** 2)) +
    Math.sin(x * 0.027 + z * 0.009) * 8 +
    Math.cos(z * 0.038) * 5;
  return MathUtils.lerp(
    roadside,
    hills,
    MathUtils.smoothstep(road.away, 55, 135),
  );
}

export type DrivePhase = "off" | "starting" | "driving" | "parking" | "parked";
export type DriveInput = "left" | "right" | "gas" | "brake";
export class ScenicDrive {
  phase: DrivePhase = 'off';
  distance = 0;
  speed = 0;
  lane = .65;
  steering = 0;
  heading = 0;
  acceleration = 0;
  cruise = 8.5;
  startup = 0;
  engineOn = false;
  parkTarget: number | null = null;
  nextOverlook = OVERLOOK_DISTANCE;
  controls: Record<DriveInput, boolean> = {left:false,right:false,gas:false,brake:false};
  private stop = { time:0, duration:1, speed:0, distance:0, lane:0, endLane:0 };
  private merge: {distance:number;lane:number} | null = null;

  start() {
    if (['driving','starting','parking'].includes(this.phase)) return;
    this.phase = 'starting';
    this.startup = 0;
    this.cruise = 8.5;
    this.acceleration = 0;
    this.parkTarget = null;
    this.merge = Math.abs(this.lane) > 1.6 ? {distance:this.distance,lane:this.lane} : null;
    this.nextOverlook = this.distance + MathUtils.euclideanModulo(OVERLOOK_DISTANCE-this.distance,ROUTE_LENGTH);
    if (this.nextOverlook-this.distance < 35) this.nextOverlook += ROUTE_LENGTH;
  }
  private beginParking(target?: number) {
    this.clearInput();
    if (this.speed < .05) {
      this.phase = 'parked';
      this.speed = this.acceleration = this.heading = this.steering = 0;
      this.parkTarget = this.distance;
      return;
    }
    const duration = Math.max(3,1.5*this.speed/2.2);
    this.parkTarget = target ?? this.distance+this.speed*duration/2;
    const span = this.parkTarget-this.distance;
    this.stop = {
      time:0, duration:2*span/this.speed, speed:this.speed,
      distance:this.distance, lane:this.lane,
      endLane:this.lane+MathUtils.clamp(2.1-this.lane,-span*.12,span*.12),
    };
    this.phase = 'parking';
    this.merge = null;
  }
  park() {
    if (this.phase === 'starting') {
      this.phase = 'parked';
      this.speed = this.acceleration = 0;
      this.clearInput();
    } else if (this.phase === 'driving') this.beginParking();
  }
  clearInput() {
    for (const key of Object.keys(this.controls) as DriveInput[]) this.controls[key] = false;
  }
  update(dt: number, ready = true, reducedMotion = false) {
    // Rendering can slow down without changing the pace of the journey.
    let remaining = MathUtils.clamp(dt,0,.25);
    while (remaining > .000001) {
      const step = Math.min(remaining,1/60);
      this.step(step,ready,reducedMotion);
      remaining -= step;
    }
  }
  private step(dt: number, ready: boolean, reducedMotion: boolean) {
    if (this.phase === 'starting') {
      if (!ready) return;
      this.startup += dt;
      if (this.startup > .8) this.engineOn = true;
      if (this.startup <= 2.7) return;
      if (reducedMotion) {
        this.distance = this.nextOverlook;
        this.lane = 2.1;
        this.phase = 'parked';
        return;
      }
      this.phase = 'driving';
    }
    if (this.phase === 'driving') {
      const a = roadFrame(this.distance), b = roadFrame(this.distance+12);
      const curvature = Math.abs(Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw)))/12;
      const cornerSpeed = Math.sqrt(1.8/Math.max(curvature,.006));
      const pedalTarget = this.controls.brake ? 0 : Math.min(this.controls.gas ? 14 : 8.5,cornerSpeed);
      this.cruise = MathUtils.damp(this.cruise,pedalTarget,this.controls.brake ? 12 : 3,dt);
      if (this.controls.brake && this.cruise < .02) this.cruise = 0;
      const remaining = this.nextOverlook-this.distance;
      const stoppingDistance = this.speed*Math.max(3,1.5*this.speed/2.2)/2;
      if (remaining < Math.max(12,stoppingDistance+4)) this.beginParking(this.nextOverlook);
    }
    if (this.phase === 'parking') {
      this.stop.time = Math.min(this.stop.duration,this.stop.time+dt);
      const t = this.stop.time/this.stop.duration;
      const travelled = this.stop.speed*this.stop.duration*(t-t*t*t+.5*t*t*t*t);
      const span = this.parkTarget!-this.stop.distance;
      const u = MathUtils.clamp(travelled/span,0,1);
      this.distance = this.stop.distance+travelled;
      this.speed = this.stop.speed*(1-3*t*t+2*t*t*t);
      this.acceleration = -6*this.stop.speed*t*(1-t)/this.stop.duration;
      this.lane = MathUtils.lerp(this.stop.lane,this.stop.endLane,MathUtils.smootherstep(u,0,1));
      const slope = (this.stop.endLane-this.stop.lane)/span*30*u*u*(1-u)*(1-u);
      this.heading = Math.atan(slope);
      this.steering = MathUtils.damp(this.steering,MathUtils.clamp(this.heading/.15,-1,1),5,dt);
      if (t === 1) {
        this.distance = this.parkTarget!;
        this.speed = this.acceleration = this.heading = this.steering = 0;
        this.phase = 'parked';
      }
      return;
    }
    if (this.phase !== 'driving') return;
    const desired = MathUtils.clamp((this.cruise-this.speed)*1.8,this.controls.brake ? -5 : -2.2,this.controls.gas ? 3.5 : 2.1);
    this.acceleration = MathUtils.damp(this.acceleration,desired,7,dt);
    const change = this.acceleration*dt;
    const difference = this.cruise-this.speed;
    this.speed = Math.max(0,this.speed+(Math.sign(change)===Math.sign(difference) && Math.abs(change)>Math.abs(difference) ? difference : change));
    if (this.cruise === 0 && this.speed < .03) this.speed = 0;
    this.distance += this.speed*dt;
    this.steering = MathUtils.damp(this.steering,Number(this.controls.left)-Number(this.controls.right),5,dt);
    if (this.controls.left || this.controls.right) this.merge = null;
    if (this.merge) {
      const u = MathUtils.clamp((this.distance-this.merge.distance)/18,0,1);
      this.lane = MathUtils.lerp(this.merge.lane,.65,MathUtils.smootherstep(u,0,1));
      this.heading = Math.atan((.65-this.merge.lane)/18*30*u*u*(1-u)*(1-u));
      if (u === 1) this.merge = null;
    } else {
      this.heading = MathUtils.damp(this.heading,this.steering*.11*Math.min(1,this.speed/3),4,dt);
      this.lane = MathUtils.clamp(this.lane+Math.sin(this.heading)*this.speed*dt,-1.6,1.6);
    }
  }
}
