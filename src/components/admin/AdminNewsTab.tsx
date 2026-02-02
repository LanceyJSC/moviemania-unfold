import { format } from "date-fns";
import { Newspaper, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAdminNews } from "@/hooks/useNews";

export const AdminNewsTab = () => {
  const { data: articles, isLoading } = useAdminNews();

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
        <Badge variant="outline" className="gap-2">
          <Clock className="h-3 w-3" />
          Auto-sync enabled
        </Badge>
      </div>

      {/* Schedule Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm">Automatic News Sync</h3>
              <p className="text-sm text-muted-foreground mt-1">
                News is automatically fetched from Variety, Deadline, THR, Entertainment Weekly, 
                Screen Rant, and Collider twice daily. Old articles are replaced with fresh content.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            Current Articles ({articles.length})
          </h3>
          {articles.map((article) => (
            <Card key={article.id} className="bg-card/60 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1 min-w-0">
                    {article.featured_image && (
                      <img
                        src={article.featured_image}
                        alt=""
                        className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate mb-1">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {article.source_name && (
                          <span>{article.source_name}</span>
                        )}
                        <span>•</span>
                        <span>
                          {article.published_at 
                            ? format(new Date(article.published_at), "MMM d, yyyy 'at' h:mm a")
                            : format(new Date(article.created_at), "MMM d, yyyy 'at' h:mm a")
                          }
                        </span>
                      </div>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {article.excerpt}
                        </p>
                      )}
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
          <p className="text-sm text-muted-foreground">
            Articles will appear automatically at the next scheduled sync
          </p>
        </div>
      )}
    </div>
  );
};
