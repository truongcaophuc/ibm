declare module 'gifler' {
  interface GiflerAnimator {
    stop(): void;
    start(): GiflerAnimator;
    reset(): GiflerAnimator;
    _frames: any[];
    _frameIndex: number;
    onDrawFrame: (ctx: CanvasRenderingContext2D, frame: any, index: number) => void;
  }

  interface GiflerChain {
    frames(
      canvas: HTMLCanvasElement,
      onFrame: (ctx: CanvasRenderingContext2D, frame: any, index: number) => void
    ): { then(callback: (animator: GiflerAnimator) => void): void };
  }

  function gifler(url: string): GiflerChain;
  export default gifler;
}
