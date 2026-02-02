import { Link } from "react-router-dom";

export const MobileBrandHeader = () => {
  return (
    <header 
      className="2xl:hidden sticky top-0 z-50 bg-cinema-black border-b border-border"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-start h-11 px-3">
        <Link to="/" className="inline-flex items-center gap-0.5">
          <img src="/sceneburn-icon.png" alt="SceneBurn" className="h-8 w-8 rounded" />
          <span className="font-cinematic text-base tracking-wider text-foreground leading-none">
            SCENE<span className="text-cinema-red">BURN</span>
          </span>
        </Link>
      </div>
    </header>
  );
};
