import { useState } from "react";
import { format } from "date-fns";
import { Newspaper, Eye, Clock, RefreshCw, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAdminNews, useFetchNews } from "@/hooks/useNews";

export const AdminNewsTab = () => {
  const { data: articles, isLoading } = useAdminNews();
  const fetchNews = useFetchNews();
  const [isFetching, setIsFetching] = useState(false);

  const handleFetchNews = async () => {
    setIsFetching(true);
    try {
      const result = await fetchNews.mutateAsync();
      toast.success(`Fetched ${result.imported || 0} new articles`);
    } catch (error) {
      toast.error("Failed to fetch news");
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  const articlesWithImages = articles?.filter(a => a.featured_image) || [];
  const articlesWithoutImages = articles?.filter(a => !a.featured_image) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">News Articles</h2>
          <p className="text-sm text-muted-foreground">
            Automatically updated at 5:00 AM and 4:00 PM UTC daily
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <Clock className="h-3 w-3" />
            Auto-sync enabled
          </Badge>
          <Button 
            onClick={handleFetchNews} 
            disabled={isFetching}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? "Fetching..." : "Fetch Now"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/60">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{articles?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total Articles</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold text-foreground">{articlesWithImages.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">With Images</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">{articlesWithoutImages.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">No Image</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Articles List */}
      {articles && articles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Current Articles
          </h3>
          {articles.map((article) => (
            <Card key={article.id} className="bg-card/60 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1 min-w-0">
                    {article.featured_image ? (
                      <img
                        src={article.featured_image}
                        alt=""
                        className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-14 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate mb-1">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {article.source_name && (
                          <Badge variant="secondary" className="text-xs">
                            {article.source_name}
                          </Badge>
                        )}
                        <span>
                          {article.published_at 
                            ? format(new Date(article.published_at), "MMM d, yyyy")
                            : format(new Date(article.created_at), "MMM d, yyyy")
                          }
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {article.source_url}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      window.open(`/news/${article.slug}`, "_blank")
                    }
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {articles && articles.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No news articles yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Click "Fetch Now" to get the latest entertainment news
          </p>
        </div>
      )}
    </div>
  );
};
