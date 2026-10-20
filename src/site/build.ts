import { dustFormation, introPlan, makeGrid, objectFormation, photoFormation, ringFormation, shotFormation, type Formation, type IntroPlan } from './field';
import { PALETTES, type TimeName } from './palette';
import { ART, containBox, coverCrop, layoutFor, SCENE_ORDER, workRect, type SceneId } from './scenes';

/* Turning a part's picture into dots. It runs in a worker (build.worker.ts) where the browser has one, so none of it
   lands on the main thread while the dots are moving, and on the main thread where it doesn't. Either way it's the
   same code. */

/** A part of E's page, or for E's project pages: one of a project's screens (`shot`, from `src`) or Port's ring
 *  (`ring`, compressed if `closed`). */
export type BuildJob = { id: SceneId | 'shot' | 'ring'; w: number; h: number; phone: boolean; still: boolean; palette: TimeName; plan: boolean; src?: string; closed?: boolean };

/** The file a job draws from, if it has one. */
export const srcOf = (job: BuildJob) => (job.id === 'shot' ? job.src ?? null : job.id === 'ring' || job.id === 'work' ? null : ART[job.id].src);
export type Built = { f: Formation; plan?: IntroPlan };

type Ctx = { drawImage: CanvasRenderingContext2D['drawImage']; getImageData: CanvasRenderingContext2D['getImageData']; imageSmoothingQuality: ImageSmoothingQuality };
/** A 2D canvas of the given size, from whichever kind the caller has. */
export type MakeCanvas = (w: number, h: number) => Ctx | null;

/** A picture's dots for this screen. `img` is the decoded picture (none for the work, which is dust). */
export function buildScene(job: BuildJob, img: CanvasImageSource & { width: number; height: number } | null, canvas: MakeCanvas): Built | null {
  const { id, phone, still } = job, grid = makeGrid(job.w, job.h, phone), palette = PALETTES[job.palette];
  let f: Formation | null = null;
  if (id === 'work') f = dustFormation(grid, palette);
  else if (id === 'ring') f = ringFormation(grid, workRect(phone).rect, palette, !!job.closed);
  else if (id === 'shot') {
    if (!img) return null;
    // Fitted whole into the object's place, at one pixel per cell.
    const { rect: [x0, y0, x1, y1], align } = workRect(phone);
    const box = containBox(img.width, img.height, x0 * grid.w, y0 * grid.h, (x1 - x0) * grid.w, (y1 - y0) * grid.h, align);
    const pw = Math.max(1, Math.round(box.w / grid.cell)), ph = Math.max(1, Math.round(box.h / grid.cell)), cx = canvas(pw, ph);
    if (!cx) return null;
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(img, 0, 0, pw, ph);
    f = shotFormation(grid, box, cx.getImageData(0, 0, pw, ph), palette);
  } else if (img) {
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
