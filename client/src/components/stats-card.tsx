import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ label, value, icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn("bg-gray-800 rounded-lg p-5 border border-gray-700", className)}>
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="h-12 w-12 flex items-center justify-center rounded-lg">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4">
          <span className={cn(
            "text-sm flex items-center",
            trend.isPositive ? "text-green-500" : "text-red-500"
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-gray-500 text-sm ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
}

export default StatsCard;
