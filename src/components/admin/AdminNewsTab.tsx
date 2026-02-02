import { useState } from "react";
import { format } from "date-fns";
import {
  Newspaper,
  Download,
  Eye,
  Trash2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  useAdminNews,
  useFetchNews,
  usePublishNews,
  useUnpublishNews,
  useDeleteNews,
} from "@/hooks/useNews";

export const AdminNewsTab = () => {
  const { data: articles, isLoading } = useAdminNews();
  const fetchNews = useFetchNews();
  const publishNews = usePublishNews();
  const unpublishNews = useUnpublishNews();
  const deleteNews = useDeleteNews();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleFetchNews = async () => {
    try {
      const result = await fetchNews.mutateAsync();
      toast.success(result.message || "News fetched successfully");
    } catch (error) {
      console.error("Error fetching news:", error);
      toast.error("Failed to fetch news. Make sure Firecrawl is connected.");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishNews.mutateAsync(id);
      toast.success("Article published");
    } catch (error) {
      console.error("Error publishing:", error);
      toast.error("Failed to publish article");
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await unpublishNews.mutateAsync(id);
      toast.success("Article unpublished");
    } catch (error) {
      console.error("Error unpublishing:", error);
      toast.error("Failed to unpublish article");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteNews.mutateAsync(deleteId);
      toast.success("Article deleted");
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete article");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">News Articles</h2>
        <Button
          onClick={handleFetchNews}
          disabled={fetchNews.isPending}
          className="gap-2"
        >
          {fetchNews.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Fetch Latest News
        </Button>
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {article.title}
                        </h3>
                        <Badge
                          variant={
                            article.status === "published"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {article.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {article.source_name && (
                          <span>{article.source_name}</span>
                        )}
                        <span>•</span>
                        <span>
                          {format(new Date(article.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {article.status === "published" ? (
                      <>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnpublish(article.id)}
                          disabled={unpublishNews.isPending}
                          title="Unpublish"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePublish(article.id)}
                        disabled={publishNews.isPending}
                        title="Publish"
                        className="text-green-500 hover:text-green-600"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(article.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
          <p className="text-muted-foreground mb-4">No news articles yet</p>
          <Button onClick={handleFetchNews} disabled={fetchNews.isPending}>
            {fetchNews.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Fetch your first news
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this article? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
