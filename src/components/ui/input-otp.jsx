import * as React from "react";
import { cn } from "@/lib/utils";

export const InputOTP = React.forwardRef(({ value = "", onChange, maxLength = 6, children, className, ...props }, ref) => {
  const inputRef = React.useRef(null);

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, maxLength);
    if (onChange) onChange(val);
  };

  return (
    <div className={cn("relative flex items-center justify-center gap-2", className)}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="\d*"
        maxLength={maxLength}
        value={value}
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        {...props}
      />
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { otpValue: value, maxLength }) : child
      )}
    </div>
  );
});
InputOTP.displayName = "InputOTP";

export const InputOTPGroup = ({ children, otpValue = "", className }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { otpValue }) : child
      )}
    </div>
  );
};

export const InputOTPSlot = ({ index, otpValue = "", className }) => {
  const char = otpValue[index] || "";
  const isCurrent = otpValue.length === index;

  return (
    <div
      className={cn(
        "relative flex h-12 w-10 items-center justify-center rounded-xl border-2 text-lg font-bold text-slate-800 transition-all bg-white",
        isCurrent ? "border-teal-600 ring-2 ring-teal-600/20" : "border-slate-200",
        char && "border-slate-400 bg-slate-50",
        className
      )}
    >
      {char}
    </div>
  );
};
