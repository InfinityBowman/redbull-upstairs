import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Overview" },
  { to: "/complaints", label: "311 Complaints" },
  { to: "/transit", label: "Transit Equity" },
  { to: "/vacancy", label: "Vacancy Triage" },
] as const;

export function Nav() {
  const { location } = useRouterState();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-5">
        <Link to="/" className="group flex items-center gap-2.5 font-bold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground shadow-sm">
            STL
          </div>
          <span className="text-foreground transition-colors group-hover:text-primary">
            Urban Analytics
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const isActive =
              link.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
