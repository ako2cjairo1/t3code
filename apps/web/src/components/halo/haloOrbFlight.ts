const flown = new Set<string>();
const FRESH_MS = 5000;

/**
 * Ref for an approval card's orb: once per request, a ghost of the header island's orb flies
 * from the island to this orb (transform only, one shot). The ghost is fixed to the viewport so
 * the timeline scroller can't clip it. Skipped for stale requests, off-screen ends, and reduced motion.
 */
export function haloOrbFlight(key: string, createdAt: string) {
  return (target: HTMLElement | null) => {
    if (target === null || flown.has(key) || !target.closest("[data-timeline-row-id]")) return;
    if (Date.now() - Date.parse(createdAt) > FRESH_MS) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Measure once the virtualized row has been laid out at its real position; a row that
    // unmounts before then leaves the flight to the one that replaces it.
    target.style.opacity = "0";
    requestAnimationFrame(() => requestAnimationFrame(() => fly(key, target)));
  };
}

function fly(key: string, target: HTMLElement) {
  const land = () => {
    target.style.opacity = "";
  };
  const source = document.querySelector<HTMLElement>("[data-halo-island] [data-halo-orb]");
  if (source === null || !target.isConnected || flown.has(key)) return land();
  flown.add(key);
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!onScreen(from) || !onScreen(to)) return land();
  const ghost = source.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
    margin: "0",
    zIndex: "60",
    pointerEvents: "none",
  });
  ghost.dataset.state = target.dataset.state ?? "approval";
  document.body.append(ghost);
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const scale = from.width / Math.max(1, to.width);
  const flight = ghost.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 10}px) scale(1.25)`, offset: 0.45 },
      { transform: "none" },
    ],
    { duration: 600, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
  );
  flight.onfinish = flight.oncancel = () => {
    ghost.remove();
    land();
  };
}

function onScreen(rect: DOMRect): boolean {
  return (
    rect.width > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}
