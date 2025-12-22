import { Link, useLocation } from "react-router-dom";
import { Home, Search, Film, Tv, LayoutGrid, User, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const DesktopHeader = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = user ? [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV Shows" },
    { path: "/collection", icon: LayoutGrid, label: "Collection" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/profile", icon: User, label: "Profile" }
  ] : [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV Shows" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/auth", icon: LogIn, label: "Sign In" }
  ];

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/sceneburn-icon.png" alt="SceneBurn" className="h-10 w-10 rounded-lg" />
          <h1 className="font-cinematic text-2xl tracking-wider text-foreground">
            SCENE<span className="text-cinema-red">BURN</span>
          </h1>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-cinema-red bg-cinema-red/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
