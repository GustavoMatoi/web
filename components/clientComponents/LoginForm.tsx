"use client";
import React, { useState, useEffect } from "react";
export interface FormData {
  email: string;
  senha: string;
}

interface LoginFormProps {
  onSubmitForm: (data: FormData) => void;
}

function LoginForm({ onSubmitForm }: LoginFormProps) {
  const [formValues, setFormValues] = useState<FormData>({
    email: "",
    senha: "",
  });

  const [mensagem, setMensagem] = useState<string>("");

  useEffect(() => {
    setMensagem("Preencha o formulário para enviar seus dados.");
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitForm(formValues);
    setMensagem("Formulário enviado com sucesso!");
  };

  return (
    <div className="bg-[#131D27] shadow-lg rounded-lg p-5 h-8/12 ">
      <h3 className="text-4xl font-semibold mb-4 mt-5">
        Faça login para continuar
      </h3>
      {mensagem && <p className="text-gray-600 mb-3">{mensagem}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 mt-10">
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formValues.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1 mt-5">Senha</label>
          <input
            type="password"
            name="senha"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formValues.senha}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full mt-5 bg-[#FDF2DD] hover:bg-[#FDF2DD] text-[#131D27] font-medium py-2 rounded-lg transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
