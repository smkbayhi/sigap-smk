"use client";

import React from "react";
import { useAppData } from "@/context/AppDataContext";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppData();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => {
        let bgStyle = "bg-white border-l-4 border-brand-600 text-gray-800";
        let icon = <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0" />;

        if (toast.type === "error") {
          bgStyle = "bg-white border-l-4 border-rose-600 text-gray-800";
          icon = <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
        } else if (toast.type === "warning") {
          bgStyle = "bg-white border-l-4 border-amber-500 text-gray-800";
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
        } else if (toast.type === "info") {
          bgStyle = "bg-white border-l-4 border-sky-600 text-gray-800";
          icon = <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto shadow-xl rounded-lg p-4 flex items-start justify-between gap-3 transition-all duration-300 transform translate-y-0 opacity-100 ${bgStyle} border border-gray-100`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              {icon}
              <div>
                <h4 className="font-semibold text-sm leading-tight text-gray-900">{toast.title}</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
