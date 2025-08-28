
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIframe } from '@/context/IframeContext';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const useProfile = () => {
  const { parentAuth, config } = useIframe();
  const [user, setUser] = useState<any>(null);
  
  // Get user from parent auth or local Supabase auth
  useEffect(() => {
    const getUserId = async () => {
      if (parentAuth?.user?.id) {
        console.log('useProfile: Using parent auth user ID:', parentAuth.user.id);
        setUser({ id: parentAuth.user.id });
      } else if (!config.isIframeMode) {
        // Use local Supabase auth when not in iframe mode
        const { data: { user: localUser } } = await supabase.auth.getUser();
        console.log('useProfile: Using local Supabase user:', localUser?.id);
        setUser(localUser);
      } else {
        console.log('useProfile: In iframe mode but no parent auth, waiting...');
      }
    };
    
    getUserId();
  }, [parentAuth?.user?.id, config.isIframeMode]);
  
  return useQuery<Profile, Error>({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile> => {
      if (!user?.id) {
        throw new Error('No authenticated user found');
      }

      console.log('useProfile: Fetching profile for user ID:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('useProfile: Error fetching profile:', error);
        throw error;
      }
      
      console.log('useProfile: Profile fetched successfully:', data);
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useUserRole = () => {
  const { parentAuth, config } = useIframe();
  const [user, setUser] = useState<any>(null);
  
  // Get user from parent auth or local Supabase auth
  useEffect(() => {
    const getUserId = async () => {
      if (parentAuth?.user?.id) {
        console.log('useUserRole: Using parent auth user ID:', parentAuth.user.id);
        setUser({ id: parentAuth.user.id });
      } else if (!config.isIframeMode) {
        const { data: { user: localUser } } = await supabase.auth.getUser();
        console.log('useUserRole: Using local Supabase user:', localUser?.id);
        setUser(localUser);
      }
    };
    
    getUserId();
  }, [parentAuth?.user?.id, config.isIframeMode]);
  
  return useQuery<Database['public']['Enums']['user_role'], Error>({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<Database['public']['Enums']['user_role']> => {
      if (!user?.id) {
        throw new Error('No authenticated user found');
      }

      console.log('useUserRole: Fetching role for user ID:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('useUserRole: Error fetching role:', error);
        throw error;
      }
      
      console.log('useUserRole: Role fetched successfully:', data.role);
      return data.role[0] as Database['public']['Enums']['user_role']; // Role is stored as an array, return first element
    },
    enabled: !!user?.id,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { parentAuth, config } = useIframe();
  const [user, setUser] = useState<any>(null);
  
  // Get user from parent auth or local Supabase auth
  useEffect(() => {
    const getUserId = async () => {
      if (parentAuth?.user?.id) {
        setUser({ id: parentAuth.user.id });
      } else if (!config.isIframeMode) {
        const { data: { user: localUser } } = await supabase.auth.getUser();
        setUser(localUser);
      }
    };
    
    getUserId();
  }, [parentAuth?.user?.id, config.isIframeMode]);

  return useMutation<Profile, Error, ProfileUpdate>({
    mutationFn: async (profileData: ProfileUpdate): Promise<Profile> => {
      if (!user?.id) {
        throw new Error('No authenticated user found');
      }

      console.log('useUpdateProfile: Updating profile for user ID:', user.id, profileData);
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        console.error('useUpdateProfile: Error updating profile:', error);
        throw error;
      }
      
      console.log('useUpdateProfile: Profile updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    },
    onError: (error) => {
      console.error('useUpdateProfile: Mutation error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile',
      });
    }
  });
};
