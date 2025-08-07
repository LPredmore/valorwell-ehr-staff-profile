import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useIframe } from '@/context/IframeContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage authentication in iframe context
 * Coordinates between local Supabase auth and parent shell auth
 */
export const useIframeAuth = () => {
  const { config, parentAuth } = useIframe();
  const [shouldUseParentAuth, setShouldUseParentAuth] = useState(false);

  useEffect(() => {
    if (config.isIframe && parentAuth) {
      // In iframe mode with parent auth, use parent's authentication
      setShouldUseParentAuth(true);
      
      // Set the auth token from parent if available
      if (parentAuth.token) {
        const session = {
          access_token: parentAuth.token,
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer' as const,
          user: parentAuth.user,
        };
        supabase.auth.setSession(session);
      }
    } else {
      setShouldUseParentAuth(false);
    }
  }, [config.isIframe, parentAuth]);

  return {
    shouldUseParentAuth,
    parentUser: parentAuth?.user,
    parentToken: parentAuth?.token,
  };
};