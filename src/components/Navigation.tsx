
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, User, LogIn, Film, Tv, LayoutGrid, MoreHorizontal, Newspaper, BookOpen, Activity, ListChecks, Users, BarChart3, Award, Bell, Crown, Gift, Shield, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfileContext } from "@/contexts/ProfileContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const MoreMenuItem = ({ path, icon: Icon, label, onClose }: { path: string; icon: any; label: string; onClose: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  
  return (
    <Link
      to={path}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-manipulation active:scale-[0.98]",
        isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
};

export const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfileContext();
  const { role } = useUserRole();
  const [showMore, setShowMore] = useState(false);
  
  const profileLabel = profile?.username 
    ? (profile.username.length > 8 ? profile.username.slice(0, 8) : profile.username)
    : "Profile";
  
  const navItems = user ? [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/collection", icon: LayoutGrid, label: "Collection" },
  ] : [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/auth", icon: LogIn, label: "Sign In" }
  ];

  const moreItems = user ? [
    { path: "/profile", icon: User, label: profileLabel },
    { path: "/notifications", icon: Bell, label: "Notifications" },
    { path: "/activity", icon: Activity, label: "Activity" },
    { path: "/lists", icon: ListChecks, label: "Lists" },
    { path: "/my-reviews", icon: BookOpen, label: "My Reviews" },
    { path: "/stats", icon: BarChart3, label: "Stats" },
    { path: "/achievements", icon: Award, label: "Achievements" },
    { path: "/wrapped", icon: Gift, label: "Wrapped" },
    { path: "/recommendations", icon: BarChart3, label: "Recommendations" },
    { path: "/members", icon: Users, label: "Members" },
    { path: "/news", icon: Newspaper, label: "News" },
    { path: "/blog", icon: BookOpen, label: "Blog" },
    { path: "/pro", icon: Crown, label: "Pro" },
    ...(role === 'admin' ? [{ path: "/admin", icon: Shield, label: "Admin" }] : []),
  ] : [
    { path: "/news", icon: Newspaper, label: "News" },
    { path: "/blog", icon: BookOpen, label: "Blog" },
    { path: "/members", icon: Users, label: "Members" },
    { path: "/genres", icon: Film, label: "Genres" },
  ];

  const isMoreActive = moreItems.some(item => location.pathname === item.path);

  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden" 
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)'
        }}
      >
        <div 
          className="grid py-2"
          style={{ gridTemplateColumns: `repeat(${navItems.length + (user ? 1 : 0)}, 1fr)` }}
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
          
          {user && (
            <button
              onClick={() => setShowMore(true)}
              className={`flex flex-col items-center justify-center py-1.5 min-w-0 min-h-[48px] touch-manipulation active:scale-95 ${
                isMoreActive ? 'text-cinema-red' : 'text-white/70'
              }`}
            >
              <MoreHorizontal className="h-5 w-5 mb-0.5 flex-shrink-0" />
              <span className="text-[9px] font-medium text-center whitespace-nowrap">
                More
              </span>
            </button>
          )}
        </div>
      </nav>

      <Sheet open={showMore} onOpenChange={setShowMore}>
        <SheetContent side="bottom" className="bg-background border-t border-border rounded-t-2xl max-h-[70vh]">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-foreground font-cinematic tracking-wider">More</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto space-y-1 pb-8">
            {moreItems.map((item) => (
              <MoreMenuItem 
                key={item.path} 
                path={item.path} 
                icon={item.icon} 
                label={item.label}
                onClose={() => setShowMore(false)}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
