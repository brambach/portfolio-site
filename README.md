# brycerambach.com

Bryce Rambach's portfolio, explored from a classic green Porsche 911. The first version now focuses on three cabin objects, one short scenic drive and one Tahoe-inspired overlook. Visual and performance acceptance is still in progress.

## Local preview

```bash
npm ci
npm run dev
```

Vite defaults to port 3000. This worktree uses its own preview:

```bash
npm run dev -- --port 3001 --strictPort
```

Open http://localhost:3001, select the driver door, explore the cabin and turn the ignition key. Projects and contact are available immediately from the site menu.

| Control | Action |
| --- | --- |
| W / Up | Accelerate |
| S / Down | Brake |
| A / D or Left / Right | Steer |
| Q / E | Downshift / upshift |
| Space | Pull over |
| K | Start the engine |
| R, while parked | Rev the engine |
| Cruise button | Follow the road and traffic automatically |

On-screen steering, pedals and gear buttons also work with touch. Pressing a pedal or steering takes over from Cruise. Selecting projects, the racket or contact while driving parks the car before opening the object.

The scenic drive uses a two-lane arcade circuit with matching traffic, gravel shoulders and one overlook. Cruise reaches it in about 2 minutes 21 seconds in the current simulation. Visitors can turn the engine off while parked and resume without changing position abruptly. Manual gears stay selected for eight seconds, after which automatic shifting resumes. A downshift that would exceed the rev limit is ignored. The drivetrain tops out at 7,000 RPM and 56 metres per second, about 202 km/h. Traffic and bends affect the speed you can reach.

The same RPM state feeds the tachometer, on-screen instruments and engine playback. The engine mix is louder under load. Saved mute and volume preferences are preserved.

## Pages and files

- `/` opens the flat road, the front door. `/work` is the same page.
- `/drive` opens the 3D Porsche. `/drive?from=work` skips the walk-up and starts at the overlook. Old `/?town`, `/?forest` and `/?from=work` links still open it.
- `/drive?city` preserves the city prototype.
- `/drive?journey` preserves the earlier multi-stop experiment.
- `/projects` opens project notes without the scene.
- `/previous` keeps the earlier portfolio available.
- `/entrance-still` opens the photographic entrance study.

React 19, TypeScript, Vite 6 and Three.js r185.

- `src/prototype/Entrance.tsx`: entry, accessible cabin controls and driving instruments.
- `src/prototype/car-scene.ts`: renderer, car, camera and physical objects.
- `src/prototype/city-path.ts`: boulevard geometry and road queries.
- `src/prototype/city-route.ts`: manual driving, Cruise and parking.
- `src/prototype/city-world.ts`: skyline, road, procedural windows and streetlights.
- `src/prototype/city-traffic.ts` and `city-traffic-mesh.ts`: traffic behaviour and instanced cars.
- `src/prototype/engine-sound.ts` and `car-audio.ts`: shared drivetrain state and recorded engine layers.
- `src/prototype/render-quality.ts`: canvas resolution adjustment when frames run slow.

The default homepage starts the complete guided town-to-Tahoe journey, including the mandatory cabin tour, optional café and tennis stops, route map and portfolio finish. `?town` remains a compatible preview URL. The older forest starting point is available at `?forest`; city and multi-stop walking experiments remain at `?city` and `?journey`. The finish line and acceptance evidence are recorded in `docs/implementation/porsche-journey-goal.md`.

## Checks

```bash
npm run lint
npm test
npm run build
```

See `src/prototype/VERIFICATION.md` for the latest results, browser checks and limits. Local development builds accept `?profile=journey` for sustained frame windows on the canvas's `data-scene-profile` attribute. The older bare `?profile` sampler covers only the original 25–150 metre interval and isn't suitable for the new forest starting point. It doesn't transmit data or run in production.

Nothing in this pass has been committed, pushed or deployed.

### Preserved experiments

The multi-stop route at `/?journey` includes its map, café visit, trail walk and access roads. These aren't required first-version features and shouldn't be expanded while finishing the focused experience. The future list and archived implementation history are in `docs/implementation/`. Nothing has been deployed.
