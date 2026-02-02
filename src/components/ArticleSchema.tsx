import { Helmet } from 'react-helmet-async';

interface ArticleSchemaProps {
  title: string;
  description: string;
  image?: string;
  publishedTime: string;
  modifiedTime?: string;
  authorName?: string;
  slug: string;
}

export const ArticleSchema = ({
  title,
  description,
  image,
  publishedTime,
  modifiedTime,
  authorName,
  slug
}: ArticleSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "image": image || "https://sceneburn.app/sceneburn-logo.png",
    "datePublished": publishedTime,
    "dateModified": modifiedTime || publishedTime,
    "author": authorName ? {
      "@type": "Person",
      "name": authorName
    } : {
      "@type": "Organization",
      "name": "SceneBurn"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SceneBurn",
      "logo": {
        "@type": "ImageObject",
        "url": "https://sceneburn.app/sceneburn-logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://sceneburn.app/blog/${slug}`
    },
    "url": `https://sceneburn.app/blog/${slug}`
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
