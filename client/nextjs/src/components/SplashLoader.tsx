"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function SplashLoader() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Detect dark mode theme dynamically from the root class
    const checkTheme = () => {
      const hasDarkClass =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark");
      setIsDark(hasDarkClass);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Start fade out transition after 2.4 seconds (zoom anim settles)
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2400);

    // Completely remove splash element from DOM after fade out completes (3.0 seconds)
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!showSplash) return null;

  return (
    <div
      className={`splash-container ${isDark ? "dark" : "light"} ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
    >
      <style>{`
        .splash-container {
          background-color: #ffffff;
        }
        
        /* Instant CSS matching of document/body theme classes to eliminate hydration flashes */
        html.dark .splash-container,
        body.dark .splash-container,
        .splash-container.dark {
          background-color: #050505 !important;
        }

        .logo-wrapper {
          position: relative;
          width: 24vw;
          max-width: 180px;
          aspect-ratio: 1/1;
          display: flex;
          margin-bottom: 8vw;
          align-items: center;
          justify-content: center;
          perspective: 1000px;
        }
        .logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform-style: preserve-3d;
          animation: isometric3DZoom 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          filter: drop-shadow(1px 1px 0px rgba(0,0,0,0.06)) 
                  drop-shadow(2px 2px 3px rgba(0,0,0,0.08)) 
                  drop-shadow(5px 5px 8px rgba(0,0,0,0.08)) 
                  drop-shadow(10px 10px 16px rgba(0,0,0,0.06));
        }
        
        html.dark .logo-img,
        body.dark .logo-img,
        .splash-container.dark .logo-img {
          filter: drop-shadow(0 0 2px rgba(255,255,255,0.1))
                  drop-shadow(0 4px 12px rgba(255,255,255,0.05))
                  drop-shadow(0 15px 30px rgba(0,0,0,0.7)) !important;
        }

        .logo-shine {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
          -webkit-mask-image: url('/logos/thunder.png');
          mask-image: url('/logos/thunder.png');
          -webkit-mask-size: contain;
          mask-size: contain;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-position: center;
          mask-position: center;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255, 255, 255, 0.0) 35%,
            rgba(255, 255, 255, 0.75) 48%,
            rgba(255, 255, 255, 0.95) 50%,
            rgba(255, 255, 255, 0.75) 52%,
            rgba(255, 255, 255, 0.0) 65%,
            transparent 70%
          );
          background-size: 200% 100%;
          background-position: 150% 0%;
          transform-style: preserve-3d;
          animation: 
            shine3DZoom 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            shineSweep 3.5s infinite ease-in-out;
        }

        html.dark .logo-shine,
        body.dark .logo-shine,
        .splash-container.dark .logo-shine {
          background-image: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255, 255, 255, 0.0) 35%,
            rgba(255, 255, 255, 0.4) 48%,
            rgba(255, 255, 255, 0.6) 50%,
            rgba(255, 255, 255, 0.4) 52%,
            rgba(255, 255, 255, 0.0) 65%,
            transparent 70%
          ) !important;
          animation: 
            shine3DZoom 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            shineSweep 3.5s infinite ease-in-out !important;
        }

        @keyframes isometric3DZoom {
          0% {
            transform: scale(1.18);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes shine3DZoom {
          0% {
            transform: scale(1.18) translateZ(10px);
          }
          100% {
            transform: scale(1) translateZ(10px);
          }
        }
        @keyframes shineSweep {
          0% {
            background-position: 150% 0%;
          }
          20% {
            background-position: 150% 0%;
          }
          80% {
            background-position: -50% 0%;
          }
          100% {
            background-position: -50% 0%;
          }
        }
      `}</style>
      <div className="logo-wrapper">
        <Image
          src="/logos/thunder.png"
          alt="THUNDER Stack Logo"
          width={200}
          height={200}
          className="logo-img"
          unoptimized
        />
        <div className="logo-shine" />
      </div>
    </div>
  );
}
