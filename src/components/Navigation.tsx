
import { Link, useLocation } from "react-router-dom";
import { Home, Search, User, LogIn, Film, Tv, LayoutGrid } from "lucide-react";
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
    { path: "/search", icon: Search, label: "Search" },
    { path: "/collection", icon: LayoutGrid, label: "Collection" },
    { path: "/profile", icon: User, label: profileLabel }
  ] : [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/auth", icon: LogIn, label: "Sign In" }
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden" 
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)'
      }}
    >
      <div 
        className="grid py-2"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center justify-center py-1.5 min-w-0 min-h-[48px] touch-manipulation active:scale-95 ${
                isActive ? 'text-cinema-red' : 'text-white/70'
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5 flex-shrink-0" />
              <span className="text-[9px] font-medium text-center whitespace-nowrap truncate max-w-[48px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
