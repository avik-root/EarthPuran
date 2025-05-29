
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  // Explicitly include 'value' in the props type to handle it for thumb rendering
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { value?: number | number[] }
>(({ className, value, ...props }, ref) => { // Destructure value to inspect it
  
  // Helper to render thumbs. If 'value' is an array, map over it. Otherwise, render one thumb.
  const renderThumbs = () => {
    if (Array.isArray(value)) {
      return value.map((_, index) => (
        <SliderPrimitive.Thumb
          key={`slider-thumb-${index}`} // Ensure unique key for each thumb
          className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        />
      ));
    }
    // Fallback for single value or if value is undefined (Radix handles undefined value for uncontrolled)
    return (
      <SliderPrimitive.Thumb
        className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      />
    );
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={value} // Pass the original value prop to Root
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {renderThumbs()}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
