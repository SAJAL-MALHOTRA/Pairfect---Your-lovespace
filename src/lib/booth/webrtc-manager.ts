/**
 * WebRTC Peer Connection Manager for Pairfect Virtual Photobooth.
 * 
 * Handles local camera streams, STUN/TURN server configuration,
 * SDP offer/answer handshakes, ICE candidates, and clean canvas snapshot frame captures.
 */

export interface WebRTCCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionState: (state: RTCPeerConnectionState) => void;
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
  onError?: (err: Error) => void;
}

export class BoothWebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private iceCandidatesQueue: RTCIceCandidateInit[] = [];
  private isMakingOffer: boolean = false;

  constructor(
    private iceServers: RTCIceServer[],
    private callbacks: WebRTCCallbacks
  ) {}

  /**
   * Request local camera access with optimal resolution for photobooth capture.
   */
  async startLocalCamera(facingMode: "user" | "environment" = "user"): Promise<MediaStream> {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
    }

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 960, max: 1440 },
        frameRate: { ideal: 30, max: 60 },
      },
      audio: false, // Photobooth uses video-only RTC
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.localStream = stream;

    if (this.pc) {
      const senders = this.pc.getSenders();
      stream.getTracks().forEach((track) => {
        const existingSender = senders.find((s) => s.track?.kind === track.kind);
        if (existingSender) {
          existingSender.replaceTrack(track);
        } else {
          this.pc!.addTrack(track, stream);
        }
      });
    }

    return stream;
  }

  /**
   * Initializes RTCPeerConnection with STUN + TURN servers and binds callbacks.
   */
  initPeerConnection(): RTCPeerConnection {
    if (this.pc) {
      this.destroyPeerConnection();
    }

    const config: RTCConfiguration = {
      iceServers: this.iceServers.length > 0
        ? this.iceServers
        : [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
      iceCandidatePoolSize: 2,
    };

    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onIceCandidate(event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.callbacks.onRemoteStream(event.streams[0]);
      } else if (event.track) {
        const stream = new MediaStream([event.track]);
        this.callbacks.onRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      this.callbacks.onConnectionState(pc.connectionState);
    };

    // Attach tracks from local stream if already active
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    this.pc = pc;
    return pc;
  }

  /**
   * Sharer / Initiator: Creates and returns SDP Offer.
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const pc = this.pc || this.initPeerConnection();
    this.isMakingOffer = true;
    try {
      if (this.localStream) {
        const senders = pc.getSenders();
        this.localStream.getTracks().forEach((track) => {
          if (!senders.some((s) => s.track === track)) {
            pc.addTrack(track, this.localStream!);
          }
        });
      }
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false,
      });
      await pc.setLocalDescription(offer);
      return offer;
    } finally {
      this.isMakingOffer = false;
    }
  }

  /**
   * Receiver: Ingests SDP Offer and generates SDP Answer.
   */
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.pc || this.initPeerConnection();

    if (this.localStream) {
      const senders = pc.getSenders();
      this.localStream.getTracks().forEach((track) => {
        if (!senders.some((s) => s.track === track)) {
          pc.addTrack(track, this.localStream!);
        }
      });
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Flush any buffered candidates
    await this.flushIceQueue();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * Initiator: Ingests partner's SDP Answer.
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    await this.flushIceQueue();
  }

  /**
   * Ingests partner's ICE Candidate or queues if remote description not yet set.
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!candidate) return;
    if (this.pc && this.pc.remoteDescription && this.pc.remoteDescription.type) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[WebRTC] Error adding ICE candidate:", err);
      }
    } else {
      this.iceCandidatesQueue.push(candidate);
    }
  }

  private async flushIceQueue(): Promise<void> {
    if (!this.pc) return;
    while (this.iceCandidatesQueue.length > 0) {
      const cand = this.iceCandidatesQueue.shift();
      if (cand) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn("[WebRTC] Error flushing candidate:", err);
        }
      }
    }
  }

  /**
   * Synchronously captures a clean, full-resolution snapshot frame from an HTMLVideoElement.
   */
  captureVideoFrame(videoElement: HTMLVideoElement, mirror: boolean = false): string {
    const canvas = document.createElement("canvas");
    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 960;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      throw new Error("Could not acquire 2D canvas context for frame capture.");
    }

    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(videoElement, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  destroyPeerConnection(): void {
    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }
    this.iceCandidatesQueue = [];
  }

  destroy(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.destroyPeerConnection();
  }
}
