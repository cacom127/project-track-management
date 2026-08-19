import { useEffect, useRef, useState } from "react";

export type FilterDropdownOption = {
  value: string;
  label: string;
};

type FilterDropdownProps = {
  label: string;
  options: FilterDropdownOption[];
  value: string[];
  onChange: (selected: string[]) => void;
};

/** UI-PROJ-01-8: dropdown button + checkbox panel, thay `<select multiple>`.
 * UI-PROJ-01-12 (CHANGE-014): thêm ô tìm kiếm lọc option (client-side) +
 * panel có max-height/scroll — cần khi catalog/tech tag nhiều giá trị. */
export function FilterDropdown({ label, options, value, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  function toggleOption(optionValue: string) {
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(next);
  }

  const buttonLabel = value.length > 0 ? `${label} (${value.length})` : label;
  const filteredOptions = search
    ? options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="filter-dropdown" ref={containerRef}>
      <button
        type="button"
        className="filter-dropdown-button"
        onClick={() => setOpen((prev) => !prev)}
      >
        {buttonLabel}
        <span className="filter-dropdown-chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="filter-dropdown-panel">
          {options.length > 8 && (
            <input
              type="text"
              className="filter-dropdown-search"
              placeholder="検索..."
              aria-label={`${label}を検索`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          )}
          <div className="filter-dropdown-options">
            {filteredOptions.map((option) => (
              <label key={option.value}>
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;
