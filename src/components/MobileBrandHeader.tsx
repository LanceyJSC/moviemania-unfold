import { Link } from "react-router-dom";

export const MobileBrandHeader = () => {
  return (
    <header className="md:hidden sticky top-0 z-50 bg-cinema-black border-b border-border">
      <div className="flex items-center justify-center h-12">
        <Link to="/" className="flex items-center">
          <h1 className="font-cinematic text-lg tracking-wider text-foreground">
            SCENE<span className="text-cinema-red">BURN</span>
          </h1>
        </Link>
      </div>
    </header>
  );
};
