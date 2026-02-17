"use client";
import { createContext, useContext, useState, ReactNode } from 'react';

interface UnsavedChangesContextType {
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
  shouldShake: boolean;
  triggerShake: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const triggerShake = () => {
    setShouldShake(true);
    // สั่น 500ms แล้วหยุด (ตรงกับ duration ของ animation ใน globals.css)
    setTimeout(() => setShouldShake(false), 500);
  };

  return (
    <UnsavedChangesContext.Provider value={{ isDirty, setIsDirty, shouldShake, triggerShake }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export const useUnsavedChanges = () => {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    return { isDirty: false, setIsDirty: () => {}, shouldShake: false, triggerShake: () => {} };
  }
  return context;
};