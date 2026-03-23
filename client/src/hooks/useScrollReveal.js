"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight IntersectionObserver hook that adds "visible" class
 * to elements with any of the reveal CSS classes when they scroll
 * into view. Drop-in replacement for GSAP ScrollTrigger.
 *
 * @param {Object} options
 * @param {string} options.selector - CSS selector for target elements (default: ".reveal, .reveal-right, .reveal-scale, .reveal-3d, .reveal-pop")
 * @param {number} options.threshold - IntersectionObserver threshold (default: 0.15)
 * @param {string} options.rootMargin - IntersectionObserver rootMargin (default: "0px 0px -40px 0px")
 */
export default function useScrollReveal({
  selector = ".reveal, .reveal-right, .reveal-scale, .reveal-3d, .reveal-pop",
  threshold = 0.15,
  rootMargin = "0px 0px -40px 0px",
} = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = el.querySelectorAll(selector);
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target); // only animate once
          }
        });
      },
      { threshold, rootMargin }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [selector, threshold, rootMargin]);

  return ref;
}
