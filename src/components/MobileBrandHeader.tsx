import { Link, useLocation } from "react-router-dom";
import { Film, Tv } from "lucide-react";
import { cn } from "@/lib/utils";

export const MobileBrandHeader = () => {
  const { pathname } = useLocation();
  const isMovies = pathname.startsWith("/movies");
  const isTV = pathname.startsWith("/tv-shows");

  return (
    <header
      className="md:hidden sticky top-0 z-50 bg-cinema-black border-b border-border"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between gap-2 h-11 px-3">
        <Link to="/" className="inline-flex items-center gap-0.5 shrink-0">
          <img src="/sceneburn-icon.png" alt="SceneBurn" className="h-8 w-8 rounded" />
          <span className="font-cinematic text-base tracking-wider text-foreground leading-none">
            SCENE<span className="text-cinema-red">BURN</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full bg-muted/40 p-0.5 border border-border">
          <Link
            to="/movies"
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-colors",
              isMovies
                ? "bg-cinema-red text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isMovies ? "page" : undefined}
          >
            <Film className="h-3 w-3" />
            MOVIES
          </Link>
          <Link
            to="/tv-shows"
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-colors",
              isTV
                ? "bg-cinema-red text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isTV ? "page" : undefined}
          >
            <Tv className="h-3 w-3" />
            TV
          </Link>
        </nav>
      </div>
    </header>
  );
};
