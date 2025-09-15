import { useState, useEffect } from "react";
import { Heart, Clock, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/MovieCard";
import { Navigation } from "@/components/Navigation";
import { MobileHeader } from "@/components/MobileHeader";
import { EnhancedWatchlist } from "@/components/EnhancedWatchlist";
import { AdminMakeButton } from "@/components/AdminMakeButton";
import { useSupabaseUserState } from "@/hooks/useSupabaseUserState";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const Watchlist = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Watchlist" />
      
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-cinematic text-foreground tracking-wide mb-2">
                Watchlist
              </h1>
              <p className="text-muted-foreground">Organize your movie collection intelligently</p>
            </div>
            {user && <AdminMakeButton />}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {!user ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Sign in to access your smart watchlist
            </h3>
            <p className="text-muted-foreground mb-6">
              Create collections, set priorities, and organize your movies like never before
            </p>
            <Link to="/auth">
              <Button className="bg-cinema-red hover:bg-cinema-red/90">
                Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <EnhancedWatchlist />
        )}
      </div>

      {/* Mobile Navigation */}
      <Navigation />
    </div>
  );
};

export default Watchlist;