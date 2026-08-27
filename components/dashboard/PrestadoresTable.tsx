"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Check, Pencil, Search, Trash2, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  atualizarPrestador,
  deletarPrestador,
  listarPrestadores,
  responderSolicitacao,
} from "@/lib/api/prestadores";
import type { AppUser } from "@/lib/auth/AuthContext";
import type { Prestador } from "@/lib/validations/types";

interface PrestadoresTableProps {
  user: AppUser;
  onEdit: (prestador: Prestador) => void;
}

type ConfirmationAction = "aprovar" | "excluir";

interface ConfirmationState {
  action: ConfirmationAction;
  prestador: Prestador;
}

const SEARCH_FIELDS: (keyof Prestador)[] = [
  "protocolo",
  "empresa",
  "sala",
  "pavimento",
  "responsavel",
  "contato",
  "nome",
  "dados",
  "funcao",
  "servico",
  "horario",
  "inicio",
  "termino",
];

function formatarData(data: string | null) {
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-BR");
}

function estaVisivel(p: Prestador) {
  if (!p.termino) return true;
  const hojeISO = new Date().toISOString().slice(0, 10);
  return String(p.termino).slice(0, 10) >= hojeISO;
}

function StatusBadge({ status }: { status: Prestador["status"] }) {
  const statusAtual = status || "pendente";
  const classes = {
    pendente: "bg-[#ffc107] text-black",
    aprovado: "bg-[#4caf50] text-white",
    reprovado: "bg-[#f44336] text-white",
  } as const;

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${classes[statusAtual]}`}
    >
      {statusAtual.charAt(0).toUpperCase() + statusAtual.slice(1)}
    </span>
  );
}

export function PrestadoresTable({ user, onEdit }: PrestadoresTableProps) {
  const [busca, setBusca] = useState("");
  const setMensagem = (mensagem: { tipo: "sucesso" | "erro"; texto: string } | null) => {
    if (mensagem) alert(mensagem.texto);
  };
  const [confirmacao, setConfirmacao] = useState<ConfirmationState | null>(null);
  const [prestadorParaReprovar, setPrestadorParaReprovar] = useState<Prestador | null>(null);
  const [motivo, setMotivo] = useState("");
  const [erroMotivo, setErroMotivo] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "sala", desc: true },
  ]);
  const queryClient = useQueryClient();
  const isMaster = user.role === "master";

  const invalidarLista = () => queryClient.invalidateQueries({ queryKey: ["prestadores"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deletarPrestador(id);
      if (result?.error) throw new Error(result.error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const result = await atualizarPrestador(data);
      if (result?.error) throw new Error(result.error);
    },
  });

  const responderMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const result = await responderSolicitacao(data);
      if (result?.error) throw new Error(result.error);
    },
  });

  const { data: prestadores = [], isPending, isError } = useQuery({
    queryKey: ["prestadores"],
    queryFn: async (): Promise<Prestador[]> => {
      const result = await listarPrestadores();
      console.log("Resposta da Edge Function listarPrestadores:", result);
      if (result?.error) throw new Error(result.error);
      
      // O Supabase às vezes retorna { data: [...] } e às vezes apenas [...]
      if (Array.isArray(result)) return result;
      if (Array.isArray(result?.data)) return result.data;
      return [];
    },
  });

  const dadosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return prestadores.filter((prestador) => {
      if (!estaVisivel(prestador)) return false;
      if (!termo) return true;

      return SEARCH_FIELDS.some((campo) =>
        String(prestador[campo] ?? "").toLowerCase().includes(termo)
      );
    });
  }, [busca, prestadores]);

  const columns = useMemo<ColumnDef<Prestador>[]>(() => {
    const colunas: ColumnDef<Prestador>[] = [
      { accessorKey: "protocolo", header: "Protocolo", cell: ({ getValue }) => getValue<string | null>() || "-" },
      { accessorKey: "empresa", header: "Empresa" },
      { accessorKey: "sala", header: "Sala" },
      { accessorKey: "pavimento", header: "Pavimento" },
      { accessorKey: "responsavel", header: "Responsável" },
      { accessorKey: "contato", header: "Contato" },
      { accessorKey: "email", header: "E-mail" },
      { accessorKey: "nome", header: "Prestador" },
      { accessorKey: "dados", header: "Dados (RG/CPF)" },
      { accessorKey: "funcao", header: "Função" },
      { accessorKey: "servico", header: "Serviço" },
      { accessorKey: "horario", header: "Horário" },
      { accessorKey: "inicio", header: "Início", cell: ({ getValue }) => formatarData(getValue<string | null>()) },
      { accessorKey: "termino", header: "Término", cell: ({ getValue }) => formatarData(getValue<string | null>()) },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<Prestador["status"]>()} /> },
    ];

    if (isMaster) {
      colunas.push(
        {
          id: "aprovar-reprovar",
          header: "Aprovar/Reprovar",
          cell: ({ row }) =>
            row.original.status === "pendente" ? (
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setConfirmacao({ action: "aprovar", prestador: row.original })} title="Aprovar" aria-label="Aprovar" className="inline-flex items-center gap-1 rounded bg-success-500 px-2 py-1 text-xs font-medium text-[#041a0c]">
                  <Check size={12} /> Aprovar
                </button>
                <button type="button" onClick={() => { setPrestadorParaReprovar(row.original); setMotivo(""); setErroMotivo(""); }} title="Reprovar" aria-label="Reprovar" className="inline-flex items-center gap-1 rounded bg-error-500 px-2 py-1 text-xs font-medium text-white">
                  <X size={12} /> Reprovar
                </button>
              </div>
            ) : (
              "-"
            ),
        },
        {
          id: "acoes",
          header: "Ações",
          cell: ({ row }) => (
            <div className="flex gap-1">
              <button type="button" onClick={() => onEdit(row.original)} title="Editar" aria-label="Editar" className="rounded p-1 text-blue-400 hover:text-blue-300">
                <Pencil size={15} />
              </button>
              <button type="button" onClick={() => setConfirmacao({ action: "excluir", prestador: row.original })} title="Excluir" aria-label="Excluir" className="rounded p-1 text-error-400 hover:text-error-300">
                <Trash2 size={15} />
              </button>
            </div>
          ),
        }
      );
    }

    return colunas;
  }, [isMaster]);

  const table = useReactTable({
    data: dadosFiltrados,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  async function confirmarAcao() {
    if (!confirmacao) return;

    const { action, prestador } = confirmacao;
    setMensagem(null);

    try {
      if (action === "excluir") {
        await deleteMutation.mutateAsync(prestador.id);
        await invalidarLista();
        setMensagem({ tipo: "sucesso", texto: "Registro removido com sucesso!" });
      } else {
        await updateMutation.mutateAsync({ id: prestador.id, status: "aprovado" });
        try {
          await responderMutation.mutateAsync({
            protocolo: prestador.protocolo,
            email: prestador.email,
            empresa: prestador.empresa,
            sala: prestador.sala,
            pavimento: prestador.pavimento,
            horario: prestador.horario,
            inicio: prestador.inicio,
            termino: prestador.termino,
            servico: prestador.servico,
            responsavel: prestador.responsavel,
            status: "aprovado",
            nomeAdmin: user.usuario,
          });
          setMensagem({ tipo: "sucesso", texto: `Solicitação #${prestador.protocolo} APROVADA! E-mail de confirmação enviado ao solicitante.` });
        } catch (error) {
          setMensagem({ tipo: "erro", texto: `Status atualizado, mas erro ao enviar e-mail: ${error instanceof Error ? error.message : "Erro desconhecido"}` });
        }
        await invalidarLista();
      }
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: action === "excluir"
          ? `Erro ao remover registro: ${error instanceof Error ? error.message : "Erro desconhecido"}`
          : `Erro ao atualizar status: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      });
    } finally {
      setConfirmacao(null);
    }
  }

  async function reprovar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prestadorParaReprovar) return;
    if (!motivo.trim()) {
      setErroMotivo("É obrigatório informar o motivo da reprovação.");
      return;
    }

    const prestador = prestadorParaReprovar;
    setMensagem(null);
    setErroMotivo("");

    try {
      await updateMutation.mutateAsync({ id: prestador.id, status: "reprovado" });
      try {
        await responderMutation.mutateAsync({
          protocolo: prestador.protocolo,
          email: prestador.email,
          empresa: prestador.empresa,
          sala: prestador.sala,
          pavimento: prestador.pavimento,
          horario: prestador.horario,
          inicio: prestador.inicio,
          termino: prestador.termino,
          servico: prestador.servico,
          responsavel: prestador.responsavel,
          status: "reprovado",
          motivo: motivo.trim(),
          nomeAdmin: user.usuario,
        });
        setMensagem({ tipo: "sucesso", texto: `Solicitação #${prestador.protocolo} REPROVADA! E-mail de notificação enviado ao solicitante.` });
      } catch (error) {
        setMensagem({ tipo: "erro", texto: `Status atualizado, mas erro ao enviar e-mail: ${error instanceof Error ? error.message : "Erro desconhecido"}` });
      }
      await invalidarLista();
      setPrestadorParaReprovar(null);
      setMotivo("");
    } catch (error) {
      setMensagem({ tipo: "erro", texto: `Erro ao atualizar status: ${error instanceof Error ? error.message : "Erro desconhecido"}` });
    }
  }

  function exportarRelatorio() {
    const linhas = table.getRowModel().rows.map(({ original }) => original);
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFontSize(16);
    doc.text("Lista de acesso - Obras e Reformas", 14, 15);
    doc.setFontSize(10);
    doc.text(`Usuário: ${user.usuario || user.email} (${user.email})`, 14, 23);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 29);
    doc.text(`Total de cadastros: ${linhas.length}`, 14, 35);

    autoTable(doc, {
      startY: 40,
      head: [[
        "Empresa",
        "Sala",
        "Pavimento",
        "Prestador",
        "Dados (RG/CPF)",
        "Função",
        "Serviço",
        "Horário",
        "Início",
        "Término",
      ]],
      body: linhas.map((prestador) => [
        prestador.empresa || "",
        prestador.sala || "",
        prestador.pavimento || "",
        prestador.nome || "",
        prestador.dados || "",
        prestador.funcao || "",
        prestador.servico || "",
        prestador.horario || "",
        formatarData(prestador.inicio),
        formatarData(prestador.termino),
      ]),
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [34, 48, 63] },
      margin: { left: 10, right: 10 },
    });

    doc.save("relatorio-obras-reformas.pdf");
  }

  return (
    <section className="bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] backdrop-blur-sm border border-gray-800 rounded-2xl p-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
      <h2 className="text-lg font-bold mb-3 text-gray-100">Filtro de busca de prestadores</h2>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between mb-3">
        <label className="relative block flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por sala, prestador, responsável ou serviço..."
            aria-label="Buscar prestadores"
            className="w-full bg-dark-900 text-gray-200 border border-gray-700 rounded-[10px] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500"
          />
        </label>
        <button type="button" onClick={exportarRelatorio} className="shrink-0 rounded-xl bg-blue-500 hover:bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors">
          Exportar relatório em PDF
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full min-w-max border-collapse text-left text-sm" aria-describedby="resumo-prestadores">
          <thead className="bg-dark-900 text-gray-300">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap border-b border-gray-800 px-3 py-2.5 text-xs font-semibold text-center">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="text-gray-300">
            {isPending ? (
              <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-gray-500">Carregando registros...</td></tr>
            ) : isError ? (
              <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-error-300">Erro ao carregar registros.</td></tr>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-800 last:border-0 hover:bg-dark-800/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-3 py-2.5 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-gray-500">Nenhum cadastro realizado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p id="resumo-prestadores" className="mt-2 text-sm text-gray-500">
        Registros cadastrados: {dadosFiltrados.length}
      </p>

      {confirmacao && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="confirmacao-titulo">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-dark-700 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
            <h3 id="confirmacao-titulo" className="text-base font-bold text-white">
              {confirmacao.action === "aprovar" ? "Aprovar solicitação" : "Excluir registro"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">
              {confirmacao.action === "aprovar"
                ? `Aprovar solicitação #${confirmacao.prestador.protocolo}? O solicitante receberá um e-mail de confirmação.`
                : "Excluir este registro?"}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmacao(null)} className="rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white">Cancelar</button>
              <button type="button" onClick={confirmarAcao} disabled={deleteMutation.isPending || updateMutation.isPending || responderMutation.isPending} className={`rounded-lg px-3 py-2 text-sm font-semibold ${confirmacao.action === "aprovar" ? "bg-success-500 text-[#041a0c]" : "bg-error-500 text-white"}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {prestadorParaReprovar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="reprovar-titulo">
          <form onSubmit={reprovar} className="w-full max-w-md rounded-xl border border-gray-700 bg-dark-700 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
            <h3 id="reprovar-titulo" className="text-base font-bold text-white">Reprovar solicitação #{prestadorParaReprovar.protocolo}</h3>
            <label htmlFor="motivo-reprovacao" className="mt-4 block text-sm text-gray-300">Motivo da reprovação</label>
            <textarea id="motivo-reprovacao" value={motivo} onChange={(event) => { setMotivo(event.target.value); setErroMotivo(""); }} className="mt-1.5 min-h-24 w-full rounded-lg border border-gray-600 bg-dark-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            {erroMotivo && <p className="mt-1 text-sm text-error-400">{erroMotivo}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setPrestadorParaReprovar(null); setMotivo(""); setErroMotivo(""); }} className="rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white">Cancelar</button>
              <button type="submit" disabled={updateMutation.isPending || responderMutation.isPending} className="rounded-lg bg-error-500 px-3 py-2 text-sm font-semibold text-white">Reprovar</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
