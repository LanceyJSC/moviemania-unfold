import { Loader2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { DesktopHeader } from '@/components/DesktopHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { BlogCard } from '@/components/BlogCard';
import { SEOHead } from '@/components/SEOHead';
import { useBlogPosts } from '@/hooks/useBlogPosts';

const Blog = () => {
  const { data: posts, isLoading, error } = useBlogPosts();

  return (
    <div className="min-h-screen bg-background pb-24 2xl:pb-0">
      <SEOHead 
        title="Blog - SceneBurn"
        description="Movie reviews, film news, top lists, and entertainment insights from SceneBurn. Discover the best movies and TV shows."
        url="/blog"
        type="website"
      />
      
      <DesktopHeader />
      <MobileHeader title="Blog" />

      <div className="max-w-7xl mx-auto px-4 2xl:px-6 pt-4 pb-8 2xl:pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-cinematic text-foreground tracking-wide mb-2">
            SCENEBURN BLOG
          </h1>
          <p className="text-muted-foreground">
            Movie reviews, top lists, and entertainment insights
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Failed to load blog posts. Please try again later.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && posts?.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
          </div>
        )}

        {/* Blog Grid */}
        {posts && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Blog;
