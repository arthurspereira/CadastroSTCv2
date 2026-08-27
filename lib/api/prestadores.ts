import { supabase } from '../supabase/client';

async function getHeaders() {
  const { data } = await supabase.auth.getSession();
  // Usa o token de acesso do usuário logado (JWT válido). Se não tiver logado (form público), usa a chave anon
  const token = data.session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}

export async function listarPrestadores() {
  const res = await fetch(process.env.NEXT_PUBLIC_EDGE_LIST!, {
    method: 'GET',
    headers: await getHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao listar prestadores');
  return res.json();
}

export async function inserirPrestador(data: Record<string, unknown>) {
  const res = await fetch(process.env.NEXT_PUBLIC_EDGE_INSERT!, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao inserir prestador');
  return res.json();
}

export async function atualizarPrestador(data: Record<string, unknown>) {
  const res = await fetch(process.env.NEXT_PUBLIC_EDGE_UPDATE!, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao atualizar prestador');
  return res.json();
}

export async function deletarPrestador(id: string) {
  const res = await fetch(process.env.NEXT_PUBLIC_EDGE_DELETE!, {
    method: 'DELETE',
    headers: await getHeaders(),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Erro ao deletar prestador');
  return res.json();
}

export async function enviarEmail(data: Record<string, unknown>) {
  const res = await fetch(process.env.NEXT_PUBLIC_EDGE_EMAIL!, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao enviar email');
  return res.json();
}

export async function responderSolicitacao(data: Record<string, unknown>) {
  const res = await fetch(process.env.NEXT_PUBLIC_EDGE_RESPONDER!, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao responder solicitação');
  return res.json();
}
