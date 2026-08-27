"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export interface AppUser {
  id: string;
  usuario: string;
  email: string;
  role: "master" | "comum";
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (params: {
    usuario: string;
    senha: string;
    remember: boolean;
  }) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const LS_KEY = "currentUser:v1";

// ── Helpers de localStorage ──
function getStoredUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "null");
  } catch {
    return null;
  }
}

function setStoredUser(u: AppUser) {
  localStorage.setItem(LS_KEY, JSON.stringify(u));
}

function clearStoredUser() {
  localStorage.removeItem(LS_KEY);
}

// ── Buscar role na tabela perfis ──
async function fetchRole(userId: string): Promise<"master" | "comum"> {
  const { data } = await supabase
    .from("perfis")
    .select("role")
    .eq("id", userId)
    .single();

  return (data?.role as "master" | "comum") || "comum";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ── Restaurar sessão ao montar ──
  useEffect(() => {
    async function restoreSession() {
      const stored = getStoredUser();
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        // Verificar se a sessão Supabase ainda é válida
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (error || !authUser) {
          clearStoredUser();
          setLoading(false);
          return;
        }

        // Recarregar a role antes de redirecionar
        const role = await fetchRole(authUser.id);

        const restoredUser: AppUser = {
          id: authUser.id,
          usuario: authUser.email || stored.usuario,
          email: authUser.email || stored.email,
          role,
        };

        setStoredUser(restoredUser);
        setUser(restoredUser);
      } catch {
        clearStoredUser();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  // ── Login ──
  const login = useCallback(
    async ({
      usuario,
      senha,
      remember,
    }: {
      usuario: string;
      senha: string;
      remember: boolean;
    }): Promise<string | null> => {
      const email = (usuario || "").trim();
      if (!email) return "Informe o e-mail do usuário.";

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error || !data?.user) {
        return error?.message || "Falha ao entrar.";
      }

      const role = await fetchRole(data.user.id);

      const appUser: AppUser = {
        id: data.user.id,
        usuario: data.user.email || email,
        email: data.user.email || email,
        role,
      };

      // Persistir no localStorage somente se "Manter-me conectado"
      if (remember) {
        setStoredUser(appUser);
      } else {
        clearStoredUser();
      }

      setUser(appUser);
      router.push("/dashboard");
      return null; // sem erro
    },
    [router]
  );

  // ── Logout ──
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignorar erros de signOut
    }
    clearStoredUser();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
