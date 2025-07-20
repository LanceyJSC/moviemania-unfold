import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, User, LogIn, Film, Tv } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const IOSTabBar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const tabItems = user ? [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/watchlist", icon: Heart, label: "Watchlist" },
    { path: "/profile", icon: User, label: "Profile" }
  ] : [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV Shows" },
    { path: "/auth", icon: LogIn, label: "Sign In" }
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: `calc(80px + env(safe-area-inset-bottom))`
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className="flex-1 flex flex-col items-center min-w-0 touch-target"
            >
              <div className={cn(
                "flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200",
                "min-h-[60px] justify-center w-full max-w-[64px] mx-auto",
                isActive 
                  ? "text-primary transform scale-105" 
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}>
                <Icon 
                  className={cn(
                    "transition-all duration-200",
                    isActive ? "h-7 w-7" : "h-6 w-6"
                  )} 
                />
                <span className={cn(
                  "text-xs font-medium leading-none transition-all duration-200",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-primary rounded-full mt-1" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};