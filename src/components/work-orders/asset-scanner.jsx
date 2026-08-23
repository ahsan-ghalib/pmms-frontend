"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AssetScanner({ onCode }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [live, setLive] = useState(false);

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLive(false);
  };

  useEffect(() => () => stop(), []);

  const start = async () => {
    if (typeof window === "undefined" || typeof window.BarcodeDetector === "undefined") {
      toast.message("Live scan is not supported here. Use the camera photo or enter the code.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      setLive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new window.BarcodeDetector({ formats: ["qr_code", "code_128", "ean_13", "code_39"] });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            onCode(codes[0].rawValue);
            stop();
            return;
          }
        } catch {
          // Keep scanning until the user stops or a code is found.
        }
        if (streamRef.current) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      toast.message("Camera access was denied. Use a photo or enter the code manually.");
    }
  };

  return (
    <div className="space-y-2">
      <video
        ref={videoRef}
        className={live ? "h-40 w-full rounded-xl bg-black object-cover" : "hidden"}
        muted
        playsInline
      />
      <div className="flex gap-2">
        {!live ? (
          <Button type="button" variant="outline" onClick={start}>Live camera scan</Button>
        ) : (
          <Button type="button" variant="outline" onClick={stop}>Stop camera</Button>
        )}
      </div>
    </div>
  );
}
