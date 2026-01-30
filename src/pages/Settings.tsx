import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Save,
  Upload,
  Mail,
  Phone,
  MapPin,
  Globe,
  Camera,
  Loader2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useFileUpload } from "@/hooks/useFileUpload";

export default function Settings() {
  const navigate = useNavigate();
  const { 
    user, 
    profile, 
    brokerage, 
    isLoading: authLoading, 
    isAuthenticated,
    updateProfile,
    updateBrokerage,
    createBrokerage,
    signOut,
  } = useAuth();
  
  const [sidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  
  const { upload, isUploading } = useFileUpload();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    license_number: "",
    avatar_url: "",
  });
  
  const [brokerageForm, setBrokerageForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
  });
  
  const [notifications, setNotifications] = useState({
    emailOffers: true,
    emailTasks: true,
    emailBuyerUpdates: false,
    pushNotifications: true,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Populate forms when profile/brokerage load
  useEffect(() => {
    if (profile) {
      setUserForm({
        name: profile.name || "",
        email: profile.email || user?.email || "",
        phone: profile.phone || "",
        license_number: profile.license_number || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile, user]);

  useEffect(() => {
    if (brokerage) {
      setBrokerageForm({
        name: brokerage.name || "",
        address: brokerage.address || "",
        city: brokerage.city || "",
        state: brokerage.state || "",
        zip_code: brokerage.zip_code || "",
        phone: brokerage.phone || "",
        email: brokerage.email || "",
        website: brokerage.website || "",
        logo_url: brokerage.logo_url || "",
      });
    }
  }, [brokerage]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { error } = await updateProfile({
      name: userForm.name,
      email: userForm.email,
      phone: userForm.phone || null,
      license_number: userForm.license_number || null,
      avatar_url: userForm.avatar_url || null,
    });
    
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
    setIsSaving(false);
  };

  const handleSaveBrokerage = async () => {
    setIsSaving(true);
    
    if (brokerage) {
      // Update existing brokerage
      const { error } = await updateBrokerage({
        name: brokerageForm.name,
        address: brokerageForm.address || null,
        city: brokerageForm.city || null,
        state: brokerageForm.state || null,
        zip_code: brokerageForm.zip_code || null,
        phone: brokerageForm.phone || null,
        email: brokerageForm.email || null,
        website: brokerageForm.website || null,
        logo_url: brokerageForm.logo_url || null,
      });
      
      if (error) {
        toast.error("Failed to update brokerage");
      } else {
        toast.success("Brokerage settings updated successfully");
      }
    } else {
      // Create new brokerage
      if (!brokerageForm.name.trim()) {
        toast.error("Brokerage name is required");
        setIsSaving(false);
        return;
      }
      
      const { error } = await createBrokerage({
        name: brokerageForm.name,
        address: brokerageForm.address || undefined,
        city: brokerageForm.city || undefined,
        state: brokerageForm.state || undefined,
        zip_code: brokerageForm.zip_code || undefined,
        phone: brokerageForm.phone || undefined,
        email: brokerageForm.email || undefined,
        website: brokerageForm.website || undefined,
      });
      
      if (error) {
        toast.error("Failed to create brokerage");
      } else {
        toast.success("Brokerage created and linked to your profile");
      }
    }
    
    setIsSaving(false);
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { url, error } = await upload(file, { bucket: "avatars" });
    
    if (error) {
      toast.error(error);
      return;
    }

    if (url) {
      setUserForm(prev => ({ ...prev, avatar_url: url }));
      // Auto-save to database
      const { error: saveError } = await updateProfile({ avatar_url: url });
      if (saveError) {
        toast.error("Failed to save avatar");
      } else {
        toast.success("Avatar updated successfully");
      }
    }
    
    // Reset input
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const folder = brokerage?.id || "temp";
    const { url, error } = await upload(file, { bucket: "logos", folder });
    
    if (error) {
      toast.error(error);
      return;
    }

    if (url) {
      setBrokerageForm(prev => ({ ...prev, logo_url: url }));
      // Auto-save if brokerage exists
      if (brokerage) {
        const { error: saveError } = await updateBrokerage({ logo_url: url });
        if (saveError) {
          toast.error("Failed to save logo");
        } else {
          toast.success("Logo updated successfully");
        }
      }
    }
    
    // Reset input
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "brokerage", label: "Brokerage", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className={cn(
        "flex-1 transition-all duration-200",
        sidebarCollapsed ? "ml-[58px]" : "ml-[240px]"
      )}>
        {/* Header */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Settings</h1>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </header>

        <div className="p-6 max-w-5xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="gap-2 data-[state=active]:bg-background"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and agent details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={userForm.avatar_url || undefined} />
                      <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                        {userForm.name?.split(" ").map(n => n[0]).join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        {isUploading ? "Uploading..." : "Change Photo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or GIF. Max 2MB.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          className="pl-9"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          className="pl-9"
                          value={userForm.phone}
                          onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">License Number</Label>
                      <Input
                        id="license"
                        value={userForm.license_number}
                        onChange={(e) => setUserForm({ ...userForm, license_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <Badge variant="secondary">{profile?.role || "Agent"}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} className="gap-2" disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Brokerage Tab */}
            <TabsContent value="brokerage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brokerage Information</CardTitle>
                  <CardDescription>
                    {brokerage ? "Manage your brokerage details and branding" : "Set up your brokerage information"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Section */}
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {brokerageForm.logo_url ? (
                        <img src={brokerageForm.logo_url} alt="Brokerage logo" className="h-full w-full object-contain" />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {isUploading ? "Uploading..." : "Upload Logo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Recommended: 200x200px, PNG or SVG
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="brokerageName">Brokerage Name *</Label>
                      <Input
                        id="brokerageName"
                        value={brokerageForm.name}
                        onChange={(e) => setBrokerageForm({ ...brokerageForm, name: e.target.value })}
                        placeholder="Enter brokerage name"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          className="pl-9"
                          value={brokerageForm.address}
                          onChange={(e) => setBrokerageForm({ ...brokerageForm, address: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={brokerageForm.city}
                        onChange={(e) => setBrokerageForm({ ...brokerageForm, city: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={brokerageForm.state}
                          onChange={(e) => setBrokerageForm({ ...brokerageForm, state: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP</Label>
                        <Input
                          id="zip"
                          value={brokerageForm.zip_code}
                          onChange={(e) => setBrokerageForm({ ...brokerageForm, zip_code: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brokeragePhone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="brokeragePhone"
                          className="pl-9"
                          value={brokerageForm.phone}
                          onChange={(e) => setBrokerageForm({ ...brokerageForm, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brokerageEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="brokerageEmail"
                          type="email"
                          className="pl-9"
                          value={brokerageForm.email}
                          onChange={(e) => setBrokerageForm({ ...brokerageForm, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="website"
                          className="pl-9"
                          value={brokerageForm.website}
                          onChange={(e) => setBrokerageForm({ ...brokerageForm, website: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveBrokerage} className="gap-2" disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {brokerage ? "Save Changes" : "Create Brokerage"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Offer Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Email notifications for new offers and status changes
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailOffers}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, emailOffers: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Task Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Email reminders for upcoming and overdue tasks
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailTasks}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, emailTasks: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Buyer Activity</Label>
                        <p className="text-sm text-muted-foreground">
                          Notifications when buyers view properties or send messages
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailBuyerUpdates}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, emailBuyerUpdates: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Browser push notifications for urgent updates
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotifications} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Change Password</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Update your password to keep your account secure
                      </p>
                      <Button variant="outline">Change Password</Button>
                    </div>
                    <Separator />
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add an extra layer of security to your account
                      </p>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                    <Separator />
                    <div>
                      <Label>Active Sessions</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Manage devices where you're currently logged in
                      </p>
                      <Button variant="outline">View Sessions</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how the application looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Theme</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Choose your preferred color scheme
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Light</Button>
                        <Button variant="outline" size="sm">Dark</Button>
                        <Button variant="outline" size="sm">System</Button>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label>Compact Mode</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Reduce spacing for more content on screen
                      </p>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
