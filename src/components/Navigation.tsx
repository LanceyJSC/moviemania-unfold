
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const navItems = user ? [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/watchlist", icon: Heart, label: "Watchlist" },
    { path: "/profile", icon: User, label: "Profile" }
  ] : [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/auth", icon: LogIn, label: "Sign In" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-cinema-black/95 border-t border-border backdrop-blur-sm">
      <div className="flex items-center justify-around py-4 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={item.path} to={item.path} className="flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center space-y-2 h-auto py-3 px-2 w-full min-h-[60px] touch-target bg-transparent hover:bg-transparent ${
                  isActive 
                    ? 'text-cinema-red' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Icon className="h-6 w-6 flex-shrink-0" />
                <span className="text-xs font-medium leading-none">
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
