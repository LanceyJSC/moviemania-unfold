import { Link, useLocation } from "react-router-dom";
import { Home, Search, Film, Tv, LayoutGrid, User, LogIn, Bell, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfileContext } from "@/contexts/ProfileContext";

export const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfileContext();

  const navItems = user
    ? [
        { path: "/", icon: Home, label: "Home" },
        { path: "/movies", icon: Film, label: "Movies" },
        { path: "/tv-shows", icon: Tv, label: "TV Shows" },
        { path: "/collection", icon: LayoutGrid, label: "Collection" },
        { path: "/activity", icon: Activity, label: "Activity" },
      ]
    : [
        { path: "/", icon: Home, label: "Home" },
        { path: "/movies", icon: Film, label: "Movies" },
        { path: "/tv-shows", icon: Tv, label: "TV Shows" },
      ];

  const rightItems = user
    ? [
        { path: "/search", icon: Search, label: "Search" },
        { path: "/notifications", icon: Bell, label: "Notifications" },
        { path: "/profile", icon: User, label: profile?.username || "Profile" },
      ]
    : [
        { path: "/search", icon: Search, label: "Search" },
        { path: "/auth", icon: LogIn, label: "Sign In" },
      ];

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-cinema-black/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-cinematic text-2xl text-cinema-red tracking-wider">
              CINESCOPE
            </span>
          </Link>

          {/* Main Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-cinema-red/20 text-cinema-red"
                        : "text-foreground/70 hover:text-foreground hover:bg-foreground/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Items */}
          <div className="flex items-center space-x-2">
            {rightItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-cinema-red/20 text-cinema-red"
                        : "text-foreground/70 hover:text-foreground hover:bg-foreground/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium hidden lg:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};