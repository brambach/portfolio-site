import { describe, expect, it } from "vitest";
import {
  OVERLOOK_DISTANCE,
  ROUTE_LENGTH,
  ScenicDrive,
  roadFrame,
} from "./forest-route";

function advance(
  drive: ScenicDrive,
  seconds: number,
  ready = true,
  reduced = false,
) {
  for (let i = 0; i < seconds * 60; i++) drive.update(1 / 60, ready, reduced);
}

describe("the forest drive", () => {
  it("waits for the laptop and camera before starting", () => {
    const drive = new ScenicDrive();
    drive.start();
    advance(drive, 4, false);
    expect(drive.phase).toBe("starting");
    expect(drive.distance).toBe(0);
    advance(drive, 5);
    expect(drive.phase).toBe("driving");
    expect(drive.distance).toBeGreaterThan(0);
  });

  it("reaches the overlook, stops and can resume for another circuit", () => {
    const drive = new ScenicDrive();
    drive.start();
    advance(drive, 150);
    expect(drive.phase).toBe("parked");
    expect(drive.distance).toBeCloseTo(OVERLOOK_DISTANCE, 0);
    expect(drive.speed).toBe(0);
    expect(drive.lane).toBe(2.1);
    drive.start();
    expect(drive.nextOverlook).toBeCloseTo(OVERLOOK_DISTANCE + ROUTE_LENGTH);
    advance(drive, 6);
    expect(drive.distance).toBeGreaterThan(OVERLOOK_DISTANCE);
  });

  it("bounds steering, brakes to rest and releases input when parking", () => {
    const drive = new ScenicDrive();
    drive.start();
    drive.controls.left = true;
    drive.controls.gas = true;
    advance(drive, 12);
    expect(drive.lane).toBe(1.6);
    expect(drive.speed).toBeLessThanOrEqual(14);
    drive.controls.brake = true;
    drive.controls.gas = false;
    advance(drive, 8);
    expect(drive.speed).toBe(0);
    drive.park();
    advance(drive, 8);
    expect(drive.phase).toBe("parked");
    expect(Object.values(drive.controls).every((value) => !value)).toBe(true);
  });

  it("can cancel ignition without moving", () => {
    const drive = new ScenicDrive();
    drive.start();
    drive.park();
    advance(drive, 4);
    expect(drive.phase).toBe("parked");
    expect(drive.distance).toBe(0);
  });

  it("merges gradually from the parked shoulder when resuming", () => {
    const drive = new ScenicDrive();
    drive.phase = 'parked';
    drive.lane = 2.1;
    drive.start();
    for(let frame=0;frame<360;frame++) {
      const previousLane = drive.lane;
      drive.update(1/60);
      expect(Math.abs(drive.lane-previousLane)).toBeLessThan(.04);
    }
    expect(drive.lane).toBeLessThan(2.1);
    expect(drive.lane).toBeGreaterThanOrEqual(.65);
  });

  it("takes the reduced-motion path directly to a parked overlook", () => {
    const drive = new ScenicDrive();
    drive.start();
    advance(drive, 3, true, true);
    expect(drive.phase).toBe("parked");
    expect(drive.distance).toBeCloseTo(OVERLOOK_DISTANCE);
    expect(drive.speed).toBe(0);
  });

  it("joins the end of the road without a camera position or heading jump", () => {
    const first = roadFrame(0);
    const last = roadFrame(ROUTE_LENGTH);
    expect(first.point.distanceTo(last.point)).toBeLessThan(0.001);
    expect(first.tangent.angleTo(last.tangent)).toBeLessThan(0.001);
    for (let distance = 0; distance < ROUTE_LENGTH; distance += 2) {
      expect(
        roadFrame(distance).tangent.angleTo(roadFrame(distance + 0.1).tangent),
      ).toBeLessThan(0.08);
    }
  });
});

it('keeps the engine idling while parked and throughout a warm restart', () => {
  const drive = new ScenicDrive();
  drive.start();
  advance(drive,6);
  expect(drive.engineOn).toBe(true);
  drive.park();
  advance(drive,12);
  expect(drive.phase).toBe('parked');
  drive.start();
  for(let i=0;i<240;i++) { drive.update(1/60); expect(drive.engineOn).toBe(true); }
});

it('cancels a cold ignition before the engine fires', () => {
  const drive = new ScenicDrive();
  drive.start(); advance(drive,.2); drive.park();
  advance(drive,4);
  expect(drive.engineOn).toBe(false);
});

it('coasts after releasing the accelerator and turns into steering input gradually', () => {
  const drive = new ScenicDrive(); drive.start(); drive.controls.gas=true;
  advance(drive,9);
  const fast=drive.speed;
  drive.controls.gas=false; drive.controls.left=true;
  const before=drive.heading; drive.update(1/60);
  expect(drive.heading-before).toBeLessThan(.01);
  advance(drive,3);
  expect(drive.speed).toBeLessThan(fast);
  expect(drive.heading).toBeGreaterThan(.05);
  drive.controls.left=false; advance(drive,2);
  expect(drive.heading).toBeLessThan(.005);
});

it('stops without a final speed drop or sideways snap',()=>{
  for(const speed of [0,3,8.5,14]) {
    const drive=new ScenicDrive();drive.phase='driving';drive.speed=speed;drive.engineOn=true;
    const initialLane=drive.lane;drive.park();
    for(let i=0;i<1200;i++) {
      const previousSpeed=drive.speed,previousLane=drive.lane;
      drive.update(1/60);
      expect(Math.abs(drive.speed-previousSpeed)).toBeLessThan(.045);
      expect(Math.abs(drive.lane-previousLane)).toBeLessThan(.02);
    }
    expect(drive.phase).toBe('parked');
    expect(drive.acceleration).toBe(0);
    if(speed===0) expect(drive.lane).toBe(initialLane);
  }
});

it('covers the same distance at 60 and 15 frames per second',()=>{
  const fast=new ScenicDrive(),slow=new ScenicDrive();fast.start();slow.start();
  for(let i=0;i<1800;i++) fast.update(1/60);
  for(let i=0;i<450;i++) slow.update(1/15);
  expect(slow.distance).toBeCloseTo(fast.distance,8);
  expect(slow.speed).toBeCloseTo(fast.speed,8);
});
