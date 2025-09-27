import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User, LoginCredentials, SignUpData } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (userData: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session
  useEffect(() => {
    console.log('AuthContext: Initializing without demo data call');
    try {
      const currentUser = apiService.getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
      console.log('AuthContext: Initialization successful');
    } catch (error) {
      console.error('AuthContext: Initialization error:', error);
      setIsLoading(false);
    }
  }, []);

  const signIn = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const user = await apiService.signIn(credentials);
      setUser(user);
      toast({
        title: "Welcome back!",
        description: `Successfully signed in as ${user.name}`,
      });
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (userData: SignUpData) => {
    try {
      setIsLoading(true);
      const user = await apiService.signUp(userData);
      // Automatically sign in the new user after successful registration
      await apiService.signIn({ email: userData.email, password: userData.password });
      setUser(user);
      toast({
        title: "Welcome to Urban Guardians!",
        description: `Account created successfully for ${user.name}. You are now signed in.`,
      });
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await apiService.signOut();
      setUser(null);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}