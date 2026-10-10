"use client";

import { useEffect, useRef } from "react";

interface AdsterraAdProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function AdsterraAd({ className, style }: AdsterraAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing children to prevent duplicate ads
    container.innerHTML = "";

    // 1. Create the container div required by Adsterra
    const adContainer = document.createElement("div");
    adContainer.id = "container-929e4c98d79b2996752a09c3f536ae5d";

    // 2. Create the script element with matching attributes
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = "https://pl31760483.profitableratecpmnetwork.com/929e4c98d79b2996752a09c3f536ae5d/invoke.js";

    container.appendChild(adContainer);
    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "30px auto",
        minHeight: "60px",
        width: "100%",
        textAlign: "center",
        overflow: "hidden",
        ...style,
      }}
      ref={containerRef}
    />
  );
}
