import React from "react";
import { Link } from "react-router-dom";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50">
      <h1 className="text-6xl font-extrabold text-slate-800 mb-2">404</h1>
      <p className="text-xl font-medium text-slate-700 mb-2">Página não encontrada</p>
      <p className="text-slate-500 max-w-md mb-6">
        O recurso solicitado não existe ou você não possui permissão para acessá-lo.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition"
      >
        Voltar para os Pacientes
      </Link>
    </div>
  );
}
