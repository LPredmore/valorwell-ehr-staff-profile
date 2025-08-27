
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProfile, useUpdateProfile, useUserRole } from '@/hooks/useProfile';
import { useClinicians } from '@/hooks/useClinicians';
import { useIframe } from '@/context/IframeContext';
import { notifyParentDataChange } from '@/utils/iframeUtils';
import { Loader2, User, Mail, Phone, MapPin, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Profile: React.FC = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: clinicians, isLoading: cliniciansLoading } = useClinicians();
  const updateProfile = useUpdateProfile();
  const { config, sendMessage } = useIframe();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    professional_name: '',
    bio: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current clinician data if user is a clinician
  const currentClinician = React.useMemo(() => {
    if (userRole === 'clinician' && clinicians && profile) {
      return clinicians.find(c => c.profile_id === profile.id);
    }
    return null;
  }, [clinicians, profile, userRole]);

  // Initialize form data
  React.useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        email: profile.email || '',
      }));
    }
    
    if (currentClinician) {
      setFormData(prev => ({
        ...prev,
        first_name: currentClinician.first_name || '',
        last_name: currentClinician.last_name || '',
        phone: currentClinician.phone || '',
        professional_name: currentClinician.professional_name || '',
        bio: currentClinician.bio || '',
        city: currentClinician.city || '',
        state: currentClinician.state || '',
        zip_code: currentClinician.zip_code || '',
      }));
    }
  }, [profile, currentClinician]);

  // Notify parent when profile data loads (for iframe mode)
  useEffect(() => {
    if (config.isIframeMode && profile && !profileLoading) {
      notifyParentDataChange('profile-loaded', {
        profileId: profile.id,
        userRole,
        clinician: currentClinician,
      }, 'staff-profile');
    }
  }, [config.isIframeMode, profile, profileLoading, userRole, currentClinician]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update profile (currently only email is updateable via this hook)
      await updateProfile.mutateAsync({ email: formData.email });

      // In iframe mode, notify parent of successful update
      if (config.isIframeMode) {
        await notifyParentDataChange('profile-updated', {
          profileId: profile?.id,
          updates: formData,
          timestamp: new Date().toISOString(),
        }, 'staff-profile');

        // Also send a success message to parent
        await sendMessage('profile-save-success', {
          message: 'Profile updated successfully',
          profileData: formData,
        });
      }

      setHasChanges(false);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Profile update failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      
      // Notify parent of error in iframe mode
      if (config.isIframeMode) {
        await sendMessage('profile-save-error', {
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = profileLoading || roleLoading || cliniciansLoading;

  // Loading state with iframe-optimized styling
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${config.isIframeMode ? 'h-full' : 'h-64'}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`flex items-center justify-center ${config.isIframeMode ? 'h-full' : 'h-64'}`}>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No profile found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${config.isIframeMode ? 'h-full overflow-auto' : 'container mx-auto p-6 max-w-4xl'}`}>
      <div className="space-y-6">
        {/* Header section - conditionally styled for iframe */}
        {!config.hideHeader && (
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Staff Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your professional information and settings
            </p>
          </div>
        )}

        {/* Connection status for iframe mode */}
        {config.isIframeMode && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            Profile Mode: {config.isIframeMode ? 'Embedded' : 'Standalone'}
          </div>
        )}

        {/* Basic Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Email cannot be changed here. Please contact support if needed.
                </p>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  type="text"
                  value={userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'No role assigned'}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific profile sections */}
        {userRole === 'clinician' && (
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="professional_name">Professional Name</Label>
                    <Input
                      id="professional_name"
                      value={formData.professional_name}
                      onChange={(e) => handleInputChange('professional_name', e.target.value)}
                      placeholder="Dr. Jane Smith, LCSW"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell patients about your background, specialties, and approach..."
                    rows={config.isIframeMode ? 3 : 4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      City
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={!hasChanges || isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {userRole === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Administrator Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  As an administrator, you have access to manage the platform. Personal profile information 
                  can be managed through the clinician or client profiles as needed.
                </p>
                
                {config.isIframeMode && (
                  <div className="mt-4 p-3 bg-muted rounded text-sm">
                    <p className="font-medium">Embedded Mode Active</p>
                    <p>This profile is running as an embedded application within the main EHR system.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
