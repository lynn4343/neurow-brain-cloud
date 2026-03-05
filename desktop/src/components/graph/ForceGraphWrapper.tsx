"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import ForceGraph3D from "react-force-graph-3d";
import { useEffect, useRef } from "react";

// Wrapper that applies auto-rotate via a manual animation loop.
// OrbitControls.autoRotate requires controls.update() every frame,
// which react-force-graph-3d's render loop doesn't call.

export default function ForceGraphWrapper(props: any) {
  const innerRef = useRef<any>(null);

  useEffect(() => {
    let animationId: number | undefined;

    const timer = setTimeout(() => {
      if (!innerRef.current) {
        console.warn("[ForceGraphWrapper] ref is null after timeout");
        return;
      }

      const controls = innerRef.current.controls();
      if (!controls) {
        console.warn("[ForceGraphWrapper] controls() returned null");
        return;
      }

      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.0;

      // Drive the auto-rotation — controls.update() must be called each frame
      function animate() {
        controls.update();
        animationId = requestAnimationFrame(animate);
      }
      animate();
    }, 800);

    return () => {
      clearTimeout(timer);
      if (animationId !== undefined) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return <ForceGraph3D {...props} ref={innerRef} />;
}
