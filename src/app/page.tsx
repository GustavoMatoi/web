"use client";
import React from "react";
import LoginForm, { FormData } from "../../components/clientComponents/LoginForm";

function App(){
  const handleFormSubmit = (data: FormData) => {
    alert(`Email: ${data.email}\n Senha: ${data.senha}`);
  };

return (
  <div
    className="h-screen flex items-center justify-end p-2
               bg-[url('/bg.png')] bg-no-repeat bg-[#131D27] bg-left"
  >
    <div className="w-full max-w-md h-screen flex items-center">
      <LoginForm onSubmitForm={handleFormSubmit} />
    </div>
  </div>
);

};

export default App;
