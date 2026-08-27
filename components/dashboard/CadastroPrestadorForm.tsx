"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronDown, ChevronUp, Trash2, Save, Eraser } from "lucide-react";
import {
  prestadorDashboardSchema,
  type PrestadorDashboardFormData,
} from "@/lib/validations/prestador-dashboard";
import { inserirPrestador, atualizarPrestador } from "@/lib/api/prestadores";
import type { Prestador } from "@/lib/validations/types";

// ── Ref API exposta para o componente pai ──────────────────────────────────
export interface CadastroPrestadorFormRef {
  startEdit: (prestador: Prestador) => void;
}

// ── Props ──────────────────────────────────────────────────────────────────
interface CadastroPrestadorFormProps {
  onSuccess?: () => void; // callback para a tabela refrescar
}

// ── Valor padrão de um prestador vazio ────────────────────────────────────
const EMPTY_PRESTADOR = { nome: "", dados: "", funcao: "" };

// ── Valor padrão do formulário todo ───────────────────────────────────────
const EMPTY_FORM: PrestadorDashboardFormData = {
  empresa: "",
  sala: "",
  pavimento: "Torre Sul",
  responsavel: "",
  contato: "",
  email: "",
  servico: "",
  horario: "",
  inicio: "",
  termino: "",
  prestadores: [{ ...EMPTY_PRESTADOR }],
};

// ── Título dinâmico do bloco do acordeão ──────────────────────────────────
function tituloPrestador(numero: number, nome: string) {
  const primeiro = (nome || "").trim().split(/\s+/)[0] || "";
  return primeiro ? `Prestador ${numero} — ${primeiro}` : `Prestador ${numero}`;
}

// ── Componente principal ───────────────────────────────────────────────────
export const CadastroPrestadorForm = forwardRef<
  CadastroPrestadorFormRef,
  CadastroPrestadorFormProps
