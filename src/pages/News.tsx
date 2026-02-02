import { Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import { DesktopHeader } from "@/components/DesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { MagazineHero } from "@/components/MagazineHero";
import { FeaturedNewsCard } from "@/components/FeaturedNewsCard";
import { NewsCard } from "@/components/NewsCard";
import { SEOHead } from "@/components/SEOHead";
import { usePublishedNews } from "@/hooks/useNews";

const News = () => {
  const { data: articles, isLoading, error } = usePublishedNews();

  // Prioritize articles with images for hero/featured spots
  const articlesWithImages = articles?.filter(a => a.featured_image) || [];
  const articlesWithoutImages = articles?.filter(a => !a.featured_image) || [];
  const sortedArticles = [...articlesWithImages, ...articlesWithoutImages];
  
  // Split articles into hero, featured, and grid sections
  const heroArticle = sortedArticles[0];
  const featuredArticles = sortedArticles.slice(1, 5);
  const gridArticles = sortedArticles.slice(5);

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
        <div className="flex items-center gap-3 mb-8">
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
          <div className="space-y-8">
            <Skeleton className="aspect-[3/1] rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="aspect-[4/3] rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video rounded-xl" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load news articles</p>
          </div>
        )}

        {/* Magazine Layout */}
        {articles && articles.length > 0 && (
          <div className="space-y-8">
            {/* Hero Article */}
            {heroArticle && <MagazineHero article={heroArticle} />}

            {/* Featured Articles (2x2 grid) */}
            {featuredArticles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredArticles.map((article) => (
                  <FeaturedNewsCard key={article.id} article={article} />
                ))}
              </div>
            )}

            {/* Grid Articles */}
            {gridArticles.length > 0 && (
              <>
                <div className="border-t border-border pt-8 mt-4">
                  <h2 className="text-xl font-semibold text-foreground mb-6">Latest Headlines</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {gridArticles.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              </>
            )}
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
