import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { DesktopHeader } from '@/components/DesktopHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { SEOHead } from '@/components/SEOHead';
import { ArticleSchema } from '@/components/ArticleSchema';
import { useBlogPost } from '@/hooks/useBlogPosts';

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DesktopHeader />
        <MobileHeader title="Loading..." />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <SEOHead 
          title="Article Not Found - SceneBurn"
          description="The requested article could not be found."
          url={`/blog/${slug}`}
        />
        <DesktopHeader />
        <MobileHeader title="Not Found" />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-4xl mb-4">📄</p>
          <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
        <Navigation />
      </div>
    );
  }

  const authorName = post.author?.full_name || post.author?.username || 'SceneBurn Team';
  const seoTitle = post.seo_title || `${post.title} - SceneBurn`;
  const seoDescription = post.seo_description || post.excerpt || post.title;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        image={post.featured_image || undefined}
        url={`/blog/${post.slug}`}
        type="article"
        publishedTime={post.published_at || undefined}
        modifiedTime={post.updated_at}
        author={authorName}
      />
      <ArticleSchema 
        title={post.title}
        description={seoDescription}
        image={post.featured_image || undefined}
        publishedTime={post.published_at || post.created_at}
        modifiedTime={post.updated_at}
        authorName={authorName}
        slug={post.slug}
      />
      
      <DesktopHeader />
      <MobileHeader title="Blog" />

      <article className="max-w-3xl mx-auto px-4 2xl:px-6 pt-4 pb-8 2xl:pt-24">
        {/* Back Link */}
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="aspect-video rounded-xl overflow-hidden mb-8">
            <img 
              src={post.featured_image} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-cinematic text-foreground tracking-wide mb-4">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{authorName}</span>
            </div>
            {post.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.published_at}>
                  {format(new Date(post.published_at), 'MMMM d, yyyy')}
                </time>
              </div>
            )}
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          {/* Simple markdown-like rendering */}
          {post.content?.split('\n').map((paragraph, index) => {
            if (!paragraph.trim()) return null;
            
            // Headers
            if (paragraph.startsWith('### ')) {
              return <h3 key={index} className="text-xl font-semibold text-foreground mt-8 mb-4">{paragraph.slice(4)}</h3>;
            }
            if (paragraph.startsWith('## ')) {
              return <h2 key={index} className="text-2xl font-semibold text-foreground mt-10 mb-4">{paragraph.slice(3)}</h2>;
            }
            if (paragraph.startsWith('# ')) {
              return <h1 key={index} className="text-3xl font-bold text-foreground mt-12 mb-6">{paragraph.slice(2)}</h1>;
            }
            
            // Regular paragraph
            return (
              <p key={index} className="text-muted-foreground leading-relaxed mb-4">
                {paragraph}
              </p>
            );
          })}
        </div>
      </article>

      <Navigation />
    </div>
  );
};

export default BlogArticle;
