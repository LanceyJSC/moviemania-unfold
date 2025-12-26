import { Link } from "react-router-dom";

export const MobileBrandHeader = () => {
  return (
    <header className="2xl:hidden sticky top-0 z-50 bg-cinema-black border-b border-border">
      <div className="flex items-center justify-start h-12 px-4">
        <Link to="/" className="inline-flex items-center gap-0.5">
          <img src="/sceneburn-icon.png" alt="SceneBurn" className="h-9 w-9 rounded" />
          <h1 className="font-cinematic text-lg tracking-wider text-foreground leading-none">
            SCENE<span className="text-cinema-red">BURN</span>
          </h1>
        </Link>
      </div>
    </header>
  );
};
