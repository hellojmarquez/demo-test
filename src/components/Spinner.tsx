// /components/Spinner.tsx

import React from "react";

type SpinnerProps = {
  size?: number; // Size of the spinner (height and width in pixels)
  color?: string; // Color of the spinner (Tailwind color or custom hex)
  thickness?: number; // Thickness of the spinner border (in pixels)
  opacity?: number; // Opacity of the spinner (0 to 100, for customization)
};

const Spinner: React.FC<SpinnerProps> = ({
  size = 40, // Default size
  color = "blue-500", // Default color
  thickness = 4, // Default border thickness
  opacity = 70, // Default opacity
}) => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      {/* Spinner */}
      <div
        className={`animate-spin rounded-full border-t-${thickness} border-${color} border-opacity-${opacity}`}
        style={{
          width: size,
          height: size,
          borderWidth: thickness,
        }}
      ></div>
    </div>
  );
};

export default Spinner;
