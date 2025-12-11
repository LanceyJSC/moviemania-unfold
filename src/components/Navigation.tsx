
import { Link, useLocation } from "react-router-dom";
import { Home, Search, User, LogIn, Film, Tv, MapPin, LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfileContext } from "@/contexts/ProfileContext";

export const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfileContext();
  
  // Get stable profile label - use cached profile from context, truncate if too long
  const profileLabel = profile?.username 
    ? (profile.username.length > 8 ? profile.username.slice(0, 8) : profile.username)
    : "Profile";
  
  const navItems = user ? [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV" },
    { path: "/gallery", icon: LayoutGrid, label: "Gallery" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/profile", icon: User, label: profileLabel }
  ] : [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/local", icon: MapPin, label: "Local" },
    { path: "/auth", icon: LogIn, label: "Sign In" }
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-cinema-black border-t border-border" 
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div 
        className="grid py-2"
        style={{ 
          gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 ${
                isActive ? 'text-cinema-red' : 'text-white/70'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
