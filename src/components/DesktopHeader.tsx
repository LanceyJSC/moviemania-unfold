import { Link, useLocation } from "react-router-dom";
import {
  Home, Search, Film, Tv, LayoutGrid, User, LogIn, MoreHorizontal,
  Newspaper, BookOpen, Activity, ListChecks, Users, BarChart3, Award,
  Bell, Crown, Gift, Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const DesktopHeader = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { role } = useUserRole();

  const navItems = user ? [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV Shows" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/collection", icon: LayoutGrid, label: "Collection" },
    { path: "/profile", icon: User, label: "Profile" }
  ] : [
    { path: "/", icon: Home, label: "Home" },
    { path: "/movies", icon: Film, label: "Movies" },
    { path: "/tv-shows", icon: Tv, label: "TV Shows" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/auth", icon: LogIn, label: "Sign In" }
  ];

  const moreGroups: { label: string; items: { path: string; icon: any; label: string }[] }[] = user
    ? [
        {
          label: "Social",
          items: [
            { path: "/activity", icon: Activity, label: "Activity" },
            { path: "/members", icon: Users, label: "Members" },
            { path: "/lists", icon: ListChecks, label: "Lists" },
            { path: "/notifications", icon: Bell, label: "Notifications" },
          ],
        },
        {
          label: "You",
          items: [
            { path: "/my-reviews", icon: BookOpen, label: "My Reviews" },
            { path: "/stats", icon: BarChart3, label: "Stats" },
            { path: "/achievements", icon: Award, label: "Achievements" },
            { path: "/recommendations", icon: BarChart3, label: "Recommendations" },
            { path: "/wrapped", icon: Gift, label: "Wrapped" },
          ],
        },
        {
          label: "More",
          items: [
            { path: "/news", icon: Newspaper, label: "News" },
            { path: "/blog", icon: BookOpen, label: "Blog" },
            { path: "/pro", icon: Crown, label: "Pro" },
            ...(role === "admin" ? [{ path: "/admin", icon: Shield, label: "Admin" }] : []),
          ],
        },
      ]
    : [
        {
          label: "Explore",
          items: [
            { path: "/genres", icon: Film, label: "Genres" },
            { path: "/members", icon: Users, label: "Members" },
            { path: "/activity", icon: Activity, label: "Activity" },
            { path: "/lists", icon: ListChecks, label: "Lists" },
          ],
        },
        {
          label: "More",
          items: [
            { path: "/news", icon: Newspaper, label: "News" },
            { path: "/blog", icon: BookOpen, label: "Blog" },
            { path: "/pro", icon: Crown, label: "Pro" },
          ],
        },
      ];

  const isMoreActive = moreGroups.some((g) => g.items.some((i) => i.path === location.pathname));

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/sceneburn-icon.png" alt="SceneBurn" className="h-10 w-10 rounded-lg" />
          <span className="font-cinematic text-2xl tracking-wider text-foreground">
            SCENE<span className="text-cinema-red">BURN</span>
          </span>
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

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="More pages"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors outline-none ${
                isMoreActive
                  ? "text-cinema-red bg-cinema-red/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="text-sm font-medium">More</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover z-[60]">
              {moreGroups.map((group, gi) => (
                <div key={group.label}>
                  {gi > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </DropdownMenuLabel>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link to={item.path} className="flex items-center gap-2 cursor-pointer">
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
};
