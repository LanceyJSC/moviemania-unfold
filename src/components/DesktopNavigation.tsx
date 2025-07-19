
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const DesktopNavigation = () => {
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
    <nav className="hidden md:flex items-center space-x-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant="ghost"
              className={`flex items-center space-x-2 ${
                isActive ? 'text-cinema-red hover:text-cinema-red' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
};
