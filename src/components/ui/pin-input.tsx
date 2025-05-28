
"use client";

import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PinInputProps {
  length?: number;
  onChange: (pin: string) => void;
  value: string; // Controlled component: value comes from form
  name?: string; // For react-hook-form
  onBlur?: () => void; // For react-hook-form
  disabled?: boolean;
  showPin?: boolean; // New prop to toggle visibility
}

export const PinInput: React.FC<PinInputProps> = ({
  length = 6,
  onChange,
  value,
  name,
  onBlur,
  disabled,
  showPin = true, // Default to showing PIN
}) => {
  const [pin, setPin] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  React.useEffect(() => {
    // Sync internal state if controlled value changes from outside
    const valueArray = value.padEnd(length, ' ').split('').slice(0, length).map(char => char === ' ' ? '' : char);
    setPin(valueArray);
  }, [value, length]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const newPin = [...pin];
    let char = element.value.slice(-1); // Get the last character entered

    // Allow only digits
    if (!/^\d*$/.test(char)) {
      char = ''; // Clear if not a digit
    }
    newPin[index] = char;
    setPin(newPin);
    onChange(newPin.join(""));

    // Focus next input if a digit is entered
    if (char && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace") {
      event.preventDefault(); // Prevent default backspace behavior (like navigating back)
      const newPin = [...pin];
      if (newPin[index]) {
        newPin[index] = ""; // Clear current input
      } else if (index > 0 && inputRefs.current[index - 1]) {
        newPin[index - 1] = ""; // Clear previous input if current is already empty
        inputRefs.current[index - 1].focus();
      }
      setPin(newPin);
      onChange(newPin.join(""));
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasteData = event.clipboardData.getData("text").replace(/\s/g, "").slice(0, length);
    if (/^\d+$/.test(pasteData)) {
      const newPin = Array(length).fill('');
      for (let i = 0; i < pasteData.length; i++) {
        newPin[i] = pasteData[i];
      }
      setPin(newPin);
      onChange(newPin.join(""));
      const lastFilledIndex = Math.min(pasteData.length -1, length -1);
       if (inputRefs.current[lastFilledIndex]) {
         inputRefs.current[lastFilledIndex].focus();
       }
    }
  };


  return (
    <div className="flex justify-center space-x-2" onBlur={onBlur} data-testid={name}>
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          type={showPin ? "text" : "password"} // Toggle type based on showPin prop
          inputMode="numeric" // Hint for mobile numeric keyboard
          maxLength={1}
          value={pin[index] || ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target, index)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, index)}
          onFocus={(e) => e.target.select()}
          onPaste={index === 0 ? handlePaste : undefined} // Only allow paste on the first input
          ref={(el) => {
            if (el) inputRefs.current[index] = el;
          }}
          className={cn(
            "w-10 h-10 md:w-12 md:h-12 text-center text-lg md:text-xl font-semibold",
            "focus:ring-2 focus:ring-primary focus:border-primary",
            disabled && "bg-muted cursor-not-allowed"
          )}
          disabled={disabled}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

PinInput.displayName = "PinInput";
