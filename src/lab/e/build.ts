import { dustFormation, introPlan, makeGrid, objectFormation, photoFormation, type Formation, type IntroPlan } from './field';
import { PALETTES, type TimeName } from './palette';
import { ART, coverCrop, layoutFor, SCENE_ORDER, type SceneId } from './scenes';

/* Turning a part's picture into dots. It runs in a worker (build.worker.ts) where the browser has one, so none of it
   lands on the main thread while the dots are moving, and on the main thread where it doesn't. Either way it's the
   same code. */

export type BuildJob = { id: SceneId; w: number; h: number; phone: boolean; still: boolean; palette: TimeName; plan: boolean };
export type Built = { f: Formation; plan?: IntroPlan };

type Ctx = { drawImage: CanvasRenderingContext2D['drawImage']; getImageData: CanvasRenderingContext2D['getImageData']; imageSmoothingQuality: ImageSmoothingQuality };
/** A 2D canvas of the given size, from whichever kind the caller has. */
export type MakeCanvas = (w: number, h: number) => Ctx | null;

/** A picture's dots for this screen. `img` is the decoded picture (none for the work, which is dust). */
export function buildScene(job: BuildJob, img: CanvasImageSource & { width: number; height: number } | null, canvas: MakeCanvas): Built | null {
  const { id, phone, still } = job, grid = makeGrid(job.w, job.h, phone), palette = PALETTES[job.palette];
  let f: Formation | null = null;
  if (id === 'work') f = dustFormation(grid, palette);
  else if (img) {
    const art = ART[id], layout = layoutFor(id, phone), seed = SCENE_ORDER.indexOf(id) + 1;
    if (art.kind === 'object') {
      // The whole picture, at about three pixels to a dot: the dots read the pink and the four tones off it
      // themselves, and that's plenty to keep the plane's thin trail without keying every pixel of the file.
      const across = ((layout.rect[2] - layout.rect[0]) * grid.w) / grid.cell, k = Math.min(1, (across * 3) / img.width);
      const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k)), cx = canvas(w, h);
      if (!cx) return null;
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, 0, 0, w, h);
      f = objectFormation(grid, layout, art, cx.getImageData(0, 0, w, h), palette, { seed, drips: id === 'hero', still });
    } else {
      const [x0, y0, x1, y1] = layout.rect;
      const rw = (x1 - x0) * grid.w, rh = (y1 - y0) * grid.h;
      const pw = Math.max(1, Math.round(rw / grid.cell)), ph = Math.max(1, Math.round(rh / grid.cell)), cx = canvas(pw, ph);
      if (!cx) return null;
      const crop = coverCrop(img.width, img.height, rw, rh, art.focus ?? [0.5, 0.5]);
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, pw, ph);
      f = photoFormation(grid, layout, art, cx.getImageData(0, 0, pw, ph), palette, seed);
    }
  }
  if (!f) return null;
  return job.plan ? { f, plan: introPlan(grid, f) } : { f };
}

/** Every buffer in a result, to hand it back from the worker without copying. */
export const buffersOf = (b: Built) => [
  ...Object.values(b.f).map(a => (a as Float32Array).buffer),
  ...(b.plan ? [b.plan.from.buffer, b.plan.shown.buffer, b.plan.delay.buffer] : []),
] as ArrayBuffer[];
