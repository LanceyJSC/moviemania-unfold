import { Link } from "react-router-dom";

export const MobileBrandHeader = () => {
  return (
    <header className="md:hidden sticky top-0 z-50 bg-cinema-black border-b border-border">
      <div className="flex items-center justify-start h-12 px-4">
        <Link to="/" className="inline-flex items-center gap-px">
          <img src="/sceneburn-icon.png" alt="SceneBurn" className="h-7 w-7 rounded" />
          <h1 className="font-cinematic text-lg tracking-wider text-foreground">
            SCENE<span className="text-cinema-red">BURN</span>
          </h1>
        </Link>
      </div>
    </header>
  );
};
