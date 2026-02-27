"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { SHRINK_DISTANCE } from "../lib/client-config";

type ScrollAwareNavProps = {
  children: ReactNode;
};

export function ScrollAwareNav({ children }: ScrollAwareNavProps) {
  const [headerScrollProgress, setHeaderScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const nextProgress = Math.min(1, Math.max(0, window.scrollY / SHRINK_DISTANCE));
      setHeaderScrollProgress((current) =>
        Math.abs(current - nextProgress) > 0.001 ? nextProgress : current
      );
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`top-nav ${headerScrollProgress > 0.08 ? "is-scrolled" : ""}`}
      style={
        {
          "--nav-scroll-progress": headerScrollProgress
        } as CSSProperties
      }
    >
      <div className="container nav-inner">{children}</div>
    </header>
  );
}
