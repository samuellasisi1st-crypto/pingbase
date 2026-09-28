import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("pingbase-theme", next ? "dark" : "light");
    setDark(next);
  };
  return { dark, toggle };
}

export function ThemeToggle({ expanded, className = "" }: { expanded?: boolean; className?: string }) {
  const { dark, toggle } = useTheme();
  const label = dark ? "Light mode" : "Dark mode";
  return (
    <button type="button" title={label} aria-label={label} onClick={toggle}
      className={`flex h-8 items-center gap-2 rounded-sm text-[12px] text-secondary hover:bg-hover hover:text-foreground ${expanded ? "w-full justify-start px-2.5" : "w-full justify-center"} ${className}`}>
      {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      {expanded && <span>{label}</span>}
    </button>
  );
}
