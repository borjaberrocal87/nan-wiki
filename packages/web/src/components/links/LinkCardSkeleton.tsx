export default function LinkCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest border border-border-color rounded p-4">
      <div className="mb-3">
        <div className="skeleton w-[48px] h-[14px]" />
      </div>

      <div className="skeleton h-4 mb-2 w-[90%]" />
      <div className="skeleton h-4 mb-3 w-[70%]" />

      <div className="skeleton h-[10px] mb-3 w-full" />

      <div className="skeleton h-[10px] w-[50%]" />
    </div>
  );
}
