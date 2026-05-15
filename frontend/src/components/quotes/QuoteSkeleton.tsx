type QuoteSkeletonGridProps = {
  count?: number;
};

const skeletonHeights = ["h-24", "h-32", "h-28", "h-36", "h-40", "h-44"];

export function QuoteSkeletonGrid({ count = 6 }: QuoteSkeletonGridProps) {
  return (
    <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`quote-skeleton-${index}`}
          className="mb-6 break-inside-avoid rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_40px_rgba(8,15,26,0.35)]"
        >
          <div className="space-y-3 animate-pulse">
            <div className="h-3 w-24 rounded-full bg-white/10" />
            <div className={`rounded-xl bg-white/10 ${skeletonHeights[index % skeletonHeights.length]}`} />
            <div className="h-3 w-20 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
