import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { toast } from "sonner";

// Mock user data - will be replaced with real auth data
const mockUser = {
  id: "user-1",
  name: "John Smith",
  email: "john.smith@realestate.com",
  phone: "(555) 123-4567",
  avatar: null,
  role: "Agent",
  licenseNumber: "RE-12345678",
  createdAt: "2024-01-15",
};

const mockBrokerage = {
  id: "brokerage-1",
  name: "Premier Real Estate Group",
  address: "123 Main Street, Suite 500",
  city: "Los Angeles",
  state: "CA",
  zip: "90210",
  phone: "(555) 987-6543",
  email: "info@premierrealestate.com",
  website: "https://premierrealestate.com",
  logo: null,
};

export default function Settings() {
  const [sidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Form states
  const [userForm, setUserForm] = useState(mockUser);
  const [brokerageForm, setBrokerageForm] = useState(mockBrokerage);
  const [notifications, setNotifications] = useState({
    emailOffers: true,
    emailTasks: true,
    emailBuyerUpdates: false,
    pushNotifications: true,
  });

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully");
  };

  const handleSaveBrokerage = () => {
    toast.success("Brokerage settings updated successfully");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "brokerage", label: "Brokerage", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <main className={cn(
        "flex-1 transition-all duration-200",
        sidebarCollapsed ? "ml-[58px]" : "ml-[240px]"
      )}>
        {/* Header */}
        <header className="h-14 border-b bg-card flex items-center px-6">
          <h1 className="text-lg font-semibold">Settings</h1>
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
                      <AvatarImage src={userForm.avatar || undefined} />
                      <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                        {userForm.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Camera className="h-4 w-4" />
                        Change Photo
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
                        value={userForm.licenseNumber}
                        onChange={(e) => setUserForm({ ...userForm, licenseNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <Badge variant="secondary">{userForm.role}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Member since {new Date(userForm.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} className="gap-2">
                      <Save className="h-4 w-4" />
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
                    Manage your brokerage details and branding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Section */}
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                      {brokerageForm.logo ? (
                        <img src={brokerageForm.logo} alt="Brokerage logo" className="h-full w-full object-contain rounded-lg" />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Logo
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
                      <Label htmlFor="brokerageName">Brokerage Name</Label>
                      <Input
                        id="brokerageName"
                        value={brokerageForm.name}
                        onChange={(e) => setBrokerageForm({ ...brokerageForm, name: e.target.value })}
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
                          value={brokerageForm.zip}
                          onChange={(e) => setBrokerageForm({ ...brokerageForm, zip: e.target.value })}
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
                    <Button onClick={handleSaveBrokerage} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
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
