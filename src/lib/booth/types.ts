/**
 * Types & Constants for Pairfect Synchronized Virtual Photobooth.
 */

export type BoothStatus =
  | "WAITING"
  | "PARTNER_JOINED"
  | "READY"
  | "COUNTDOWN"
  | "CAPTURE"
  | "PREVIEW"
  | "FINISHED"
  | "EXPIRED";

export type PerspectiveMode = "TOGETHER" | "SIDE_BY_SIDE";

export interface BoothSession {
  id: string;
  pair_id: string | null;
  host_user_id: string;
  guest_user_id: string | null;
  booth_code: string;
  status: BoothStatus;
  current_shot: number;
  total_shots: number;
  capture_at: string | null;
  current_prompt: string | null;
  layout_style: string;
  perspective: PerspectiveMode;
  created_at: string;
  completed_at: string | null;
  expires_at: string;
}

export interface BoothShot {
  id: string;
  session_id: string;
  shot_number: number;
  user_id: string | null;
  image_url: string;
  captured_at: string;
}

export const PHOTOBOOTH_PROMPTS = [
  "Look at each other and try not to laugh",
  "Give your biggest goofy smile",
  "Make your absolute worst face",
  "Blow a kiss across the distance",
  "Soft romantic gaze: like the day you met",
  "Pretend you just heard the wildest secret",
  "Peace signs and happy squinty eyes",
  "Dramatic high-fashion model pose",
  "Point at each other across the screen",
  "Your signature couple inside-joke pose",
] as const;

export function getRandomPrompt(exclude?: string | null): string {
  const available = exclude
    ? PHOTOBOOTH_PROMPTS.filter((p) => p !== exclude)
    : PHOTOBOOTH_PROMPTS;
  return available[Math.floor(Math.random() * available.length)];
}
