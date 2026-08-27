"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import Image from "next/image";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [remember, setRemember] = useState(false);
  const [erro, setErro] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Se já está autenticado, redirecionar para /dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSubmitting(true);

    const errorMsg = await login({ usuario, senha, remember });
    if (errorMsg) {
      setErro(errorMsg);
    }

    setSubmitting(false);
  }

  // Enquanto carrega sessão, mostrar tela vazia
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-900 to-[#0f172a] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  // Se já está logado, não renderizar o login (vai redirecionar)
  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-[#0f172a] text-gray-200 font-sans">
      <div className="max-w-[1100px] mx-auto px-5 py-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-[18px]">
          <Image
            src="/stc-amarelo.png"
            alt="Logo do Condomínio Salvador Trade Center"
            width={55}
            height={55}
            className="w-[55px] h-[55px] object-contain"
            priority
          />
          <div>
            <h1 className="text-[clamp(20px,2.4vw,28px)] font-bold tracking-[0.5px] m-0">
              Cadastro de Obras e Reformas
            </h1>
            <div className="text-gray-400 mt-0.5 text-sm">
              Condomínio Salvador Trade Center
            </div>
          </div>
        </div>

        {/* Card de Login */}
        <section
          className="bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] backdrop-blur-sm border border-gray-800 rounded-2xl p-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
          aria-label="Tela de login"
        >
          <h2 className="text-lg font-bold mb-3 mt-0">Entrar</h2>
          <p className="text-gray-400 text-sm mb-0">
            Acesse com seu usuário e senha cadastrados.
          </p>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="login-usuario"
              className="block text-[13px] text-gray-400 mt-2.5 mb-1.5"
            >
              Usuário
            </label>
            <input
              id="login-usuario"
              name="usuario"
              autoComplete="username"
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full bg-dark-900 text-gray-200 border border-gray-800 rounded-[10px] py-2.5 px-3 outline-none text-sm"
            />

            <label
              htmlFor="login-senha"
              className="block text-[13px] text-gray-400 mt-2.5 mb-1.5"
            >
              Senha
            </label>
            <input
              id="login-senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-dark-900 text-gray-200 border border-gray-800 rounded-[10px] py-2.5 px-3 outline-none text-sm"
            />

            <label className="flex items-center gap-1.5 font-normal mt-2">
              <input
                id="login-remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-auto h-auto m-0"
              />
              <span className="text-sm">Manter-me conectado</span>
            </label>

            <div className="flex gap-2.5 mt-3">
              <button
                type="submit"
                disabled={submitting}
                className="border border-transparent bg-gradient-to-br from-success-500 to-success-600 text-[#041a0c] py-2.5 px-3.5 font-semibold rounded-xl cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-[0_8px_16px_rgba(0,0,0,0.25)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? "Entrando..." : "Entrar"}
              </button>
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <div className="mt-2.5 text-[13px]">
                <span className="text-error-300">{erro}</span>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
