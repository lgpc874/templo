import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin?: boolean;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem("auth_token")
  );
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const storedToken = localStorage.getItem("auth_token");
      if (!storedToken) {
        throw new Error("No token found");
      }
      
      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${storedToken}`
        }
      });
      
      if (!response.ok) {
        // Não limpar token automaticamente - apenas em logout manual
        throw new Error("Authentication failed");
      }
      
      const data = await response.json();
      return data.user;
    },
    retry: false,
    enabled: !!localStorage.getItem("auth_token"),
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0, // Não manter em cache (TanStack Query v5)
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("auth_token", newToken);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.setItem("logout_state", "true");
    queryClient.clear(); // Limpar todo o cache
    // Redirecionar imediatamente
    window.location.href = '/';
  };

  // Sincronizar com dados do servidor quando disponíveis
  useEffect(() => {
    if (userData && !user) {
      setUser(userData);
    }
  }, [userData, user]);

  // Sistema de logout funcional - verifica se foi feito logout manual
  const wasLoggedOut = localStorage.getItem('logout_state') === 'true';
  
  // Se foi feito logout manual, manter deslogado até login manual
  if (wasLoggedOut) {
    const value: AuthContextType = {
      user: null,
      token: null,
      isLoading: false,
      login: (newToken: string, newUser: User) => {
        localStorage.removeItem('logout_state');
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem("auth_token", newToken);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      },
      logout,
      isAuthenticated: false,
    };
    
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }
  
  // Sistema de bypass para Replit (apenas em desenvolvimento)
  const isInReplit = window.location.hostname.includes('replit') || process.env.NODE_ENV === 'development';
  
  const value: AuthContextType = {
    user: user || userData,
    token,
    isLoading: isLoading || false,
    login,
    logout,
    isAuthenticated: !!(user || userData) && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}