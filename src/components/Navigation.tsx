import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, X, MessageSquare, MapPin, User, Settings, Bell, Home, LogIn, LogOut, Shield, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import NotificationSystem from "@/components/NotificationSystem";
import PWAInstallButton from "@/components/PWAInstallButton";

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ activeView, onViewChange }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const { user, signOut, isLoading } = useAuth();
  const { t } = useLanguage();

  // Base navigation items
  const baseNavItems = [
    { id: "home", label: t.nav.home, icon: Home },
    { id: "report", label: t.nav.report, icon: MessageSquare },
    { id: "community", label: t.nav.community, icon: MapPin },
    { id: "my-reports", label: t.nav.myReports, icon: User },
  ];

  // Add QR Generator for admin/official users
  const navItems = (() => {
    const items = [...baseNavItems];
    if (user && (user.role === 'admin' || user.role === 'official')) {
      items.push({ id: 'qr-generator', label: 'QR Generator', icon: QrCode });
    }
    return items;
  })();

  const viewToPath = (id: string) => {
    switch (id) {
      case 'home':
        return '/';
      case 'report':
        return '/report';
      case 'community':
        return '/community';
      case 'my-reports':
        return '/my-reports';
      case 'qr-generator':
        return '/qr-generator';
      default:
        return '/';
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleSignOut = async () => {
    try {
      await signOut();
      onViewChange('home');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="bg-card border-b shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 civic-gradient rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">CivicReport</h1>
              <p className="text-xs text-muted-foreground">Municipal Services</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  navigate(viewToPath(item.id));
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-civic ${
                  activeView === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <PWAInstallButton variant="outline" size="sm" />
            <LanguageSelector />
            {user ? (
              <>
                {/* Notification Bell */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="w-4 h-4" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    2
                  </Badge>
                </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onViewChange('my-reports')}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t.nav.myReports}
                  </DropdownMenuItem>
                  {(user.role === 'admin' || user.role === 'official') && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => navigate('/admin')}
                        className="cursor-pointer"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onViewChange('qr-generator')}
                        className="cursor-pointer"
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        QR Generator
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem 
                    onClick={() => navigate('/settings')}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t.nav.settings}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    disabled={isLoading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.nav.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  className="flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t.nav.signIn}</span>
                </Button>
                <Button 
                  variant="default"
                  onClick={() => navigate('/signup')}
                >
                  {t.signUp.title.split(' ')[0]}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="md:hidden"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-card py-4 space-y-2 animate-fade-in-up">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  navigate(viewToPath(item.id));
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-md transition-civic ${
                  activeView === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
            <div className="border-t pt-4 mt-4 px-4">
              <div className="mb-4 space-y-3">
                <PWAInstallButton variant="outline" size="sm" className="w-full" />
                <LanguageSelector />
              </div>
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onViewChange('my-reports');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t.nav.myReports}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigate('/settings');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t.nav.settings}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                    disabled={isLoading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.nav.signOut}
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2 w-full">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      navigate('/login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 flex-1"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t.nav.signIn}</span>
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => {
                      navigate('/signup');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1"
                  >
                    {t.signUp.title.split(' ')[0]}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Notification System */}
      <NotificationSystem 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </nav>
  );
};

export default Navigation;
