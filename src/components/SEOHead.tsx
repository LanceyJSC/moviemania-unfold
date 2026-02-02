import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'movie' | 'tv_show';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

export const SEOHead = ({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author
}: SEOHeadProps) => {
  const siteUrl = 'https://sceneburn.app';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const truncatedDescription = description.length > 155 
    ? description.substring(0, 152) + '...' 
    : description;
  
  // Default OG image
  const ogImage = image || `${siteUrl}/sceneburn-logo.png`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={truncatedDescription} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'movie' || type === 'tv_show' ? 'video.movie' : type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="SceneBurn" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Article specific */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
    </Helmet>
  );
};
