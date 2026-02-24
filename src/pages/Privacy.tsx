import { Navigation } from '@/components/Navigation';
import { DesktopHeader } from '@/components/DesktopHeader';
import { SEOHead } from '@/components/SEOHead';

const Privacy = () => {
  return (
    <>
      <SEOHead
        title="Privacy Policy - SceneBurn"
        description="Read SceneBurn's Privacy Policy. Learn how we collect, use, and protect your personal data on our movie and TV show tracking platform."
        url="https://sceneburn.com/privacy"
      />
      <div className="min-h-screen bg-background">
        <DesktopHeader />
        <main className="max-w-3xl mx-auto px-4 py-8 pb-32 md:pb-12">
          <h1 className="font-cinematic text-3xl md:text-4xl text-foreground mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: February 24, 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction</h2>
              <p>SceneBurn ("we", "our", "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our movie and TV show tracking platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
              <p><strong className="text-foreground">Account Information:</strong> When you create an account, we collect your email address, username, and password (stored securely using industry-standard hashing).</p>
              <p className="mt-2"><strong className="text-foreground">Profile Information:</strong> You may optionally provide a display name, bio, and avatar image.</p>
              <p className="mt-2"><strong className="text-foreground">Usage Data:</strong> We collect information about your interactions with the Service, including movies and TV shows you rate, review, add to watchlists, and mark as watched.</p>
              <p className="mt-2"><strong className="text-foreground">Device Information:</strong> We may collect device type, browser type, and operating system information for analytics and improving the user experience.</p>
              <p className="mt-2"><strong className="text-foreground">Cookies & Local Storage:</strong> We use cookies and browser local storage to maintain your session, remember your preferences, and enhance your experience.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>To provide and maintain the Service</li>
                <li>To personalize your experience and provide recommendations</li>
                <li>To enable social features such as following other users and viewing activity feeds</li>
                <li>To communicate with you about your account or the Service</li>
                <li>To detect, prevent, and address technical issues or abuse</li>
                <li>To improve and optimize the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Sharing</h2>
              <p>We do not sell your personal information. We may share data with:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong className="text-foreground">Service Providers:</strong> Third-party services that help us operate the platform (e.g., hosting, authentication)</li>
                <li><strong className="text-foreground">Public Content:</strong> Reviews, ratings, and lists you mark as public are visible to other users</li>
                <li><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Storage & Security</h2>
              <p>Your data is stored securely using industry-standard encryption and access controls. We use secure HTTPS connections for all data transmission. While we implement safeguards to protect your data, no method of transmission over the internet is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. Your Rights (GDPR)</h2>
              <p>If you are located in the European Economic Area (EEA), you have certain rights regarding your personal data:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong className="text-foreground">Access:</strong> Request a copy of your personal data</li>
                <li><strong className="text-foreground">Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong className="text-foreground">Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong className="text-foreground">Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong className="text-foreground">Objection:</strong> Object to the processing of your data</li>
                <li><strong className="text-foreground">Withdraw Consent:</strong> Withdraw consent at any time where we rely on consent to process your data</li>
              </ul>
              <p className="mt-2">To exercise these rights, please contact us through the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. Cookies</h2>
              <p>We use essential cookies and local storage to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Ensure the security of your session</li>
              </ul>
              <p className="mt-2">You can manage cookie preferences through your browser settings. Disabling cookies may affect the functionality of the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Data Retention</h2>
              <p>We retain your data for as long as your account is active. When you delete your account, we will delete your personal data within 30 days, except where retention is required by law.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">9. Children's Privacy</h2>
              <p>The Service is not intended for children under 13. We do not knowingly collect data from children under 13. If we discover such data has been collected, we will delete it promptly.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify users of significant changes through the Service. Your continued use of the Service after changes constitutes acceptance of the updated policy.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">11. Contact</h2>
              <p>If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us through the app or visit our website at <a href="https://sceneburn.com" className="text-primary hover:underline">sceneburn.com</a>.</p>
            </section>
          </div>
        </main>
        <Navigation />
      </div>
    </>
  );
};

export default Privacy;
