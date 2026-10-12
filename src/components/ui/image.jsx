import * as React from "react";

export const Image = React.forwardRef(({ src, alt, className = "", fittingType = "cover", ...props }, ref) => {
  const objectFitClass = fittingType === "fill" ? "object-cover" : "object-contain";
  return (
    <img
      ref={ref}
      src={src}
      alt={alt || ""}
      className={`${objectFitClass} ${className}`}
      {...props}
    />
  );
});

Image.displayName = "Image";
