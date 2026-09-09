import {useEffect,useRef} from "react";
import type { DriveInput } from "./forest-route";

export function DriveControls({
  input,
  park,
  honk,
  assisted=false,
}: {
  input: (key: DriveInput, pressed: boolean) => void;
  park: () => void;
  honk?: () => void;
  assisted?: boolean;
}) {
  const held=useRef(new Set<DriveInput>()),latestInput=useRef(input);
  useEffect(()=>{latestInput.current=input;},[input]);
  useEffect(()=>()=>{
    for(const key of held.current)latestInput.current(key,false);
    held.current.clear();
  },[]);
  const press=(key:DriveInput,pressed:boolean)=>{
    if(pressed)held.current.add(key);else held.current.delete(key);
    input(key,pressed);
  };
  const pedal = (key: DriveInput, label: string, icon: string) => (
    <button
      key={key}
      disabled={assisted && key!=="brake"}
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        press(key, true);
      }}
      onPointerUp={() => press(key, false)}
      onPointerCancel={() => press(key, false)}
      onLostPointerCapture={() => press(key, false)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {event.preventDefault();press(key, true);}
      }}
      onKeyUp={(event) => {
        if(event.key === "Enter" || event.key === " "){event.preventDefault();press(key, false);}
      }}
      onBlur={() => press(key, false)}
    >
      {icon}
    </button>
  );
  return (
    <div className="driving-touch" aria-label="Driving controls">
      <div>
        {pedal("left", "Steer left", "←")}
        {pedal("right", "Steer right", "→")}
      </div>
      <div>
        {honk&&<button aria-label="Honk horn touch control" aria-keyshortcuts="H" onClick={honk}>H</button>}
        <button aria-label="Pull over" onClick={park}>
          P
        </button>
        {pedal("brake", "Brake", "−")}
        {pedal("gas", "Accelerate", "+")}
      </div>
    </div>
  );
}
