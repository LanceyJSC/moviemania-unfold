import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'sceneburn_cookie_consent';

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium mb-1">🍪 Cookie Notice</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use cookies and local storage to improve your experience, remember your preferences, and keep you signed in. By continuing, you agree to our{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </div>
          <button onClick={handleDecline} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={handleDecline} className="flex-1 h-8 text-xs">
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept} className="flex-1 h-8 text-xs">
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
};
