// Only the canvas resolution changes. Project text and controls keep their CSS resolution.
export class RenderQuality {
  readonly maximum: number;
  readonly minimum: number;
  ratio: number;
  treeBudget:2|4=4;
  private elapsed = 0;
  private samples = 0;
  private fastTime = 0;

  constructor(deviceRatio: number, startingRatio = 1.5) {
    this.maximum = Math.min(deviceRatio, 1.5);
    this.minimum = Math.min(deviceRatio, .85);
    this.ratio = Math.max(this.minimum, Math.min(this.maximum, startingRatio));
  }

  sample(intervalMs: number, active: boolean): number | null {
    // Ignore wakeups, background tabs and long pauses between interactions.
    if (!active) {
      this.elapsed = this.samples = this.fastTime = 0;
      return null;
    }
    if (intervalMs <= 0 || intervalMs > 250) {
      this.elapsed = this.samples = this.fastTime = 0;
      return null;
    }
    // One scheduling pause shouldn't blur an otherwise steady road section.
    // Sustained slow rendering still contributes up to 50 ms per frame.
    this.elapsed += Math.min(intervalMs, 50);
    this.samples++;
    if (this.elapsed < 2000) return null;
    const mean = this.elapsed / this.samples;
    // Try the existing baked tree views before reallocating the canvas buffers.
    // Keep this budget for the visit so changing road sections doesn't toggle detail.
    if(mean>18 && this.treeBudget===4){
      this.treeBudget=2;
      this.elapsed=this.samples=this.fastTime=0;
      return null;
    }
    this.fastTime = mean < 12.5 ? this.fastTime + this.elapsed : 0;
    let next = this.ratio;
    if (mean > 18) {
      // Pixel cost scales with area. Bound the estimate so a slow section can
      // settle without a series of expensive canvas reallocations.
      const estimatedDrop=this.ratio*(1-Math.sqrt(16/mean));
      const drop=Math.max(.15,Math.min(.3,estimatedDrop));
      next = Math.max(this.minimum, this.ratio - drop);
    }
    else if (this.fastTime >= 30000) {
      next = Math.min(this.maximum, this.ratio + .1);
      this.fastTime = 0;
    }
    this.elapsed = this.samples = 0;
    next = Math.round(next * 100) / 100;
    if (next === this.ratio) return null;
    this.ratio = next;
    return next;
  }
}
