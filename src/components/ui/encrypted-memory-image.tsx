"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lock, Loader2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getPairKey,
  decryptPhotoBuffer,
  isEncryptedPhotoUrl,
  getCachedDecryptedBlob,
  setCachedDecryptedBlob,
} from "@/lib/crypto/e2ee";

interface EncryptedMemoryImageProps {
  src: string;
  pairId: string;
  stripId?: string;
  position?: number;
  alt?: string;
  className?: string;
  containerClassName?: string;
}

export function EncryptedMemoryImage({
  src,
  pairId,
  stripId = "",
  position = 0,
  alt = "Photo memory",
  className = "w-full h-full object-cover",
  containerClassName = "relative w-full h-full overflow-hidden bg-black/5",
}: EncryptedMemoryImageProps) {
  const isEncrypted = isEncryptedPhotoUrl(src);
  const [decryptedSrc, setDecryptedSrc] = useState<string | null>(() => {
    if (!isEncrypted) return src;
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => isEncrypted);
  const [keyMissing, setKeyMissing] = useState<boolean>(false);
  const [decryptError, setDecryptError] = useState<boolean>(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isEncrypted) {
      setDecryptedSrc(src);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    let activeObjectUrl: string | null = null;

    const decryptImage = async () => {
      setLoading(true);
      setKeyMissing(false);
      setDecryptError(false);

      try {
        // 1. Check in-memory decrypted Blob cache first
        const cachedBlob = getCachedDecryptedBlob(src);
        if (cachedBlob) {
          activeObjectUrl = URL.createObjectURL(cachedBlob);
          if (!isCancelled && mountedRef.current) {
            setDecryptedSrc(activeObjectUrl);
            setLoading(false);
          }
          return;
        }

        // 2. Retrieve the client-side AES-GCM pair key from IndexedDB
        const key = await getPairKey(pairId);
        if (!key) {
          if (!isCancelled && mountedRef.current) {
            setKeyMissing(true);
            setLoading(false);
          }
          return;
        }

        // 3. Fetch the encrypted binary ArrayBuffer
        let buffer: ArrayBuffer;
        if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:")) {
          const res = await fetch(src);
          if (!res.ok) throw new Error(`HTTP ${res.status} fetching encrypted image`);
          buffer = await res.arrayBuffer();
        } else {
          // Relative Supabase storage path: obtain signed URL from memories bucket
          const supabase = createClient();
          const { data: signedData, error: signErr } = await supabase.storage
            .from("memories")
            .createSignedUrl(src, 3600);

          if (signErr || !signedData?.signedUrl) {
            throw new Error(signErr?.message || "Failed to create signed URL for encrypted image");
          }

          const res = await fetch(signedData.signedUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status} fetching encrypted image`);
          buffer = await res.arrayBuffer();
        }

        // 4. Decrypt the binary buffer with context AAD verification
        const decryptedBlob = await decryptPhotoBuffer(buffer, key, {
          pairId,
          stripId,
          position,
        });

        // Cache the raw decrypted Blob (safe across unmounts)
        setCachedDecryptedBlob(src, decryptedBlob);

        activeObjectUrl = URL.createObjectURL(decryptedBlob);
        if (!isCancelled && mountedRef.current) {
          setDecryptedSrc(activeObjectUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error("[E2EE Image] Decryption error:", err);
        if (!isCancelled && mountedRef.current) {
          setDecryptError(true);
          setLoading(false);
        }
      }
    };

    decryptImage();

    return () => {
      isCancelled = true;
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
      }
    };
  }, [src, pairId, stripId, position, isEncrypted]);

  // Case 1: Plain legacy image
  if (!isEncrypted) {
    return (
      <div className={containerClassName}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={className} loading="lazy" />
      </div>
    );
  }

  // Case 2: Loading ciphertext and decrypting
  if (loading) {
    return (
      <div className={`${containerClassName} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-2 p-3 text-center">
          <Loader2 className="w-5 h-5 text-[var(--burgundy)] animate-spin" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-soft)]">
            Decrypting...
          </span>
        </div>
      </div>
    );
  }

  // Case 3: Key missing on this device
  if (keyMissing) {
    return (
      <div className={`${containerClassName} flex items-center justify-center p-4 text-center bg-stone-100 dark:bg-stone-900 border border-dashed border-[var(--border)]`}>
        <div className="flex flex-col items-center gap-1.5 max-w-[200px]">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-[var(--text)] font-sans">
            Encrypted Photo
          </p>
          <p className="text-[10px] text-[var(--text-soft)] leading-tight">
            Key missing on this device. Restore via Settings.
          </p>
        </div>
      </div>
    );
  }

  // Case 4: Decryption failure or corrupted payload
  if (decryptError || !decryptedSrc) {
    return (
      <div className={`${containerClassName} flex items-center justify-center p-4 text-center bg-stone-100 dark:bg-stone-900`}>
        <div className="flex flex-col items-center gap-1.5 max-w-[200px]">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-[var(--text)] font-sans">
            Locked Memory
          </p>
          <p className="text-[10px] text-[var(--text-soft)] leading-tight">
            Authentication failed. Photo is bound to another strip.
          </p>
        </div>
      </div>
    );
  }

  // Case 5: Successfully decrypted - render via native <img> tag (do NOT wrap in Next.js <Image>)
  return (
    <div className={containerClassName}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={decryptedSrc} alt={alt} className={className} loading="lazy" />
    </div>
  );
}

export default EncryptedMemoryImage;
