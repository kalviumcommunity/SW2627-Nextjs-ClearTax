"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ArrowDown, Play } from "lucide-react";
import Link from "next/link";

export default function ScrollAnimation() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);

  const [loadProgress, setLoadProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [activeFrame, setActiveFrame] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const totalFrames = 39;

  // Preload all frames
  useEffect(() => {
    let loadedCount = 0;
    const tempImages = [];

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const num = String(i).padStart(3, "0");
      img.src = `/animation-frames/ezgif-frame-${num}.jpg`;

      img.onload = () => {
        loadedCount++;
        setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
        if (loadedCount === totalFrames) {
          setLoaded(true);
        }
      };

      img.onerror = () => {
        loadedCount++;
        setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
        if (loadedCount === totalFrames) {
          setLoaded(true);
        }
      };

      tempImages.push(img);
    }
    imagesRef.current = tempImages;
  }, []);

  // Handle Scroll and Draw to Canvas
  useEffect(() => {
    if (!loaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;

    const renderFrame = (index) => {
      const img = imagesRef.current[index];
      if (!img || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const imgWidth = img.naturalWidth || img.width || 800;
      const imgHeight = img.naturalHeight || img.height || 600;

      const hRatio = width / imgWidth;
      const vRatio = height / imgHeight;
      const ratio = Math.min(hRatio, vRatio);

      const newWidth = imgWidth * ratio;
      const newHeight = imgHeight * ratio;

      const x = (width - newWidth) / 2;
      const y = (height - newHeight) / 2;

      ctx.drawImage(img, 0, 0, imgWidth, imgHeight, x, y, newWidth, newHeight);
    };

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerTop = rect.top;
      const containerHeight = rect.height;
      const windowHeight = window.innerHeight;

      // Calculate progress of scroll through the container
      const progress = -containerTop / (containerHeight - windowHeight);
      const clampedProgress = Math.min(Math.max(progress, 0), 1);

      setScrollProgress(clampedProgress);

      // Frame mapping: progress 0.0 to 0.6 maps to frames 0 to 38
      // Beyond 0.6, it stays locked on the final frame
      let frameIndex = 0;
      if (clampedProgress < 0.6) {
        frameIndex = Math.floor((clampedProgress / 0.6) * (totalFrames - 1));
      } else {
        frameIndex = totalFrames - 1;
      }

      setActiveFrame(frameIndex);

      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        renderFrame(frameIndex);
      });
    };

    const handleResize = () => {
      renderFrame(activeFrame);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    // Initial render
    renderFrame(0);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loaded, activeFrame]);

  // Calculate Opacity values based on scroll progress
  // Intro overlay card: visible at start, fades out by 0.15 progress
  const introOpacity = Math.max(0, 1 - scrollProgress / 0.15);
  const introTransform = `translateY(${-scrollProgress * 50}px)`;

  // Hero overlay card: fades in from 0.6 to 0.75 progress, remains until 0.9, fades out by 0.98
  let heroOpacity = 0;
  if (scrollProgress >= 0.6 && scrollProgress < 0.9) {
    heroOpacity = Math.min(1, (scrollProgress - 0.6) / 0.15);
  } else if (scrollProgress >= 0.9) {
    heroOpacity = Math.max(0, 1 - (scrollProgress - 0.9) / 0.08);
  }
  const heroTransform = `translateY(${(0.75 - scrollProgress) * 40}px)`;

  // Full sticky container: fades out at the very end of scroll (from 0.92 to 1.0)
  const stickyOpacity = scrollProgress >= 0.92 ? Math.max(0, 1 - (scrollProgress - 0.92) / 0.08) : 1;

  return (
    <div ref={containerRef} className="scroll-story-container">
      <div
        className="scroll-story-sticky"
        style={{
          opacity: stickyOpacity,
          pointerEvents: stickyOpacity === 0 ? "none" : "auto"
        }}
      >
        {!loaded ? (
          <div className="canvas-loader-fullscreen">
            <Loader2 className="animate-spin w-10 h-10 text-accent mb-3" />
            <p className="text-base font-semibold text-muted-foreground">Initializing ClearTax Animation ({loadProgress}%)</p>
          </div>
        ) : (
          <>
            {/* Fullscreen Canvas Background */}
            <canvas ref={canvasRef} className="scroll-story-canvas" />

            {/* Animation Progress Tracker */}
            <div className="scroll-story-indicator">
              <span className="scroll-story-badge">
                {scrollProgress < 0.6 ? `Analyzing: Frame ${activeFrame + 1}/39` : "Extraction Complete"}
              </span>
              <div className="scroll-story-progressbar">
                <div
                  className="scroll-story-progressfill"
                  style={{ width: `${Math.min(100, (scrollProgress / 0.6) * 100)}%` }}
                />
              </div>
            </div>

            {/* Content Overlays */}
            <div className="scroll-story-overlay">

              {/* Intro Overlay Card (visible initially) */}
              <div
                className="scroll-story-content scroll-story-content--intro"
                style={{
                  opacity: introOpacity,
                  transform: introTransform,
                  pointerEvents: introOpacity > 0 ? "auto" : "none"
                }}
              >
                <span className="eyebrow">ClearTax Workspace</span>
                <h1 className="scroll-story-heading">Smart Invoice Parsing</h1>
                <p className="scroll-story-copy">
                  Welcome to the future of data extraction. Scroll down to experience the OCR intelligence analyzing documents in real time.
                </p>
                <div className="scroll-prompt-bubble animate-bounce">
                  <ArrowDown className="w-5 h-5 text-accent" />
                  <span>Scroll down to start</span>
                </div>
              </div>

              {/* Hero Overlay Card (visible after animation completes) */}
              <div
                className="scroll-story-content scroll-story-content--hero"
                style={{
                  opacity: heroOpacity,
                  transform: heroTransform,
                  pointerEvents: heroOpacity > 0 ? "auto" : "none"
                }}
              >
                <span className="eyebrow">ClearTax Workspace</span>
                <h1 className="scroll-story-heading">Invoice operations, organized from one workspace.</h1>
                <p className="scroll-story-copy">
                  The foundation, dashboard, and upload flow now share one visual system so the product already feels coherent.
                </p>
                <div className="hero-actions justify-center w-full">
                  <Link className="primary-action" href="/dashboard">
                    Open Dashboard
                  </Link>
                  <Link className="secondary-action" href="/upload">
                    Go To Upload
                  </Link>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
