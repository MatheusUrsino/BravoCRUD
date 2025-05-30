import { FiSearch } from "react-icons/fi";
import { useState } from "react";

interface MembrosSearchProps {
  onSearch: (termo: string) => void;
}

export default function MembrosSearch({ onSearch }: MembrosSearchProps) {
  const [termo, setTermo] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setTermo(value);
    onSearch(value);
  }

  return (
    <div className="mb-8 flex justify-center">
      <div className="relative w-full max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <FiSearch className="text-blue-600 text-lg" />
        </span>
        <input
          type="text"
          placeholder="Buscar membro por nome ou e-mail..."
          value={termo}
          onChange={handleChange}
          className="pl-10 pr-4 py-3 w-full rounded-xl border border-blue-200 shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none bg-white text-blue-900 placeholder-blue-400"
        />
      </div>
    </div>
  );
}