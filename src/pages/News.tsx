import { Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import { DesktopHeader } from "@/components/DesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { NewsCard } from "@/components/NewsCard";
import { SEOHead } from "@/components/SEOHead";
import { usePublishedNews } from "@/hooks/useNews";

const News = () => {
  const { data: articles, isLoading, error } = usePublishedNews();

  return (
    <div className="min-h-screen bg-background pb-24 2xl:pb-0">
      <SEOHead
        title="Entertainment News | SceneBurn"
        description="Latest movie and TV show news from the entertainment industry"
        url="/news"
      />
      <DesktopHeader />
      <MobileHeader title="News" />

      <div className="max-w-7xl mx-auto px-4 2xl:px-6 pt-4 pb-8 2xl:pt-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Newspaper className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-cinematic text-foreground tracking-wide">
              Entertainment News
            </h1>
            <p className="text-muted-foreground text-sm">
              Latest updates from the movie and TV world
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load news articles</p>
          </div>
        )}

        {/* News Grid */}
        {articles && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {articles && articles.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No news articles yet</p>
            <p className="text-sm text-muted-foreground">
              Check back soon for the latest entertainment news
            </p>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default News;
