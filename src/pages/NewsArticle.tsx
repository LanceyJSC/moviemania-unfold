import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, Calendar, Building2 } from "lucide-react";
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
          <Skeleton className="aspect-video rounded-xl" />
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

        {/* Featured Image */}
        {article.featured_image && (
          <div className="aspect-video rounded-xl overflow-hidden mb-6">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {article.source_name && (
              <Badge variant="secondary" className="gap-1">
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
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-cinematic text-foreground leading-tight">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </header>

        {/* Article Content */}
        {article.content && (
          <div className="prose prose-invert max-w-none">
            {article.content.split("\n").map((paragraph, index) => (
              <p key={index} className="text-foreground/90 leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {/* Source Link */}
        {article.source_url && (
          <div className="mt-8 pt-6 border-t border-border">
            <Button asChild variant="outline" className="gap-2">
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Read original article
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
