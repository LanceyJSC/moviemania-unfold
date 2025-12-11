
import { Link, useLocation } from "react-router-dom";
import { Home, Search, User, LogIn, Film, Tv, MapPin, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  
  const navItems = user ? [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV" },
    { path: "/gallery", icon: LayoutGrid, label: "Gallery" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/profile", icon: User, label: "Profile" }
  ] : [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/local", icon: MapPin, label: "Local" },
    { path: "/auth", icon: LogIn, label: "Sign In" }
  ];

  // Get stable profile label - only show username once profile is loaded
  const getProfileLabel = () => {
    if (profileLoading) return "Profile";
    return profile?.username || "Profile";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cinema-black/95 border-t border-border backdrop-blur-sm" 
         style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
      <div className="flex items-center justify-around py-2 px-1 iphone-65:py-3 iphone-65:px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const displayLabel = item.path === '/profile' ? getProfileLabel() : item.label;
          
          return (
            <Link key={item.path} to={item.path} className="flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center justify-center space-y-1 h-auto py-2 px-1 w-full min-h-[50px] iphone-65:min-h-[56px] iphone-65:py-3 iphone-65:px-2 touch-target bg-transparent hover:bg-transparent active:scale-95 transition-transform ${
                  isActive 
                    ? 'text-cinema-red' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 iphone-65:h-6 iphone-65:w-6 flex-shrink-0" />
                <span className="text-[10px] iphone-65:text-xs font-medium leading-none text-center truncate max-w-full">
                  {displayLabel}
                </span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
