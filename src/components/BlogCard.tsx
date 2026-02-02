import { Link } from 'react-router-dom';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

interface BlogCardProps {
  post: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    featured_image: string | null;
    published_at: string | null;
    author?: {
      username: string | null;
      full_name: string | null;
    } | null;
  };
}

export const BlogCard = ({ post }: BlogCardProps) => {
  const authorName = post.author?.full_name || post.author?.username || 'SceneBurn Team';
  const publishedDate = post.published_at 
    ? format(new Date(post.published_at), 'MMM d, yyyy')
    : 'Draft';

  return (
    <Link to={`/blog/${post.slug}`}>
      <Card className="group overflow-hidden bg-card/60 border-border/50 hover:border-primary/50 transition-all duration-300 h-full">
        {/* Featured Image */}
        <div className="aspect-video relative overflow-hidden bg-muted">
          {post.featured_image ? (
            <img 
              src={post.featured_image} 
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-4xl">📝</span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{authorName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{publishedDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
