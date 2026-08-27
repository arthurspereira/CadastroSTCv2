import { NextRequest, NextResponse } from "next/server";

// Domínios/subdomínios do projeto
const FORM_HOST = "formulario.salvadortradecenter.com.br";
const DASHBOARD_HOST = "dashboard.salvadortradecenter.com.br";

export function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || "";
  const { pathname } = req.nextUrl;

  // Subdomínio do formulário público -> raiz reescreve para /formulario
  if (hostname.startsWith("formulario.") || hostname === FORM_HOST) {
    // evita reescrever novamente se já estiver em /formulario
    if (!pathname.startsWith("/formulario")) {
      const url = req.nextUrl.clone();
      url.pathname = `/formulario${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Subdomínio do dashboard -> raiz reescreve para /dashboard, /login continua acessível
  if (hostname.startsWith("dashboard.") || hostname === DASHBOARD_HOST) {
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.rewrite(url);
    }
    // /login e /dashboard já resolvem naturalmente, não precisa reescrever
  }

  return NextResponse.next();
}

// Aplica o middleware a todas as rotas, exceto assets internos do Next
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
