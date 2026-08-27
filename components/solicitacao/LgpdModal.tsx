"use client";

import { useEffect, useRef, useCallback } from "react";
import { X, Lock } from "lucide-react";

interface LgpdModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function LgpdModal({ isOpen, onClose, triggerRef }: LgpdModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    onClose();
    // Devolver o foco ao link que abriu o modal
    triggerRef.current?.focus();
  }, [onClose, triggerRef]);

  // Fechar com Escape
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  // Foco no botão fechar ao abrir
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lgpd-modal-titulo"
      onClick={(e) => {
        // Fechar ao clicar fora do card
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div className="bg-dark-700 border-l-4 border-blue-500 rounded-lg w-full max-w-[36rem] max-h-[85vh] overflow-y-auto p-8 relative shadow-[0_20px_40px_rgba(0,0,0,0.6)] max-sm:p-6 max-sm:max-h-[90vh]">
        {/* Botão fechar (X) */}
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 text-gray-400 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-dark-700"
          aria-label="Fechar política de privacidade"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6 pr-8">
          <Lock size={28} className="text-blue-500 shrink-0" />
          <div>
            <h2
              id="lgpd-modal-titulo"
              className="text-white text-lg font-bold leading-tight"
            >
              Política de Privacidade
            </h2>
            <p className="text-gray-400 text-[0.775rem] mt-0.5">
              Proteção de Dados Pessoais — LGPD (Lei nº 13.709/2018)
            </p>
          </div>
        </div>

        {/* Corpo */}
        <div className="text-gray-300 text-sm leading-[1.7]">
          <p className="mb-3">
            <strong className="text-white">Finalidade:</strong> Os dados
            coletados neste formulário serão utilizados exclusivamente para o
            controle de acesso de prestadores de serviço ao Condomínio Salvador
            Trade Center.
          </p>
          <p className="mb-3">
            <strong className="text-white">Responsável pelos dados:</strong>{" "}
            Administração do Condomínio Salvador Trade Center.
          </p>
          <p className="mb-3">
            <strong className="text-white">Seus direitos:</strong> Você tem
            direito ao acesso, correção, exclusão, portabilidade e revogação do
            consentimento dos seus dados pessoais a qualquer momento.
          </p>
          <p className="mb-3">
            <strong className="text-white">Tempo de retenção:</strong> Os dados
            serão mantidos pelo período necessário para a prestação do serviço e
            cumprimento de obrigações legais.
          </p>

          <hr className="border-t border-gray-600 my-4" />

          <p className="mb-3">
            <strong className="text-white">1. Dados Coletados:</strong> Nome da
            empresa, loja/sala, solicitante, contato, datas e horários de
            serviço, descrição dos serviços, e dados dos prestadores (nome
            completo, RG/CPF e função).
          </p>
          <p className="mb-3">
            <strong className="text-white">2. Base Legal:</strong> Execução de
            contrato e cumprimento de obrigação legal (controle de acesso e
            segurança do condomínio).
          </p>
          <p className="mb-3">
            <strong className="text-white">3. Compartilhamento:</strong> Os
            dados poderão ser compartilhados apenas com empresas terceirizadas
            que prestam serviços de segurança e administração do condomínio,
            sempre preservando sua privacidade.
          </p>
          <p className="mb-3">
            <strong className="text-white">4. Segurança:</strong> Utilizamos
            medidas técnicas e administrativas para proteger seus dados contra
            acesso não autorizado, perda ou destruição.
          </p>
          <p>
            <strong className="text-white">5. Contato DPO:</strong> Para exercer
            seus direitos ou esclarecer dúvidas, entre em contato através do
            e-mail:{" "}
            <a
              href="mailto:lgpd@salvadortradecenter.com.br"
              className="text-blue-500 underline hover:text-blue-400"
            >
              lgpd@salvadortradecenter.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
