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

const SITE_URL = 'https://sceneburn.com';

const toAbsoluteUrl = (value: string) => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

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
  const fullUrl = url ? toAbsoluteUrl(url) : SITE_URL;
  const truncatedDescription = description.length > 155
    ? `${description.substring(0, 152)}...`
    : description;
  const ogImage = image ? toAbsoluteUrl(image) : `${SITE_URL}/sceneburn-logo.png`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={truncatedDescription} />
      <link rel="canonical" href={fullUrl} />

      <meta property="og:type" content={type === 'movie' || type === 'tv_show' ? 'video.movie' : type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="SceneBurn" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={ogImage} />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
    </Helmet>
  );
};
