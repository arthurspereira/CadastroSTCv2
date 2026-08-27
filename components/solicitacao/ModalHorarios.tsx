"use client";

import { useEffect, useRef } from "react";
import { X, Clock, AlertTriangle } from "lucide-react";

interface ModalHorariosProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModalHorarios({ isOpen, onClose }: ModalHorariosProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="horarios-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[600px] bg-[#1c2532] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#2a364a] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Accent Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-error-500 to-error-400" />

        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors bg-[#232e42]/50 hover:bg-[#2e3b52] p-2 rounded-xl"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho */}
        <div className="px-7 pt-7 pb-5 flex items-center gap-4">
          <div className="flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0 w-14 h-14 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Clock size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2
              id="horarios-titulo"
              className="text-[22px] leading-tight font-bold text-white tracking-wide"
            >
              Horários para Execução de Serviços
            </h2>
            <p className="text-[#8b9bb4] text-sm mt-1 font-medium">
              Condomínio Salvador Trade Center
            </p>
          </div>
        </div>

        {/* Corpo (Lista de Horários) */}
        <div className="px-7 py-3 flex flex-col gap-3.5">
          {/* Segunda a Sexta */}
          <div className="flex items-center justify-between bg-[#161d27] border border-[#232e42] rounded-xl p-4 md:p-5 relative overflow-hidden shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
            <span className="text-[#a4b4cb] font-medium text-base pl-2">
              Segunda a Sexta
            </span>
            <span className="text-white font-bold tracking-wide text-base">
              A partir das 22h
            </span>
          </div>

          {/* Sábados */}
          <div className="flex items-center justify-between bg-[#161d27] border border-[#232e42] rounded-xl p-4 md:p-5 relative overflow-hidden shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
            <span className="text-[#a4b4cb] font-medium text-base pl-2">
              Sábados
            </span>
            <span className="text-white font-bold tracking-wide text-base">
              A partir das 19h
            </span>
          </div>

          {/* Domingos e Feriados */}
          <div className="flex items-center justify-between bg-[#161d27] border border-[#232e42] rounded-xl p-4 md:p-5 relative overflow-hidden shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-success-500" />
            <span className="text-[#a4b4cb] font-medium text-base pl-2">
              Domingos e Feriados
            </span>
            <span className="text-success-500 font-bold tracking-wide text-base">
              Horário livre
            </span>
          </div>
        </div>

        {/* Alerta e Footer */}
        <div className="px-7 pt-3 pb-8 mt-1 flex items-center justify-center gap-3 text-center">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <p className="text-amber-500/90 text-[15px] font-medium">
            Acessos fora dos horários estipulados não serão autorizados.
          </p>
        </div>
      </div>
    </div>
  );
}
