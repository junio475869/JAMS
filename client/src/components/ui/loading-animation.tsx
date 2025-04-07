import { cn } from "@/lib/utils";
import { Brain, Code, Mail, Star } from "lucide-react";

interface LoadingAnimationProps {
  variant?: "brain" | "code" | "email" | "default";
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingAnimation({
  variant = "default",
  size = "md",
  text,
  className,
}: LoadingAnimationProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const getIcon = () => {
    switch (variant) {
      case "brain":
        return <Brain className={cn(sizeClasses[size], "text-primary")} />;
      case "code":
        return <Code className={cn(sizeClasses[size], "text-blue-500")} />;
      case "email":
        return <Mail className={cn(sizeClasses[size], "text-purple-500")} />;
      default:
        return <Star className={cn(sizeClasses[size], "text-amber-500")} />;
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative">
        {getIcon()}
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-75"></span>
        <div className="absolute -inset-2 animate-spin-slow">
          <div className="h-2 w-2 rounded-full bg-primary absolute -top-1 left-1/2 transform -translate-x-1/2"></div>
        </div>
      </div>
      {text && (
        <p className="mt-4 text-sm text-muted-foreground">{text}</p>
      )}
      <div className="mt-3 flex space-x-1">
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
}