
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, User, LogIn, Film, Tv, MapPin, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

export const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  
  const navItems = user ? [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/cinemas", icon: MapPin, label: "Cinemas" },
    { path: "/notifications", icon: Bell, label: "Notifications", badge: unreadCount },
    { path: "/profile", icon: User, label: "Profile" }
  ] : [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV Shows" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/auth", icon: LogIn, label: "Sign In" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cinema-black/95 border-t border-border backdrop-blur-sm" 
         style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
      <div className="flex items-center justify-around py-2 px-1 iphone-65:py-3 iphone-65:px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={item.path} to={item.path} className="flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className={`relative flex flex-col items-center space-y-1 h-auto py-2 px-1 w-full min-h-[50px] iphone-65:min-h-[56px] iphone-65:py-3 iphone-65:px-2 touch-target bg-transparent hover:bg-transparent active:scale-95 transition-transform ${
                  isActive 
                    ? 'text-cinema-red' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5 iphone-65:h-6 iphone-65:w-6 flex-shrink-0" />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[8px] flex items-center justify-center rounded-full"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] iphone-65:text-xs font-medium leading-none text-center">
                  {item.label}
                </span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
