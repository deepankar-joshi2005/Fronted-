import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidPhoneNumber, getPhoneNumberError } from "@/utils/validation";

interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export function PhoneInput({
  label,
  value,
  onChange,
  required = false,
  placeholder = "e.g., 9876543210 or +919876543210",
  id = "phoneNumber",
  name = "phoneNumber",
  disabled = false
}: PhoneInputProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorMsg = getPhoneNumberError(value);
    setError(errorMsg);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && "*"}
      </Label>
      <Input
        id={id}
        name={name}
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={error ? "border-red-500" : ""}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {!error && value && isValidPhoneNumber(value) && (
        <p className="text-xs text-green-600">✓ Valid phone number</p>
      )}
    </div>
  );
}

