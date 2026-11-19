"use client";

import { useEffect, useRef } from "react";
import { X, Clock, AlertTriangle } from "lucide-react";

interface ModalHorariosProps {
  isOpen: boolean;
  onClose: () => void;
}

const HORARIOS = [
  { dia: "Segunda a Sexta", horario: "A partir das 22h", livre: false },
  { dia: "Sábados", horario: "A partir das 19h", livre: false },
  { dia: "Domingos e Feriados", horario: "Horário livre", livre: true },
];

export function ModalHorarios({ isOpen, onClose }: ModalHorariosProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      // Mantém o foco dentro do diálogo
      if (e.key === "Tab") {
        const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (!modalRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="horarios-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative my-auto w-full max-w-[600px] bg-[#1c2532] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#2a364a] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Accent Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-error-500 to-error-400" />

        {/* Botão Fechar */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-gray-300 hover:text-white bg-[#232e42]/60 hover:bg-[#2e3b52] active:bg-[#364560] p-2.5 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          aria-label="Fechar horários para execução de serviços"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Cabeçalho */}
        <div className="px-5 sm:px-7 pt-6 sm:pt-7 pb-4 sm:pb-5 pr-16 sm:pr-20 flex items-center gap-4">
          <div className="flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Clock size={28} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id="horarios-titulo"
              className="text-xl sm:text-[22px] leading-tight font-bold text-white tracking-tight"
            >
              Horários para Execução de Serviços
            </h2>
            <p className="text-[#a4b4cb] text-sm mt-1 font-medium">
              Condomínio Salvador Trade Center
            </p>
          </div>
        </div>

        {/* Corpo (Lista de Horários) */}
        <ul className="px-5 sm:px-7 py-3 flex flex-col gap-3">
          {HORARIOS.map(({ dia, horario, livre }) => (
            <li
              key={dia}
              className="relative overflow-hidden flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 bg-[#161d27] border border-[#232e42] rounded-xl py-3.5 pl-6 pr-4 sm:p-5 sm:pl-7 shadow-sm"
            >
              <span
                aria-hidden="true"
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  livre ? "bg-success-500" : "bg-amber-500"
                }`}
              />
              <span className="text-[#b4c2d6] font-medium text-sm sm:text-base">
                {dia}
              </span>
              <span
                className={`font-bold text-base sm:text-lg tabular-nums ${
                  livre ? "text-success-500" : "text-white"
                }`}
              >
                {horario}
              </span>
            </li>
          ))}
        </ul>

        {/* Alerta */}
        <div className="px-5 sm:px-7 pt-3 pb-6 sm:pb-8 mt-1 flex items-start sm:items-center sm:justify-center gap-3 sm:text-center">
          <AlertTriangle
            size={20}
            className="text-amber-500 shrink-0 mt-0.5 sm:mt-0"
            aria-hidden="true"
          />
          <p className="text-amber-400 text-sm sm:text-[15px] font-medium">
            Acessos fora dos horários estipulados não serão autorizados.
          </p>
        </div>
      </div>
    </div>
  );
}
