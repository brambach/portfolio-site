import { buffersOf, buildScene, srcOf, type BuildJob } from './build';

/* The worker that turns E's pictures into dots: it fetches and decodes a picture, scales it on an OffscreenCanvas and
   works out every dot, then hands the numbers back. The page only has to upload them. */

// The page's types are the DOM's, so the worker's two calls are typed here.
const scope = self as unknown as { onmessage: ((e: MessageEvent) => void) | null; postMessage: (msg: unknown, transfer?: Transferable[]) => void };

scope.onmessage = async (e: MessageEvent<BuildJob & { key: number; blob?: Blob }>) => {
  const { key, blob, ...job } = e.data;
  try {
    let img: ImageBitmap | null = null;
    const src = srcOf(job);
    if (src) img = await createImageBitmap(blob ?? await (await fetch(src)).blob());
    const built = buildScene(job, img, (w, h) => new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true }));
    img?.close();
    if (!built) { scope.postMessage({ key, error: 'no canvas' }); return; }
    scope.postMessage({ key, built }, buffersOf(built));
  } catch (err) {
    scope.postMessage({ key, error: String(err) });
  }
};
