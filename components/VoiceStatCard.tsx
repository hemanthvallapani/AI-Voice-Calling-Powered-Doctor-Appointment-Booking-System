import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface VoiceStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description: string;
  className?: string;
}

export const VoiceStatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  className 
}: VoiceStatCardProps) => {
  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm p-6",
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="h-8 w-8">
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
};
