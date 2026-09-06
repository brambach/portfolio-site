# Cabin asset review

Checked 5 September 2026. This review covers the entrance, physical laptop and first forest drive.

## Current car

The Karol Miklas / Lionsharp 1975 model is licensed under Creative Commons Attribution 4.0 and remains in use. Its exterior is useful, but the original cabin includes a cap across the interior. The scene removes that cap and supplies the seats, floor, dashboard and inner door panel. Textures can't correct the resulting proportions, missing detail or approximate doorway.

The new laptop is separate geometry with an opening hinge, rounded aluminium case, keys, trackpad, speakers and a screen attached to its lid. It's suitable for further work independently of the car model.

## Replacement candidates

[Porsche 930 turbo by spospider](https://www.cgtrader.com/3d-models/car/antique-car/porsche-930-turbo-detailed-model) is the closest candidate I found. The seller describes a modeled interior, eight texture sets, a simple rig and subdivision levels. The listing showed $99, a Blender file, FBX and textures. I checked the listing, not the purchased geometry. Before using it, inspect the driver's footwell, door jambs, separate hinge pivots, seat backs and texture assignments. Confirm that its licence covers delivery as part of this website, then export and measure a GLB in the actual browser scene. It hasn't been purchased.

[Szymon Kubicki's free Singer model](https://www.behance.net/gallery/73717745/911-by-Singer-3D-modeling-(free-model)) has a downloadable Blender archive in the creator's linked Google Drive folder. The creator warns that the older geometry and textures have flaws. The page's project licence link points to [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/). That makes it a poor choice for an edited portfolio asset without separate permission. I inspected the page and archive listing. I didn't download or convert it.

## Materials, light and interactions

The cabin uses 1k [Brown Leather](https://polyhaven.com/a/brown_leather) and [Wood Table 001](https://polyhaven.com/a/wood_table_001) maps from Poly Haven. The colour, normal and roughness maps are credited in the scene's credits file. These improve light response but don't make the hand-built cabin near-photorealistic.

Keep the forest lighting, directional sunlight and a restrained warm cabin fill. Replace the approximate door and dashboard with parts from one coherent model before adding more small objects. Check the complete camera move against the roof, sill, door glass and steering wheel after any model swap.

The laptop screen uses HTML projected onto the physical display. It remains selectable and scrollable, and projects stay inside the car. The camera and laptop return to the same positions when reading ends. A direct reading option remains available through the site menu.

The route now uses real terrain and road geometry with instanced Poly Haven Tree Small 02 and Fern 02 assets. Trees were simplified into two levels and compressed for browser delivery. The Forest Slope photograph remains an environment reflection and lighting source. Mountains and city nights remain future work.

The active engine mix uses jerry.berumen's attributed Porsche 911 recording. The author doesn't identify its year or trim, so it shouldn't be described as a verified GT3 recording. The idle and load beds have been levelled, crossfaded and checked for matching sample endpoints. The load bed lasts about 9.3 seconds instead of repeating a 1.08-second rev. The forest, doors, starter, road and wind layers still use the credited general recordings. The mix hasn't been evaluated on speakers, headphones or a physical phone. A separate cabin rattle layer remains unfinished.

## Pine candidate review, 6 September

[Poly Haven pine_tree_01](https://polyhaven.com/a/pine_tree_01), by Rico Cilliers and Rob Tuytel, is offered under Poly Haven's [CC0 license](https://polyhaven.com/license). Its source has approximately 17 million triangles. The 1K glTF metadata references a 948,849,556-byte geometry buffer. That source isn't a suitable direct browser replacement. Only metadata was inspected; no geometry or textures were added to the project. Optimizing or selecting another tree remains outstanding.

## Fir candidate and simplification rejection, 6 September

[Poly Haven Fir Sapling](https://polyhaven.com/a/fir_sapling), photographed by Rob Tuytel and modeled by Rico Cilliers, is covered by [Poly Haven CC0](https://polyhaven.com/license). The source glTF has three variants with 433,021 triangles in total and a 21,677,180-byte geometry buffer. Variant A has 157,402 triangles.

Downloaded the 1K source to `/tmp/porsche-fir-source`, retained only variant A's node and mesh, and tried gltfpack 1.2 with `-si 0.07 -se 0.03 -cc`. The result had 11,007 triangles, two primitives and a 3,887,196-byte GLB with embedded source textures. Browser inspection showed severe foliage loss, so the candidate was rejected and removed from public assets. The default forest is unchanged. Evidence: `.codex/review/rejected-fir-simplification.png`.

Next action: preserve branch/needle coverage in the near model and use a separately baked canopy representation at distance. Don't apply a uniform seven-percent simplification and treat its low triangle count as visual acceptance. Source and experimental output remain in `/tmp/porsche-fir-source` while that temporary directory exists. No purchase is needed for this source.

## Canopy-preserving fir implementation, 6 September

Reused the verified CC0 Fir Sapling source above. Retained variant A's sole node and mesh, then compressed with gltfpack 1.2 `-cc`, without `-si`. The shipped `public/models/journey/fir-canopy.glb` preserves 157,402 triangles and two primitives, with embedded source 1K textures, at 5,367,496 bytes. Source credit is in `public/models/journey/credits.txt` and the main scene credits.

The renderer makes eight distant views from that full source at load time and keeps four nearby full-geometry instances. This preserves foliage coverage that the rejected simplification lost. Desktop and phone-width views were checked; the matched local drive shows lower triangle submission than the former sparse forest. That isn't final acceptance of the landscape, lighting or detail transitions.
