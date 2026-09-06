# Porsche entrance prototypes

## Continuous 3D version

Open `http://localhost:3000/` or `/entrance`. The simulation is the default website. The original portfolio stays at `/previous`.

The camera starts above a licensed classic 911, approaches the driver's door, then waits for entry. Click the door or use the entry control that appears on keyboard focus. The door opens before the camera passes through it and closes after sitting down. The site menu includes a skip option and direct content access.

Inside, drag or use arrow keys to look around. The laptop lifts clear of the passenger-seat bolsters, crosses the cabin, settles into the lap and opens its lid, and project notes appear on its physical screen. Select a project, return to the file list, or close the laptop to restore the original seat view. The front-seat tennis racket tilts and lifts into view beside Bryce's note about playing tennis when he was younger and the young prodigy nickname. The rear photo board uses taped prints and a cork frame. The tennis memory uses a small ruled paper card, and the laptop uses a quiet folder browser. The photo board and contact card open in readable dialogs. The menu's direct reading link opens `/projects`, a separate page without the 3D renderer. The laptop keeps the last selected project when it closes.

The note beside the ignition invites a forest drive. Click the key or press K. The laptop closes and the camera faces the road before ignition and pull-away. Up / W accelerates, Down / S brakes, and Left / Right or A / D steers within the road. Space pulls over. R blips the throttle while parked. Phone layouts show steering, pedal and parking controls only while driving. The car cruises and follows the road automatically. Optional steering changes its heading gradually. The accelerator increases speed, releasing it returns toward a cruising pace, and braking slows the car to a stop. The car follows one real 3D forest route and stops at a warm overlook. Objects remain usable after parking. Choose Keep going or press K to continue around the loop. Parking follows a continuous speed and lane curve, then merges back onto the road gradually. Fixed simulation steps keep travel consistent at different frame rates.

Audio starts only after a deliberate gesture. Entering starts forest and door sounds, with the engine off. Ignition introduces the recorded start and 911 engine recordings. Idle and load use levelled, crossfaded beds with matched sample endpoints. Continuing after a stop keeps the engine idling without replaying ignition. Road and wind recordings follow speed, and outdoor ambience quietens in the cabin. Mute sits beside the menu, and volume is in the menu. Sound preferences persist across visits. The engine source identifies a 911, without a year or trim. It isn't a verified GT3 recording, and the mix hasn't had a listening pass on physical devices.

Reduced motion skips camera travel and reaches a parked overlook after ignition. Hidden tabs pause drawing and audio. The renderer stops drawing when the camera, car and objects are still. The forest uses terrain, road geometry, two tree detail levels, ferns and distant hills. Tree detail and fern visibility fade across overlapping distance ranges. Tree groups outside the camera view are culled, and materials compile before the scene fades in. It no longer uses a projected photo as traversable scenery.

`Entrance.tsx` handles the React interface. `car-scene.ts` connects the renderer, camera, objects, audio and route. `laptop-motion.ts` defines the lift and reading position; `ProjectLaptop.tsx` supplies the screen's HTML. The reading screen projects into a flat browser layer that matches the physical display, so clicks and scrolling continue to work after the car travels. The layer stays hidden while the laptop moves. `forest-route.ts` handles travel and parking; `forest-world.ts` builds the surroundings. `CarAudio` mixes the recordings. Scene credits and licence links are in `public/models/entrance/credits.txt`.

The local version includes the cabin and driving polish described above. The hand-built cabin and approximate doorway still limit realism. The model and forest assets total about 38 MB before audio, so delivery and physical-device performance need work before release. No deployment was performed. See `ASSET-REVIEW.md` for replacement candidates, `OUTSIDER-REVIEW.md` for the separate agent's findings and `VERIFICATION.md` for checks and limits.

## First image version

Open `http://localhost:3000/entrance-still` with the existing `npm run dev` server. The original portfolio stays at `/previous`. Both prototypes load through separate lazy imports in `src/main.tsx`.

Click the car or the entry button. Over 4.9 seconds, the painted overhead image dissolves into a photographic overhead frame while the camera scales toward the driver, then dissolves into the cabin. Step outside resets the entrance. Work opens the existing `/previous#made` section. Reduced motion skips directly to the cabin.

This is an image-based camera illusion. It doesn't simulate a 3D vehicle, opening door, physically continuous camera path, changing reflections, steering, audio, or interactive cabin objects. The generated car geometry differs slightly between frames. Images are full-resolution prototype assets, about 17 MB combined, and need delivery optimization before any production release.

## Visual choices

The supplied painting provides the composition. Olive `#24291d`, deep green `#283121`, linen `#f4edd9`, amber `#f0cf82`, and cognac leather come from the car and road. Existing Fraunces and Hanken Grotesk fonts keep the prototype related to the portfolio. The car stays central. The default entrance is wordless, with an accessible door button and a small site menu. Cabin navigation stays in the objects and the site menu. Only touch driving controls use the bottom of the view. Motion happens on entry, with no idle camera drift.

## Assets and generation

The original wallpaper is copied to `public/images/entrance/painted-road.png`. Both photographic assets were generated using the built-in image generation tool, with that wallpaper as the reference. They live at `public/images/entrance/real-road.png` and `public/images/entrance/cabin.png`. Original generated files remain in the Codex generated_images directory.

Cabin prompt:

> Use case: photorealistic-natural. Create a widescreen 16:9 cinematic photographic asset for a website entrance. Reference image establishes the exact green classic air-cooled Porsche, cognac interior, tree-lined road and olive/gold late afternoon light. Change camera to first-person seated in the LEFT driver's seat, looking forward over a beautiful dark green hood down that quiet forest road. Wide lens showing the large classic thin-rim wood steering wheel in lower left/center, authentic five black analog instrument dials, black leather upper dashboard, rich patinated cognac leather lower dash and passenger seat at right, brushed metal trim, old simple radio. Windshield occupies upper half. Warm sun from upper right, real subtle reflections on glass and chrome, deeply tactile materials. Restrained editorial automotive photography, realistic not oil painted. No people, hands, modern screens, overlays, UI, text labels or watermarks. Full bleed image. A believable intimate beautiful cabin, not a showroom.

Overhead prompt:

> Use case: style-transfer. Edit this exact image into realistic automotive photography. Preserve EXACT camera position, framing, car size, placement, orientation, tree and road geometry, and color palette. Replace the impasto oil paint texture with real photographic material: glossy olive green classic Porsche 911, cognac interior, reflected trees on hood and glass, metallic chrome, real road asphalt, realistic foliage and golden afternoon sun. Car faces top of image and is centered. Do not move or redesign any subject. No text, UI, border or watermark. This will be aligned with the original as a crossfade, so exact composition matching is critical.
