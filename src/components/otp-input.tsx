import React, { useRef } from "react";

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (val: string, index: number) => {
    const numericVal = val.replace(/[^0-9]/g, "");
    if (!numericVal) {
      const newValue = [...value];
      newValue[index] = "";
      onChange(newValue);
      return;
    }

    const newValue = [...value];
    newValue[index] = numericVal.substring(numericVal.length - 1);
    onChange(newValue);

    // Auto-focus next input
    if (numericVal && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (pastedData.length > 1) {
      const newValue = Array(6).fill("");
      for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
        newValue[i] = pastedData[i];
      }
      onChange(newValue);
      const focusIndex = Math.min(pastedData.length, 5);
      inputsRef.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2 md:gap-3 py-2">
      {value.map((digit, idx) => (
        <div key={idx} className="relative w-12 h-14 rounded-xl overflow-hidden p-[1.5px] bg-border focus-within:bg-gradient-to-r focus-within:from-[#f472b6] focus-within:to-[#60a5fa] transition-all">
          <input
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(e.target.value, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPaste={handlePaste}
            className="w-full h-full text-center bg-card text-foreground font-sans text-xl font-bold rounded-[10px] focus:outline-none transition-colors disabled:opacity-50"
          />
        </div>
      ))}
    </div>
  );
}
