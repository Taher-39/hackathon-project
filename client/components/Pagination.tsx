import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="p-2 border rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {pages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
        className="p-2 border rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
