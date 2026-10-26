# Alpine panorama provenance

Generated with the built-in image-generation tool on September 6, 2026. This is a fictional, lake-inspired background, not a photograph of a verified location.

Selected workspace asset: `public/images/entrance/alpine-panorama-v1.png`, 1774 x 887 pixels. The first generated version is used. A follow-up request for 3840 x 1920 returned the same pixel dimensions and wasn't selected.

## Final selected prompt

Use case: photorealistic-natural. Asset type: equirectangular background panorama texture for a browser-based scenic driving experience. Create a 2:1 panoramic image of a fictional alpine lake basin seen from water level. Full 360-degree horizontal panorama, level horizon exactly at image mid-height, matching left and right edges, with the upper half covering zenith to horizon. A continuous distant granite mountain chain occupies a low band just above the horizon, realistic granite ridges, pine-covered slopes and subtle atmospheric layering, varied peaks mostly within 5 to 12 degrees above the horizon. The upper sky is spacious, clean, naturally blue with a faint warm late-afternoon haze close to the horizon. The lower half is calm blue-grey lake water, no land or foreground objects. Natural photographic texture, restrained contrast, no dramatic HDR processing. No sun disc, no near trees, no buildings, no boats, no people, no text, no watermark. This will sit behind real-time terrain and water, so all mountains must remain distant and the horizon must stay level. Deliver one clean panoramic texture, not a mockup.

## Use and limits

The scenic sky shader samples the panorama as a distant background and tints it through the existing afternoon-to-evening progression. Nearby terrain, trees, road and lake water remain rendered geometry. The procedural mountains remain available if the image fails to load. The image is tracked for scene cleanup.

The horizon offset follows the generated image's actual waterline. It isn't a surveyed environment or a true captured spherical panorama. The sampled overlook and road-facing views were reviewed; the entire horizontal seam and pole distortion haven't been accepted. Full-route performance and texture-load failure behavior weren't tested in this pass.
