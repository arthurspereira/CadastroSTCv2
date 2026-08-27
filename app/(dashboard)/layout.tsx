// Impede pré-renderização estática (páginas autenticadas dependem de env vars no runtime)
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/AuthContext";

export const metadata: Metadata = {
  title: "Cadastro de Obras e Reformas - Salvador Trade Center",
  description: "Ambiente do sistema de cadastro de obras e reformas",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
