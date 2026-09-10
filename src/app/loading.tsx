export default function HomeLoading() {
  // The home route is an immersive Mediai feed. Do not flash the legacy
  // source-browser skeleton (or app chrome) while the first feed page loads.
  return <div className="fixed inset-0 z-[99] bg-black" aria-label="Loading Mediai feed" />;
}
