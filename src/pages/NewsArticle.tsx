import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, Calendar, Building2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import { DesktopHeader } from "@/components/DesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { SEOHead } from "@/components/SEOHead";
import { ArticleSchema } from "@/components/ArticleSchema";
import { useNewsArticle } from "@/hooks/useNews";

const NewsArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useNewsArticle(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 2xl:pb-0">
        <DesktopHeader />
        <MobileHeader title="News" />
        <div className="max-w-4xl mx-auto px-4 2xl:px-6 pt-4 pb-8 2xl:pt-24 space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="aspect-[21/9] rounded-2xl" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background pb-24 2xl:pb-0">
        <DesktopHeader />
        <MobileHeader title="News" />
        <div className="max-w-4xl mx-auto px-4 2xl:px-6 pt-4 pb-8 2xl:pt-24">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Article not found</p>
            <Button asChild variant="outline">
              <Link to="/news">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to News
              </Link>
            </Button>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  const publishedDate = article.published_at
    ? format(new Date(article.published_at), "MMMM d, yyyy")
    : null;

  return (
    <div className="min-h-screen bg-background pb-24 2xl:pb-0">
      <SEOHead
        title={`${article.title} | SceneBurn News`}
        description={article.excerpt || article.title}
        image={article.featured_image || undefined}
        url={`/news/${article.slug}`}
        type="article"
        publishedTime={article.published_at || undefined}
        modifiedTime={article.updated_at}
      />
      {article.published_at && (
        <ArticleSchema
          title={article.title}
          description={article.excerpt || article.title}
          publishedTime={article.published_at}
          modifiedTime={article.updated_at}
          image={article.featured_image || undefined}
          slug={article.slug}
        />
      )}
      <DesktopHeader />
      <MobileHeader title="News" />

      <article className="max-w-4xl mx-auto px-4 2xl:px-6 pt-4 pb-8 2xl:pt-24">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6 -ml-2">
          <Link to="/news">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News
          </Link>
        </Button>

        {/* Hero Image - Larger format */}
        {article.featured_image && (
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-8">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            {/* Subtle gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {article.source_name && (
              <Badge className="bg-primary text-primary-foreground gap-1">
                <Building2 className="h-3 w-3" />
                {article.source_name}
              </Badge>
            )}
            {publishedDate && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {publishedDate}
              </div>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-cinematic text-foreground leading-tight">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </header>

        {/* Main Call to Action - Read Full Article */}
        {article.source_url && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 mb-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Continue Reading
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                This is a summary from {article.source_name}. Read the complete story with all the details on their website.
              </p>
              <Button asChild size="lg" className="gap-2 text-lg px-8 py-6">
                <a href={article.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-5 w-5" />
                  Read Full Article on {article.source_name}
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Summary Content */}
        {article.content && (
          <>
            <div className="mb-4">
              <Badge variant="secondary" className="text-xs">Summary</Badge>
            </div>
            <div className="prose prose-lg prose-invert max-w-none 
              prose-headings:text-foreground prose-headings:font-semibold
              prose-p:text-foreground/90 prose-p:leading-relaxed">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>
          </>
        )}

        {/* Bottom CTA */}
        {article.source_url && (
          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground mb-4">
              Want the full story?
            </p>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Read complete article on {article.source_name}
              </a>
            </Button>
          </div>
        )}
      </article>

      <Navigation />
    </div>
  );
};

export default NewsArticle;