>(function CadastroPrestadorForm({ onSuccess }, ref) {
  const queryClient = useQueryClient();

  // editingId !== null  →  modo EDITAR
  const [editingId, setEditingId] = useState<string | null>(null);
  const setMensagem = (mensagem: {
    tipo: "sucesso" | "erro";
    texto: string;
  } | null) => {
    if (mensagem) alert(mensagem.texto);
  };

  // índice do bloco aberto no acordeão (null = todos fechados)
  const [openIndex, setOpenIndex] = useState<number>(0);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<PrestadorDashboardFormData, any, PrestadorDashboardFormData>({
    resolver: zodResolver(prestadorDashboardSchema) as any,
    defaultValues: { ...EMPTY_FORM, pavimento: undefined },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "prestadores",
  });

  // Observar os nomes para atualizar títulos reativamente
  const watchedPrestadores = watch("prestadores");

  // ── Limpar / resetar ────────────────────────────────────────────────────
  const limpar = useCallback(({ preservarMensagem = false } = {}) => {
    reset({ ...EMPTY_FORM, pavimento: undefined });
    setEditingId(null);
    if (!preservarMensagem) setMensagem(null);
    setOpenIndex(0);
  }, [reset]);

  // ── Modo EDITAR — chamado pela tabela via ref ───────────────────────────
  useImperativeHandle(ref, () => ({
    startEdit(p: Prestador) {
      reset({
        empresa: p.empresa || "",
        sala: p.sala || "",
        pavimento: p.pavimento,
        responsavel: p.responsavel || "",
        contato: p.contato || "",
        email: p.email || "",
        servico: p.servico || "",
        horario: p.horario || "",
        inicio: p.inicio || "",
        termino: p.termino || "",
        prestadores: [
          {
            nome: p.nome || "",
            dados: p.dados || "",
            funcao: p.funcao || "",
          },
        ],
      });
      setEditingId(p.id);
      setMensagem(null);
      setOpenIndex(0);
      // Rola o card para cima para o usuário ver o formulário
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  }));

  const formCardRef = useRef<HTMLDivElement>(null);

  // ── Mutations ───────────────────────────────────────────────────────────
  const insertMutation = useMutation({
    mutationFn: (payload: { records: Record<string, unknown>[] }) =>
      inserirPrestador(payload),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      atualizarPrestador(payload),
  });

  // ── Submit ───────────────────────────────────────────────────────────────
  async function onSubmit(data: PrestadorDashboardFormData) {
    setMensagem(null);

    // ── MODO EDITAR ──────────────────────────────────────────────────────
    if (editingId) {
      // Usa APENAS o primeiro prestador do acordeão (limitação proposital)
      const p0 = data.prestadores[0] ?? EMPTY_PRESTADOR;

      try {
        const result = await updateMutation.mutateAsync({
          id: editingId,
          empresa: data.empresa,
          sala: data.sala,
          pavimento: data.pavimento,
          responsavel: data.responsavel,
          contato: data.contato,
          nome: p0.nome || "",
          dados: p0.dados || "",
          funcao: p0.funcao || "",
          servico: data.servico,
          horario: data.horario,
          inicio: data.inicio || null,
          termino: data.termino || null,
        });

        if (result?.error) {
          setMensagem({ tipo: "erro", texto: "Erro ao atualizar: " + result.error });
          return;
        }

        setMensagem({ tipo: "sucesso", texto: "Registro atualizado!" });
        queryClient.invalidateQueries({ queryKey: ["prestadores"] });
        onSuccess?.();
        limpar({ preservarMensagem: true });
      } catch {
        setMensagem({ tipo: "erro", texto: "Erro inesperado ao atualizar." });
      }
      return;
    }

    // ── MODO CRIAR ───────────────────────────────────────────────────────
    const validos = data.prestadores.filter((p) => p.nome && p.nome.trim());

    if (!validos.length) {
      setMensagem({
        tipo: "erro",
        texto: "Informe o nome completo de ao menos um prestador.",
      });
      return;
    }

    const protocolo_lote = "P" + Date.now().toString(36).toUpperCase();

    const records = validos.map((p) => ({
      empresa: data.empresa,
      sala: data.sala,
      pavimento: data.pavimento,
      responsavel: data.responsavel,
      contato: data.contato,
      nome: p.nome || "",
      dados: p.dados || "",
      funcao: p.funcao || "",
      servico: data.servico,
      horario: data.horario,
      inicio: data.inicio || null,
      termino: data.termino || null,
      protocolo_lote,
      status: "pendente",
    }));

    try {
      const result = await insertMutation.mutateAsync({ records });

      if (result?.error) {
        setMensagem({
          tipo: "erro",
          texto: "Erro ao cadastrar: " + (result.error || "Erro desconhecido"),
        });
        return;
      }

      const qtd = records.length;
      setMensagem({
        tipo: "sucesso",
        texto:
          qtd > 1
            ? `${qtd} prestadores cadastrados com sucesso!`
            : "Prestador cadastrado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["prestadores"] });
      onSuccess?.();
      limpar({ preservarMensagem: true });
    } catch {
      setMensagem({ tipo: "erro", texto: "Erro inesperado ao cadastrar." });
    }
  }

  // ── Acordeão: toggle ────────────────────────────────────────────────────
  function toggleBloco(index: number) {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  }

  // ── Adicionar bloco — fecha todos, abre o novo ──────────────────────────
  function adicionarPrestador() {
    append({ ...EMPTY_PRESTADOR });
    setOpenIndex(fields.length); // fields.length é o índice do novo item (antes do append)
  }

  // ── Remover bloco ────────────────────────────────────────────────────────
  function removerBloco(index: number) {
    if (fields.length <= 1) return;
    remove(index);
    // Se estava aberto, abrir o anterior (ou o 0)
    setOpenIndex((prev) => {
      if (prev === index) return Math.max(0, index - 1);
      if (prev > index) return prev - 1;
      return prev;
    });
  }

  const isSubmitting = insertMutation.isPending || updateMutation.isPending;
  const modoEditar = editingId !== null;

  // ── Estilos reutilizáveis ────────────────────────────────────────────────
  const inputCls =
    "w-full bg-dark-900 text-gray-200 border border-gray-700 rounded-[10px] py-2.5 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500";
  const labelCls = "block text-[13px] text-gray-400 mb-1.5";
  const errorCls = "text-error-400 text-xs mt-1";

  return (
    <div
      ref={formCardRef}
      className="bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] backdrop-blur-sm border border-gray-800 rounded-2xl p-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
    >
      {/* Título do card */}
      <h2 className="text-lg font-bold mb-4 text-gray-100">
        {modoEditar ? "Editar Prestador" : "Cadastro de Prestador"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Empresa */}
        <div className="mb-3">
          <label className={labelCls}>Empresa</label>
          <input
            type="text"
            placeholder="Nome da empresa"
            className={inputCls}
            {...register("empresa")}
          />
          {errors.empresa && <p className={errorCls}>{errors.empresa.message}</p>}
        </div>

        {/* Sala + Pavimento */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelCls}>Sala</label>
            <input
              type="text"
              placeholder="Ex.: 1203"
              maxLength={20}
              className={inputCls}
              {...register("sala")}
            />
            {errors.sala && <p className={errorCls}>{errors.sala.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Pavimento</label>
            <select className={inputCls + " cursor-pointer"} {...register("pavimento")}>
              <option value="">Selecione...</option>
              <option value="Torre Sul">Torre Sul</option>
              <option value="Torre Norte">Torre Norte</option>
              <option value="Lojas Sul">Lojas Sul</option>
              <option value="Lojas Norte">Lojas Norte</option>
            </select>
            {errors.pavimento && (
              <p className={errorCls}>{errors.pavimento.message}</p>
            )}
          </div>
        </div>

        {/* Responsável + Contato */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelCls}>Responsável</label>
            <input
              type="text"
              placeholder="Nome do responsável"
              className={inputCls}
              {...register("responsavel")}
            />
          </div>
          <div>
            <label className={labelCls}>Contato</label>
            <input
              type="text"
              placeholder="Telefone / WhatsApp"
              maxLength={11}
              className={inputCls}
              {...register("contato")}
            />
          </div>
        </div>

        {/* E-mail */}
        <div className="mb-3">
          <label className={labelCls}>E-mail</label>
          <input
            type="email"
            placeholder="Informe o e-mail para contato"
            autoComplete="email"
            className={inputCls}
            {...register("email")}
          />
          {errors.email && <p className={errorCls}>{errors.email.message}</p>}
        </div>

        {/* ── Seção de Prestadores (Acordeão) ── */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-gray-400 font-medium">Prestadores</span>
            <button
              type="button"
              onClick={adicionarPrestador}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/40 hover:border-blue-400 rounded-lg px-2.5 py-1.5"
            >
              <Plus size={13} />
              Adicionar Prestador
            </button>
          </div>

          {errors.prestadores?.root && (
            <p className={errorCls + " mb-2"}>
              {errors.prestadores.root.message}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            {fields.map((field, index) => {
              const isOpen = openIndex === index;
              const nomeAtual = watchedPrestadores?.[index]?.nome ?? "";
              const titulo = tituloPrestador(index + 1, nomeAtual);

              return (
                <div
                  key={field.id}
                  className="border border-gray-700 rounded-xl overflow-hidden"
                >
                  {/* Cabeçalho do bloco */}
                  <button
                    type="button"
                    onClick={() => toggleBloco(index)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-dark-900 hover:bg-dark-800 transition-colors text-left"
                  >
                    <span className="text-sm text-gray-200 font-medium">
                      {titulo}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Botão remover — só quando há mais de 1 bloco */}
                      {fields.length > 1 && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            removerBloco(index);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                              removerBloco(index);
                            }
                          }}
                          className="text-error-400 hover:text-error-300 transition-colors p-0.5 rounded"
                          title="Remover prestador"
                        >
                          <Trash2 size={14} />
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronUp size={15} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={15} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Corpo do bloco */}
                  {isOpen && (
                    <div className="px-3.5 py-3 bg-dark-800 flex flex-col gap-3">
                      {/* Nome Completo */}
                      <div>
                        <label className={labelCls}>Nome Completo</label>
                        <input
                          type="text"
                          placeholder="Nome completo do prestador"
                          className={inputCls}
                          {...register(`prestadores.${index}.nome`)}
                        />
                        {errors.prestadores?.[index]?.nome && (
                          <p className={errorCls}>
                            {errors.prestadores[index].nome.message}
                          </p>
                        )}
                      </div>

                      {/* Dados + Função */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Dados (RG/CPF)</label>
                          <input
                            type="text"
                            placeholder="Documento do prestador"
                            maxLength={14}
                            className={inputCls}
                            {...register(`prestadores.${index}.dados`)}
                          />
                          {errors.prestadores?.[index]?.dados && (
                            <p className={errorCls}>
                              {errors.prestadores[index].dados.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className={labelCls}>Função</label>
                          <input
                            type="text"
                            placeholder="Ex.: Pedreiro, Eletricista..."
                            className={inputCls}
                            {...register(`prestadores.${index}.funcao`)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Serviço */}
        <div className="mb-3">
          <label className={labelCls}>Serviço</label>
          <textarea
            rows={3}
            placeholder="Descrição resumida do serviço a ser executado"
            className={inputCls + " resize-none"}
            {...register("servico")}
          />
          {errors.servico && (
            <p className={errorCls}>{errors.servico.message}</p>
          )}
        </div>

        {/* Horário */}
        <div className="mb-3">
          <label className={labelCls}>Horário</label>
          <input
            type="text"
            placeholder="Ex.: 22:00"
            className={inputCls}
            {...register("horario")}
          />
        </div>

        {/* Início + Término */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={labelCls}>Início</label>
            <input
              type="date"
              className={inputCls}
              {...register("inicio")}
            />
          </div>
          <div>
            <label className={labelCls}>Término</label>
            <input
              type="date"
              className={inputCls}
              {...register("termino")}
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-br from-success-500 to-success-600 text-[#041a0c] py-2.5 px-3.5 font-semibold rounded-xl text-sm cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-[0_8px_16px_rgba(16,185,129,0.25)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} className="opacity-80" />
            {isSubmitting
              ? modoEditar
                ? "Atualizando..."
                : "Cadastrando..."
              : modoEditar
              ? "Atualizar"
              : "Cadastrar"}
          </button>

          <button
            type="button"
            onClick={() => limpar()}
            disabled={isSubmitting}
            className="flex-1 flex justify-center items-center gap-2 border border-amber-500/30 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/60 py-2.5 px-3.5 font-semibold rounded-xl text-sm cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eraser size={16} className="opacity-80" />
            Limpar
          </button>
        </div>
      </form>
    </div>
  );
});
