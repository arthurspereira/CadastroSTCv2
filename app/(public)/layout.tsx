import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formulário de Solicitação de Serviço - Salvador Trade Center",
  description:
    "Solicitação de acesso de prestadores de serviço ao Condomínio Salvador Trade Center",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
