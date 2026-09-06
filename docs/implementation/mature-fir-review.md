# Mature fir candidate review

September 6, 2026. Rejected as a wholesale replacement for the current forest.

## Source and processing

[Fir Tree 01](https://polyhaven.com/a/fir_tree_01), Poly Haven. Photography by Rob Tuytel, modeling by Rico Cilliers. CC0, as stated on the asset page. Variant C is about 14.5 m tall before the existing canopy normalization. The current production tree is the separately credited Fir Sapling variant A, normalized to 16 m.

The candidate's geometry occupies bytes 445212268 through 478462203 of the source binary. A successful range request fetched 33,249,936 bytes, rather than the full 478,462,204-byte model. Metadata and the preparation script are retained in `.codex/asset-candidates/mature-fir/`. The script records the temporary processing paths used during this investigation.

Texture conversion used glTF Transform 4.5.0, WebP quality 82. Geometry compression used gltfpack 1.2 with `-cc`. The full candidate contains 505,494 triangles and is about 6.9 MiB. A trial with `-si 0.18 -se 0.005` produced 93,812 triangles and about 2.9 MiB. The compressed full candidate and report remain outside public assets in `.codex/asset-candidates/mature-fir/`.

## Visual finding

The simplified candidate looked sparse. Preserving all geometry didn't resolve the composition: most foliage begins high above the road, so replacing all trees produces a roadside dominated by bare trunks. The issue isn't explained by simplification alone. The cabin view was worse than the existing scene. Evidence: `.codex/review/mature-fir-rejected-seat.jpg`.

The candidate loaded and rendered without browser warnings or errors. It wasn't accepted on visual grounds, so a sustained performance comparison wasn't run. Its full geometry would also need a tighter near-tree budget than the current sapling.

## Final state and next action

Restored the original asset URL and original near-tree budget. The candidate isn't shipped or fetched by the site. TypeScript and the restored production build pass. The prior 235-test regression applies to the restored implementation; tests weren't repeated for a source-identical restoration.

Future composition work should evaluate mixed mature canopy and lower growth at plausible heights, with sightlines checked from the cabin before a full performance run. A single taller replacement doesn't solve the bare banks. No additional purchase, publishing or user acceptance is implied.
