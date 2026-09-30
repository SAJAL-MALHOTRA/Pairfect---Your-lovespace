/**
 * NTP-style Clock Synchronization Utility for Pairfect Virtual Photobooth.
 * 
 * Synchronizes client clock with server clock by measuring Round Trip Time (RTT).
 * Uses requestAnimationFrame with a tight backup poll loop to prevent setTimeout drift
 * and hit accurate frame capture targets within +/- 50ms.
 */

export interface ClockSyncResult {
  offsetMs: number;
  rttMs: number;
  samples: number;
}

export class ClockSync {
  private offsetMs: number = 0;
  private isCalibrated: boolean = false;
  private activeTimerId: ReturnType<typeof setTimeout> | null = null;
  private activeRafId: number | null = null;
  private activeIntervalId: ReturnType<typeof setInterval> | null = null;
  private worker: Worker | null = null;
  private isFired: boolean = false;

  private getOrCreateWorker(): Worker | null {
    if (typeof window === "undefined" || !window.Worker) return null;
    if (this.worker) return this.worker;

    try {
      const blobCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data.action === "schedule") {
            const delay = typeof e.data.remainingMs === "number" ? e.data.remainingMs : (e.data.targetTime - Date.now());
            const targetTime = Date.now() + delay;
            if (timer) clearInterval(timer);
            timer = setInterval(function() {
              if (Date.now() >= targetTime) {
                clearInterval(timer);
                timer = null;
                self.postMessage("fire");
              }
            }, 4);
          } else if (e.data.action === "cancel") {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([blobCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);
      return this.worker;
    } catch (e) {
      console.warn("[ClockSync] Inline Worker creation fallback:", e);
      return null;
    }
  }

  /**
   * Ping server endpoint 3-5 times to estimate server offset.
   * serverOffset = serverTime - (clientTime + RTT / 2)
   */
  async calibrate(endpoint: string = "/api/booth/clock", sampleCount: number = 5): Promise<ClockSyncResult> {
    const offsets: number[] = [];
    const rtts: number[] = [];

    for (let i = 0; i < sampleCount; i++) {
      try {
        const clientSendTime = Date.now();
        const t0 = performance.now();

        const res = await fetch(endpoint, {
          method: "GET",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });

        if (!res.ok) throw new Error(`Clock sync ping failed: ${res.status}`);

        const data = await res.json();
        const t1 = performance.now();
        const clientReceiveTime = Date.now();

        const rtt = t1 - t0;
        const serverTime = Number(data.t || data.serverTime);

        // Client time at the estimated midpoint of request
        const clientMidpoint = clientSendTime + (clientReceiveTime - clientSendTime) / 2;
        const offset = serverTime - clientMidpoint;

        offsets.push(offset);
        rtts.push(rtt);

        // Space out samples slightly (60ms) to avoid burst packet contention
        if (i < sampleCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, 60));
        }
      } catch (err) {
        console.warn(`[ClockSync] Sample ${i + 1} failed:`, err);
      }
    }

    if (offsets.length === 0) {
      console.error("[ClockSync] All clock sync samples failed. Defaulting offset to 0ms.");
      this.offsetMs = 0;
      this.isCalibrated = true;
      return { offsetMs: 0, rttMs: 0, samples: 0 };
    }

    // Sort to extract median
    offsets.sort((a, b) => a - b);
    rtts.sort((a, b) => a - b);

    const medianOffset = offsets[Math.floor(offsets.length / 2)];
    const medianRtt = rtts[Math.floor(rtts.length / 2)];

    this.offsetMs = medianOffset;
    this.isCalibrated = true;

    console.log(
      `[ClockSync] Calibrated! Median offset: ${medianOffset.toFixed(1)}ms | Median RTT: ${medianRtt.toFixed(1)}ms (${offsets.length} samples)`
    );

    return {
      offsetMs: this.offsetMs,
      rttMs: medianRtt,
      samples: offsets.length,
    };
  }

  /**
   * Convert local client timestamp to estimated server timestamp
   */
  toServerTime(clientMs: number = Date.now()): number {
    return clientMs + this.offsetMs;
  }

  /**
   * Convert server timestamp to local client timestamp
   */
  toClientTime(serverMs: number): number {
    return serverMs - this.offsetMs;
  }

  get offset(): number {
    return this.offsetMs;
  }

  get calibrated(): boolean {
    return this.isCalibrated;
  }

  /**
   * Schedule a callback at an absolute server timestamp.
   * 
   * Addresses Chrome background tab throttling:
   * 1. Uses coarse setTimeout until ~150ms before target.
   * 2. Within 150ms, initiates a dual loop:
   *    - requestAnimationFrame loop checking performance.now() each frame.
   *    - 4ms tight setInterval fallback in case the tab is backgrounded/rAF is paused.
   * 3. Whichever triggers Date.now() >= targetClientMs first immediately fires the callback
   *    and tears down all timers.
   */
  scheduleAt(serverTimestampMs: number, callback: () => void): () => void {
    this.cancelScheduled();
    this.isFired = false;

    const targetClientMs = this.toClientTime(serverTimestampMs);
    const now = Date.now();
    const remainingMs = targetClientMs - now;

    const fireNow = () => {
      if (this.isFired) return;
      this.isFired = true;
      this.cancelScheduled();
      callback();
    };

    if (remainingMs <= 5) {
      fireNow();
      return () => this.cancelScheduled();
    }

    // 1. Web Worker unthrottled watchdog: completely immune to Chrome background tab clamping
    const worker = this.getOrCreateWorker();
    if (worker) {
      worker.onmessage = (e) => {
        if (e.data === "fire") {
          fireNow();
        }
      };
      worker.postMessage({ action: "schedule", remainingMs, targetTime: targetClientMs });
    }

    // Start precision loop within thresholdMs
    const startPrecisionLoop = () => {
      const checkAndFire = () => {
        if (Date.now() >= targetClientMs) {
          fireNow();
        } else if (!this.isFired) {
          if (typeof window !== "undefined" && window.requestAnimationFrame) {
            this.activeRafId = window.requestAnimationFrame(checkAndFire);
          }
        }
      };

      // requestAnimationFrame for high-precision 60-120fps browser paint sync
      if (typeof window !== "undefined" && window.requestAnimationFrame) {
        this.activeRafId = window.requestAnimationFrame(checkAndFire);
      }

      // 4ms interval backup
      this.activeIntervalId = setInterval(() => {
        if (Date.now() >= targetClientMs) {
          fireNow();
        }
      }, 4);
    };

    const coarseLeadTime = 150; // ms before target to switch to tight rAF loop
    if (remainingMs > coarseLeadTime) {
      this.activeTimerId = setTimeout(() => {
        startPrecisionLoop();
      }, remainingMs - coarseLeadTime);
    } else {
      startPrecisionLoop();
    }

    return () => this.cancelScheduled();
  }

  /**
   * Cancel any pending scheduled triggers.
   */
  cancelScheduled(): void {
    if (this.worker) {
      this.worker.postMessage({ action: "cancel" });
    }
    if (this.activeTimerId) {
      clearTimeout(this.activeTimerId);
      this.activeTimerId = null;
    }
    if (this.activeRafId && typeof window !== "undefined") {
      window.cancelAnimationFrame(this.activeRafId);
      this.activeRafId = null;
    }
    if (this.activeIntervalId) {
      clearInterval(this.activeIntervalId);
      this.activeIntervalId = null;
    }
  }
}

export const clockSync = new ClockSync();
