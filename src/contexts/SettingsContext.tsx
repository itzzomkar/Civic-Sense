import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    bio: string;
    avatar: string;
    location: string;
  };
  notifications: {
    email: {
      reportUpdates: boolean;
      communityActivity: boolean;
      newsletter: boolean;
      marketing: boolean;
    };
    push: {
      reportUpdates: boolean;
      communityActivity: boolean;
      mentions: boolean;
    };
    sound: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showLocation: boolean;
    showActivity: boolean;
    dataCollection: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    colorScheme: 'blue' | 'green' | 'purple' | 'orange';
    compactMode: boolean;
  };
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
  };
}

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (category: keyof UserSettings, field: string, value: any) => void;
  updateNotificationSettings: (type: 'email' | 'push', field: string, value: boolean) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  isLoading: boolean;
}

const defaultSettings: UserSettings = {
  profile: {
    name: '',
    email: '',
    phone: '',
    bio: '',
    avatar: '',
    location: ''
  },
  notifications: {
    email: {
      reportUpdates: true,
      communityActivity: true,
      newsletter: false,
      marketing: false
    },
    push: {
      reportUpdates: true,
      communityActivity: false,
      mentions: true
    },
    sound: true
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showLocation: true,
    showActivity: true,
    dataCollection: true
  },
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    colorScheme: 'blue',
    compactMode: false
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    screenReader: false,
    keyboardNavigation: true
  }
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const savedSettings = localStorage.getItem('userSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Apply theme and appearance settings
  useEffect(() => {
    const applySettings = () => {
      const root = document.documentElement;
      const { theme, fontSize, colorScheme, compactMode } = settings.appearance;
      const { reduceMotion, highContrast } = settings.accessibility;
      
      // Apply theme
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Apply font size
      root.style.fontSize = fontSize === 'small' ? '14px' : 
                            fontSize === 'large' ? '18px' : '16px';
      
      // Apply color scheme
      root.setAttribute('data-color-scheme', colorScheme);
      
      // Apply compact mode
      if (compactMode) {
        root.classList.add('compact');
      } else {
        root.classList.remove('compact');
      }
      
      // Apply accessibility settings
      if (reduceMotion) {
        root.classList.add('reduce-motion');
      } else {
        root.classList.remove('reduce-motion');
      }
      
      if (highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }
    };
    
    applySettings();
  }, [settings.appearance, settings.accessibility]);

  // Update nested settings
  const updateSettings = (category: keyof UserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // Update notification settings
  const updateNotificationSettings = (type: 'email' | 'push', field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: {
          ...prev.notifications[type],
          [field]: value
        }
      }
    }));
  };

  // Save settings to localStorage
  const saveSettings = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('userSettings', JSON.stringify(settings));
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to default settings
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('userSettings');
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      updateNotificationSettings,
      saveSettings,
      resetSettings,
      isLoading
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}