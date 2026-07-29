import { Link, useLocation } from "react-router-dom";

const groups = [
  {
    title: "Discover",
    links: [
      { to: "/movies", label: "Movies" },
      { to: "/tv-shows", label: "TV Shows" },
      { to: "/genres", label: "Genres" },
      { to: "/search", label: "Search" },
    ],
  },
  {
    title: "Community",
    links: [
      { to: "/members", label: "Members" },
      { to: "/activity", label: "Activity" },
      { to: "/lists", label: "Lists" },
    ],
  },
  {
    title: "Read",
    links: [
      { to: "/blog", label: "Blog" },
      { to: "/news", label: "News" },
      { to: "/pro", label: "SceneBurn Pro" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms" },
      { to: "/privacy", label: "Privacy" },
    ],
  },
];

const HIDDEN_ON = ["/wrapped", "/auth"];

export const SiteFooter = () => {
  const { pathname } = useLocation();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer className="border-t border-border bg-background mt-12 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <img src="/sceneburn-icon.png" alt="SceneBurn logo" className="h-8 w-8 rounded-lg" />
              <span className="font-cinematic text-xl tracking-wider text-foreground">
                SCENE<span className="text-cinema-red">BURN</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Track what you watch. See what your people are watching.
            </p>
          </div>

          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground mb-3">
                {group.title}
              </h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-cinema-red transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
          © {new Date().getFullYear()} SceneBurn. Film and TV data provided by TMDB.
        </div>
      </div>
    </footer>
  );
};
