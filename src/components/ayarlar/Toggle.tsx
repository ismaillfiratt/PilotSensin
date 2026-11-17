"use client";

import { motion } from "framer-motion";

interface Props {
  checked:  boolean;
  onChange: () => void;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, disabled = false }: Props) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className="relative shrink-0 rounded-full transition-colors"
      style={{
        width:           40,
        height:          22,
        backgroundColor: checked
          ? disabled ? "#4a5568" : "var(--leaf)"
          : "rgba(0,0,0,0.12)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ width: 18, height: 18, top: 2 }}
        className="absolute rounded-full bg-white shadow-sm"
      />
    </button>
  );
}
