
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIframe } from '@/context/IframeContext';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const useProfile = () => {
  const { parentAuth } = useIframe();
  
  return useQuery<Profile, Error>({
    queryKey: ['profile', parentAuth?.user?.id],
    queryFn: async (): Promise<Profile> => {
      if (!parentAuth?.user?.id) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', parentAuth.user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!parentAuth?.user?.id,
  });
};

export const useUserRole = () => {
  const { parentAuth } = useIframe();
  
  return useQuery<Database['public']['Enums']['user_role'], Error>({
    queryKey: ['user-role', parentAuth?.user?.id],
    queryFn: async (): Promise<Database['public']['Enums']['user_role']> => {
      if (!parentAuth?.user?.id) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', parentAuth.user.id)
        .single();
      
      if (error) throw error;
      return data.role[0] as Database['public']['Enums']['user_role']; // Role is stored as an array, return first element
    },
    enabled: !!parentAuth?.user?.id,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { parentAuth } = useIframe();

  return useMutation<Profile, Error, ProfileUpdate>({
    mutationFn: async (profileData: ProfileUpdate): Promise<Profile> => {
      if (!parentAuth?.user?.id) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', parentAuth.user.id)
        .select()
        .single();
        
      if (error) throw error;
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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile',
      });
    }
  });
};
