import React from "react";
import LoginForm from "./LoginForm";

interface LoginBoxProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  error: string;
  handleSubmit: (e: React.FormEvent) => void;
}

const APP_PREFIX = import.meta.env.VITE_APP_PREFIX || "";

export default function LoginBox(props: LoginBoxProps) {
  return (
    <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center">
      <img
        src={`/lab/CA_logo_trans.png`}
        alt="LAB-Control Logo"
        className="h-20 w-auto mb-6"
      />
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
        Log In
      </h1>
      <LoginForm {...props} />
      <div className="mt-6 text-center w-full">
        <a href="#" className="text-blue-700 hover:underline text-sm">
          Forgot your password?
        </a>
      </div>
    </div>
  );
}
