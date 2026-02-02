import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { NewsArticle } from "@/hooks/useNews";

interface NewsCardProps {
  article: NewsArticle;
}

export const NewsCard = ({ article }: NewsCardProps) => {
  const publishedDate = article.published_at
    ? format(new Date(article.published_at), "MMM d, yyyy")
    : null;

  return (
    <Card className="bg-card/60 border-border/50 overflow-hidden hover:border-primary/30 transition-colors group">
      <Link to={`/news/${article.slug}`}>
        {/* Image */}
        <div className="aspect-video overflow-hidden bg-muted">
          {article.featured_image ? (
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <span className="text-4xl font-cinematic text-primary/30">S</span>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {article.source_name && (
              <Badge variant="secondary" className="text-xs">
                {article.source_name}
              </Badge>
            )}
            {publishedDate && (
              <span className="text-xs text-muted-foreground">{publishedDate}</span>
            )}
          </div>
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {article.excerpt}
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};
