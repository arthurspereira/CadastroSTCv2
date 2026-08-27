"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { LogOut, ChevronDown } from "lucide-react";

import {
  CadastroPrestadorForm,
  type CadastroPrestadorFormRef,
} from "@/components/dashboard/CadastroPrestadorForm";
import { PrestadoresTable } from "@/components/dashboard/PrestadoresTable";
import type { Prestador } from "@/lib/validations/types";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Ref para acessar métodos do formulário (modo editar)
  const formRef = useRef<CadastroPrestadorFormRef>(null);

  // Redireciona se não estiver logado (usando useEffect para evitar aviso do React)
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Mostra loading enquanto restaura sessão
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-dark-900 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  const isMaster = user.role === "master";
  const roleBadge = isMaster ? "(Master)" : "(Comum)";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-dark-900 text-gray-200 font-sans">
      <div className="max-w-[1500px] mx-auto px-5 pt-4 pb-8 w-full">
        
        {/* Header Consolidado (Logo + Usuário) */}
        <div className="flex items-center justify-between mb-5">
          
          {/* Logo e Título (Esquerda) */}
          <div className="flex items-center gap-3">
            <img
              src="/stc-amarelo.png"
              alt="Logo do Condomínio Salvador Trade Center"
              className="w-[50px] h-[50px] object-contain block"
            />
            <div>
              <h1 className="text-[clamp(18px,2.2vw,24px)] m-0 tracking-[.5px] font-bold">
                Cadastro de Obras e Reformas
              </h1>
              <div className="text-gray-400 mt-0.5 text-xs sm:text-sm">
                Condomínio Salvador Trade Center
              </div>
            </div>
          </div>

          {/* Menu do Usuário (Direita) */}
          <div className="relative inline-flex text-sm text-gray-400">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center gap-2 border border-gray-800 bg-dark-900/40 text-gray-400 px-3 py-2 rounded-xl cursor-pointer hover:border-[#2a3a52] hover:text-gray-200 transition-colors active:translate-y-0"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span>
                Olá, {user.usuario} {roleBadge}
              </span>
              <ChevronDown size={14} className="opacity-90" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-[calc(100%+8px)] min-w-[190px] p-1.5 border border-gray-800 rounded-xl bg-[#0b1324] shadow-[0_12px_30px_rgba(0,0,0,0.35)] z-50"
                role="menu"
              >
                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-left px-2.5 py-2.5 rounded-lg border-0 bg-transparent text-error-400 font-semibold cursor-pointer hover:bg-white/5 transition-colors inline-flex items-center gap-2"
                  role="menuitem"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grid de 2 colunas assimétrico */}
        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Lado Esquerdo: Formulário */}
          <div>
            {!isMaster ? (
              <div className="bg-dark-900/50 border border-gray-800 rounded-2xl p-5 text-gray-400 text-sm">
                Área restrita. Apenas usuários master podem cadastrar registros.
              </div>
            ) : (
              <CadastroPrestadorForm ref={formRef} />
            )}
          </div>

          {/* Lado Direito: Tabela / Relatório */}
          <div className="min-w-0">
            <PrestadoresTable
              user={user}
              onEdit={(prestador: Prestador) => {
                // Inicia a edição preenchendo o form via ref
                formRef.current?.startEdit(prestador);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
