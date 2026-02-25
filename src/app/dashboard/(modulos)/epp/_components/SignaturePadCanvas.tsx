"use client";

import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";

export interface SignaturePadRef {
  getDataURL: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

interface Props {
  height?: number;
  onBegin?: () => void;
}

export const SignaturePadCanvas = forwardRef<SignaturePadRef, Props>(
  ({ height = 180, onBegin }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const padRef = useRef<any>(null);

    const resizeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas || !padRef.current) return;
      const ratio = Math.max(window.devicePixelRatio ?? 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);
      padRef.current.clear();
    }, []);

    useEffect(() => {
      if (!canvasRef.current) return;
      let pad: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      import("signature_pad").then(({ default: SP }) => {
        if (!canvasRef.current) return;
        pad = new SP(canvasRef.current, {
          backgroundColor: "rgb(255, 255, 255)",
          penColor: "rgb(0, 0, 0)",
          minWidth: 1,
          maxWidth: 2.5,
        });
        padRef.current = pad;
        if (onBegin) pad.addEventListener("beginStroke", onBegin);
        // initial size
        resizeCanvas();
      });

      window.addEventListener("resize", resizeCanvas);
      return () => {
        window.removeEventListener("resize", resizeCanvas);
        pad?.off();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      getDataURL: () => {
        if (!padRef.current || padRef.current.isEmpty()) return null;
        return padRef.current.toDataURL("image/png");
      },
      clear: () => padRef.current?.clear(),
      isEmpty: () => padRef.current?.isEmpty() ?? true,
    }));

    return (
      <canvas
        ref={canvasRef}
        className="w-full border border-border rounded-md cursor-crosshair touch-none bg-white"
        style={{ height: `${height}px`, display: "block" }}
      />
    );
  }
);

SignaturePadCanvas.displayName = "SignaturePadCanvas";
