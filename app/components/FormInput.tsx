import { forwardRef, useState, InputHTMLAttributes } from "react";

type FormInputProps = {
  name: string;
  placeholder?: string;
  error?: string;
  type?: string;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    { name, placeholder, error, type = "text", className = "", ...props },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(
      !!props.value || !!props.defaultValue,
    );

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    return (
      <div className={`form-input w-full ${className}`}>
        <div className="form-input__wrapper relative w-full">
          <input
            id={name}
            name={name}
            type={type}
            ref={ref}
            className={`form-input__input text-white block w-full px-md pt-[18px] pb-xs text-14 rounded-full outline-none transition-all border ${
              isFocused ? "border-gold" : "border-transparent"
            } ${error ? " border-red text-red bg-red/20" : "bg-brand-dark/20"}
            `}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            onInput={handleChange}
            {...props}
          />

          <label
            htmlFor={name}
            className={`form-input__label text-white absolute left-md transition-all duration-200 pointer-events-none ${
              isFocused || hasValue
                ? "top-4 text-xxs"
                : "top-16 text-sm text-white"
            }
            `}
          >
            {placeholder}
          </label>
        </div>

        {error && (
          <p className="form-input__error mt-1 ml-4 text-xs text-red">
            {error}
          </p>
        )}
      </div>
    );
  },
);
