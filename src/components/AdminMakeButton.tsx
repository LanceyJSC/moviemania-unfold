import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

export const AdminMakeButton = () => {
  const { user } = useAuth();
  const { isAdmin, role } = useUserRole();
  const [loading, setLoading] = useState(false);

  const makeAdmin = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'admin'
        });

      if (error) throw error;
      
      toast.success('You are now an admin!');
      // Refresh the page to update role
      window.location.reload();
    } catch (error) {
      console.error('Error making admin:', error);
      toast.error('Failed to make admin');
    } finally {
      setLoading(false);
    }
  };

  // Don't show if already admin or if no user
  if (!user || isAdmin) return null;

  return (
    <Button
      onClick={makeAdmin}
      disabled={loading}
      variant="outline"
      size="sm"
      className="text-xs"
    >
      <Shield className="w-3 h-3 mr-1" />
      {loading ? 'Making Admin...' : 'Make Me Admin'}
    </Button>
  );
};