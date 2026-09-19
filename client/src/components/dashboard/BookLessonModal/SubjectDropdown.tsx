import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, ChevronDown } from "lucide-react";

interface SubjectDropdownProps {
  subjects: string[];
  value: string;
  onChange: (subject: string) => void;
}

const SubjectDropdown = ({ subjects, value, onChange }: SubjectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {subjects.length > 0 ? (
        <>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
            className={`flex w-full cursor-pointer items-center justify-between rounded-xl border bg-slate-50 p-2.5 pl-9 pr-3 text-left text-xs text-slate-900 transition-colors focus:outline-hidden dark:bg-slate-950 dark:text-slate-100 ${
              isOpen
                ? "border-blue-600 bg-white dark:border-blue-600"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
            }`}
          >
            <span className="truncate">{value}</span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-slate-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              {subjects.map((sub) => {
                const isActive = sub === value;
                return (
                  <li key={sub} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(sub);
                        setIsOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        isActive
                          ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="truncate">{sub}</span>
                      {isActive && <Check size={14} className="shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 pl-9 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          No subjects listed for this teacher
        </div>
      )}
      <BookOpen
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  );
};

export default SubjectDropdown;
