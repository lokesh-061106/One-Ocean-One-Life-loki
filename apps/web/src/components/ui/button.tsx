import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-ocean-blue text-white hover:bg-ocean-blue/90 shadow-sm",
        destructive: "bg-ocean-danger text-white hover:bg-ocean-danger/90 shadow-sm",
        outline: "border border-ocean-border bg-white hover:bg-ocean-light hover:text-ocean-blue",
        secondary: "bg-ocean-light text-ocean-blue hover:bg-ocean-light/80",
        ghost: "hover:bg-ocean-light hover:text-ocean-blue",
        link: "text-ocean-blue underline-offset-4 hover:underline",
        success: "bg-ocean-green text-white hover:bg-ocean-green/90 shadow-sm",
        warning: "bg-ocean-warning text-white hover:bg-ocean-warning/90 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        suppressHydrationWarning
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
