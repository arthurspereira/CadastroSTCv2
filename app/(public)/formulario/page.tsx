"use client";

import { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X, Plus } from "lucide-react";
import {
  solicitacaoSchema,
  type SolicitacaoFormData,
} from "@/lib/validations/solicitacao";
import { inserirPrestador, enviarEmail } from "@/lib/api/prestadores";
import { LgpdModal } from "@/components/solicitacao/LgpdModal";
import { ModalHorarios } from "@/components/solicitacao/ModalHorarios";
import Image from "next/image";

const EMPTY_FORM: SolicitacaoFormData = {
  empresa: "",
  lojaSala: "",
  pavimento: "Torre Sul",
  solicitante: "",
  contato: "",
  email: "",
  inicio: "",
  termino: "",
  horaInicio: "",
  servico: "",
  prestadores: [{ nome: "", dados: "", funcao: "" }],
};

export default function SolicitacaoPage() {
  const [lgpdAceito, setLgpdAceito] = useState(false);
  const [lgpdModalOpen, setLgpdModalOpen] = useState(false);
  const [horariosModalOpen, setHorariosModalOpen] = useState(true);
  const setMensagem = (mensagem: { texto: string; tipo: "sucesso" | "erro" } | null) => {
    if (mensagem) alert(mensagem.texto);
  };
  const politicaLinkRef = useRef<HTMLButtonElement>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SolicitacaoFormData>({
    resolver: zodResolver(solicitacaoSchema),
    defaultValues: {
      ...EMPTY_FORM,
      pavimento: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "prestadores",
  });

  // ── Mutation: inserir prestadores ──
  const insertMutation = useMutation({
    mutationFn: (payload: { records: Record<string, unknown>[] }) =>
      inserirPrestador(payload),
  });

  // ── Mutation: enviar e-mail ──
  const emailMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => enviarEmail(payload),
  });

  function limparCampos() {
    reset({
      ...EMPTY_FORM,
      pavimento: undefined,
    });
    setLgpdAceito(false);
  }

  async function onSubmit(data: SolicitacaoFormData) {
    // 1. Gerar protocolo de 5 dígitos
    const protocolo = String(Math.floor(10000 + Math.random() * 90000));

    // 2. Montar 1 registro por prestador válido
    const horario = data.horaInicio || "";

    const records = data.prestadores
      .filter((p) => p.nome && p.dados && p.funcao)
      .map((p) => ({
        empresa: data.empresa,
        sala: data.lojaSala,
        pavimento: data.pavimento,
        responsavel: data.solicitante,
        contato: data.contato,
        email: data.email,
        nome: p.nome,
        dados: p.dados,
        funcao: p.funcao,
        servico: data.servico,
        horario,
        inicio: data.inicio || null,
        termino: data.termino || null,
        protocolo,
        status: "pendente",
      }));

    if (!records.length) {
      alert("Preencha ao menos um prestador com Nome Completo.");
      return;
    }

    try {
      // 3. Inserir registros
      const result = await insertMutation.mutateAsync({ records });

      if (result.error) {
        setMensagem({
          tipo: "erro",
          texto:
            "Erro ao enviar solicitação. Detalhes: " +
            (result.error || "Erro desconhecido"),
        });
        return;
      }

      // 4. Enviar e-mail com dados do PRIMEIRO prestador
      const primeiroPrestador = records[0];
      try {
        await emailMutation.mutateAsync({
          email: data.email,
          protocolo,
          empresa: data.empresa,
          sala: data.lojaSala,
          pavimento: data.pavimento,
          responsavel: data.solicitante,
          contato: data.contato,
          servico: data.servico,
          horario,
          inicio: data.inicio,
          termino: data.termino,
          nomePrestador: primeiroPrestador.nome,
          dadosPrestador: primeiroPrestador.dados,
          funcaoPrestador: primeiroPrestador.funcao,
        });
      } catch (emailErr) {
        console.error("Erro ao enviar e-mail:", emailErr);
      }

      // 5. Sucesso — mostrar mensagem e limpar
      setMensagem({
        tipo: "sucesso",
        texto: `Solicitação enviada com sucesso!\n\nNúmero do protocolo: #${protocolo}\n\nAguarde a confirmação por e-mail para liberação do serviço.`,
      });
      reset({
        ...EMPTY_FORM,
        pavimento: undefined,
      });
      setLgpdAceito(false);
    } catch {
      // 6. Erro no insert — não limpa o formulário
      setMensagem({
        tipo: "erro",
        texto: "Erro inesperado ao enviar solicitação.",
      });
    }
  }

  const isSubmitting = insertMutation.isPending;

  return (
    <div className="min-h-screen bg-dark-800 text-white flex flex-col items-center px-4 pt-8 pb-4">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/logo.png"
          alt="Salvador Trade Center Logo"
          width={160}
          height={64}
          className="h-16 w-auto"
          priority
        />
      </div>

      {/* Título e Subtítulo */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Formulário de Solicitação de Serviço
        </h1>
        <p className="text-base text-white">
          Condomínio Salvador Trade Center
        </p>
      </div>

      {/* Formulário */}
      <div className="w-full max-w-[56rem] bg-dark-700 rounded-lg p-8 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.5)] max-sm:p-4">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
          noValidate
        >
          {/* Empresa */}
          <div className="flex flex-col">
            <label className="text-white mb-2 text-base">Empresa</label>
            <input
              type="text"
              placeholder="Informe o nome da empresa"
              className="form-input"
              {...register("empresa")}
            />
            {errors.empresa && (
              <span className="form-error">{errors.empresa.message}</span>
            )}
          </div>

          {/* Loja/Sala e Pavimento */}
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col">
              <label className="text-white mb-2 text-base">Loja/Sala N°</label>
              <input
                type="text"
                placeholder="Informe a sala ou loja"
                maxLength={20}
                className="form-input"
                {...register("lojaSala")}
              />
              {errors.lojaSala && (
                <span className="form-error">{errors.lojaSala.message}</span>
              )}
            </div>
            <div className="flex flex-col">
              <label className="text-white mb-2 text-base">Pavimento</label>
              <select
                className="form-input cursor-pointer"
                {...register("pavimento")}
              >
                <option value="">Selecione</option>
                <option value="Torre Sul">Torre Sul</option>
                <option value="Torre Norte">Torre Norte</option>
                <option value="Lojas Sul">Lojas Sul</option>
                <option value="Lojas Norte">Lojas Norte</option>
              </select>
              {errors.pavimento && (
                <span className="form-error">{errors.pavimento.message}</span>
              )}
            </div>
          </div>

          {/* Solicitante e Contato */}
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col">
              <label className="text-white mb-2 text-base">Solicitante</label>
              <input
                type="text"
                placeholder="Informe o seu nome completo"
                className="form-input"
                {...register("solicitante")}
              />
              {errors.solicitante && (
                <span className="form-error">
                  {errors.solicitante.message}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <label className="text-white mb-2 text-base">Contato</label>
              <input
                type="text"
                placeholder="Telefone/WhatsApp"
                maxLength={11}
                className="form-input"
                {...register("contato")}
              />
              {errors.contato && (
                <span className="form-error">{errors.contato.message}</span>
              )}
            </div>
          </div>

          {/* E-mail */}
          <div className="flex flex-col">
            <label className="text-white mb-2 text-base">E-mail</label>
            <input
              type="email"
              placeholder="Informe o e-mail para contato"
              className="form-input"
              {...register("email")}
            />
            {errors.email && (
              <span className="form-error">{errors.email.message}</span>
            )}
          </div>

          {/* Data Início e Data Término */}
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col">
              <label className="text-white mb-2 text-base">Data Início</label>
              <input
                type="date"
                className="form-input"
                {...register("inicio")}
              />
              {errors.inicio && (
                <span className="form-error">{errors.inicio.message}</span>
              )}
            </div>
            <div className="flex flex-col">
              <label className="text-white mb-2 text-base">Data Término</label>
              <input
                type="date"
                className="form-input"
                {...register("termino")}
              />
              {errors.termino && (
                <span className="form-error">{errors.termino.message}</span>
              )}
            </div>
          </div>

          {/* Hora Início */}
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col">
              <label className="text-white mb-2 text-base">Hora Início</label>
              <input
                type="time"
                className="form-input"
                {...register("horaInicio")}
              />
              {errors.horaInicio && (
                <span className="form-error">{errors.horaInicio.message}</span>
              )}
            </div>
          </div>

          {/* Descrição do(s) serviço(s) */}
          <div className="flex flex-col">
            <label className="text-white mb-2 text-base">
              Descrição do(s) serviço(s)
            </label>
            <textarea
              rows={4}
              placeholder="Descreva o(s) serviço(s) a serem executados"
              className="form-input resize-none"
              {...register("servico")}
            />
            {errors.servico && (
              <span className="form-error">{errors.servico.message}</span>
            )}
          </div>

          {/* Seção de Prestadores */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-base">
                Relação dos prestador(es) de serviço
              </h3>
              <button
                type="button"
                onClick={() => append({ nome: "", dados: "", funcao: "" })}
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold transition-colors"
              >
                <Plus size={16} />
                Adicionar Prestador
              </button>
            </div>

            {errors.prestadores?.root && (
              <span className="form-error mb-3 block">
                {errors.prestadores.root.message}
              </span>
            )}

            <div className="flex flex-col gap-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-dark-800 rounded-lg p-4 relative"
                >
                  {/* Botão remover — só aparece quando há mais de 1 */}
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 text-error-400 hover:text-error-300 transition-colors"
                      title="Remover prestador"
                    >
                      <X size={24} />
                    </button>
                  )}

                  <div className="text-white text-sm font-bold mb-3">
                    Prestador {index + 1}
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Nome Completo */}
                    <div className="flex flex-col">
                      <label className="text-white mb-2 text-base">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        placeholder="Informe o nome completo do profissional"
                        className="form-input !bg-dark-700"
                        {...register(`prestadores.${index}.nome`)}
                      />
                      {errors.prestadores?.[index]?.nome && (
                        <span className="form-error">
                          {errors.prestadores[index].nome.message}
                        </span>
                      )}
                    </div>

                    {/* Dados e Função */}
                    <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                      <div className="flex flex-col">
                        <label className="text-white mb-2 text-base">
                          Dados
                        </label>
                        <input
                          type="text"
                          placeholder="Informe o RG/CPF"
                          maxLength={11}
                          className="form-input !bg-dark-700"
                          {...register(`prestadores.${index}.dados`)}
                        />
                        {errors.prestadores?.[index]?.dados && (
                          <span className="form-error">
                            {errors.prestadores[index].dados.message}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <label className="text-white mb-2 text-base">
                          Função
                        </label>
                        <input
                          type="text"
                          placeholder="Informe a função do profissional"
                          className="form-input !bg-dark-700"
                          {...register(`prestadores.${index}.funcao`)}
                        />
                        {errors.prestadores?.[index]?.funcao && (
                          <span className="form-error">
                            {errors.prestadores[index].funcao.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aceite LGPD */}
          <div className="bg-dark-800 border-l-4 border-blue-500 rounded-lg py-5 px-6 max-sm:px-4 max-sm:py-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={lgpdAceito}
                onChange={(e) => setLgpdAceito(e.target.checked)}
                className="mt-0.5 w-5 h-5 shrink-0 cursor-pointer accent-success-500"
              />
              <span className="text-gray-300 text-sm leading-relaxed">
                Li e concordo com a{" "}
                <button
                  ref={politicaLinkRef}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLgpdModalOpen(true);
                  }}
                  className="text-white font-bold uppercase underline underline-offset-2 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-dark-800 rounded-sm"
                >
                  POLÍTICA DE PRIVACIDADE
                </button>{" "}
                e autorizo o tratamento dos meus dados pessoais e dos
                prestadores de serviço para as finalidades descritas, conforme a
                Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                <span className="text-error-400 ml-1">*</span>
              </span>
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              type="submit"
              disabled={!lgpdAceito || isSubmitting}
              className="bg-success-500 hover:bg-success-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-success-500 text-white px-8 py-3 rounded font-bold text-base transition-colors"
            >
              {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
            </button>
            <button
              type="button"
              onClick={limparCampos}
              disabled={isSubmitting}
              className="bg-warning-500 hover:bg-warning-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded font-bold text-base transition-colors"
            >
              Limpar Campos
            </button>
          </div>
        </form>
      </div>

      {/* Modal LGPD */}
      <LgpdModal
        isOpen={lgpdModalOpen}
        onClose={() => setLgpdModalOpen(false)}
        triggerRef={politicaLinkRef}
      />

      {/* Modal Horários (Abre automaticamente no início) */}
      <ModalHorarios
        isOpen={horariosModalOpen}
        onClose={() => setHorariosModalOpen(false)}
      />

      {/* Copyright */}
      <footer className="mt-auto pt-8 w-full text-center">
        <p 
          className="text-gray-400 tracking-wide"
          style={{ fontFamily: "Arial, sans-serif", fontSize: "12px" }}
        >
          &copy; {new Date().getFullYear()} Condomínio Salvador Trade Center. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
