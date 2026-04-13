export type GestureScrollInitOptions = {
  container?: HTMLElement | null;
  sensitivity?: number;
  friction?: number;
  maxSpeed?: number;
  transitionThreshold?: number;
  snapVelocityThreshold?: number;
  snapCooldownMs?: number;
  getScroll?: (() => number) | null;
  setScroll?: ((nextTop: number) => void) | null;
};

export declare const initGestureScroll: (
  options?: GestureScrollInitOptions
) => {
  setEnabled: (next: boolean) => void;
  destroy: () => void;
};

export declare const setGestureScrollEnabled: (nextEnabled: boolean) => void;
export declare const updateGestureScroll: (handY: number) => void;
export declare const destroyGestureScroll: () => void;
