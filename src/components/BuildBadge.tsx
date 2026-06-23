const build = process.env.NEXT_PUBLIC_BUILD_NUMBER;
const branch = process.env.NEXT_PUBLIC_BRANCH;

export default function BuildBadge() {
  if (!build || !branch || branch === "main") return null;
  return (
    <div className="fixed bottom-2 right-2 z-50 rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-white/80 select-none">
      {branch} · {build}
    </div>
  );
}
