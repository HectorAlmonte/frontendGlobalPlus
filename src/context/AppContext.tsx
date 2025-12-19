"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import UserType from "@/types/user";

type WordContextType = {
  word: string;
  setWord: (value: string) => void;

  user: UserType | null;
  setUser: (user: UserType | null) => void;

  loadingUser: boolean;
};

const WordContext = createContext<WordContextType | undefined>(undefined);

export function WordProvider({ children }: { children: ReactNode }) {
  const [word, setWord] = useState("");
  const [user, setUser] = useState<UserType | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const stored = localStorage.getItem("user_data");

    if (stored) {
      setUser(JSON.parse(stored));
    }

    setLoadingUser(false);
  }, []);

  // Guardar usuario en localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user_data", JSON.stringify(user));
    } else {
      localStorage.removeItem("user_data");
    }
  }, [user]);

  return (
    <WordContext.Provider 
      value={{        
        word,
        setWord,
        user,
        setUser,
        loadingUser, 
      }}
    >
      {children}
    </WordContext.Provider>
  );
}

export function useWord() {
  const context = useContext(WordContext);

  if (!context) {
    throw new Error("useWord debe usarse dentro de WordProvider");
  }

  return context;
}
