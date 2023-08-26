import { ButtonHTMLAttributes, FC } from "react";
import { VariantProps, cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const buttonVariants = cva(
  "active:scale-95 inline flex items-center justify-center rounded-md text-sm font-medium transition-color focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white hover:bg-slate-800",
        ghost: "bg-transparent hover:text-slate-900 hover:bg-slate-200",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-2",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button: FC<ButtonProps> = ({
  isLoading,
  className,
  children,
  variant,
  size,
  ...rest
}) => {
  return (
    <button
      className={cn(buttonVariants({ className, size, variant }))}
      disabled={isLoading}
      {...rest}
    >
      {isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
      {children}
    </button>
  );
};

export default Button;
