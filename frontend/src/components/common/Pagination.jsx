import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Pagination({ page, pages, onPageChange }) {
  if (!pages || pages <= 1) return null;

  const goTo = (p) => {
    if (p >= 1 && p <= pages) onPageChange(p);
  };

  const renderPages = () => {
    const items = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(pages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      items.push(
        <button
          key={i}
          onClick={() => goTo(i)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            i === page
              ? "bg-primary-600 text-white"
              : "bg-white border border-gray-200 hover:bg-gray-50"
          }`}
        >
          {i}
        </button>,
      );
    }
    return items;
  };

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
      >
        <FiChevronLeft />
      </button>
      {renderPages()}
      <button
        onClick={() => goTo(page + 1)}
        disabled={page === pages}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
      >
        <FiChevronRight />
      </button>
    </div>
  );
}
