import { Navigation } from '@/components/Navigation';
import { DesktopHeader } from '@/components/DesktopHeader';
import { SEOHead } from '@/components/SEOHead';

const Terms = () => {
  return (
    <>
      <SEOHead
        title="Terms of Service - SceneBurn"
        description="Read SceneBurn's Terms of Service. Understand the rules and guidelines for using our movie and TV show tracking platform."
        url="https://sceneburn.com/terms"
      />
      <div className="min-h-screen bg-background">
        <DesktopHeader />
        <main className="max-w-3xl mx-auto px-4 py-8 pb-32 md:pb-12">
          <h1 className="font-cinematic text-3xl md:text-4xl text-foreground mb-6">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: February 24, 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using SceneBurn ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Description of Service</h2>
              <p>SceneBurn is a movie and TV show tracking platform that allows users to rate, review, and discover films and television content. The Service provides personalized recommendations, watchlists, and social features for movie and TV enthusiasts.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. User Accounts</h2>
              <p>To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. User Content</h2>
              <p>You retain ownership of content you submit, including reviews, ratings, and lists. By posting content, you grant SceneBurn a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the Service. You agree not to post content that is unlawful, defamatory, obscene, or infringes on the rights of others.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Prohibited Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Use automated tools to scrape or collect data from the Service</li>
                <li>Impersonate another person or entity</li>
                <li>Post spam or misleading content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. Third-Party Content</h2>
              <p>The Service displays movie and TV show information sourced from third-party providers, including The Movie Database (TMDB). SceneBurn does not claim ownership of this data and is not responsible for its accuracy. All movie posters, images, and media remain the property of their respective owners.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. Intellectual Property</h2>
              <p>The SceneBurn name, logo, design, and all associated branding are the property of SceneBurn. You may not use our branding without prior written permission.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Termination</h2>
              <p>We reserve the right to suspend or terminate your account at any time for violations of these terms. You may delete your account at any time through your profile settings.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">9. Disclaimer of Warranties</h2>
              <p>The Service is provided "as is" without warranties of any kind, either express or implied. SceneBurn does not guarantee the accuracy, completeness, or availability of the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, SceneBurn shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes to Terms</h2>
              <p>We may update these terms from time to time. We will notify users of significant changes through the Service. Your continued use of the Service after changes constitutes acceptance of the updated terms.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">12. Contact</h2>
              <p>If you have any questions about these Terms of Service, please contact us through the app or visit our website at <a href="https://sceneburn.com" className="text-primary hover:underline">sceneburn.com</a>.</p>
            </section>
          </div>
        </main>
        <Navigation />
      </div>
    </>
  );
};

export default Terms;
