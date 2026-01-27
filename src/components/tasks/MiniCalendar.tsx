import { useMemo } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  taskDates?: Set<string>;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function MiniCalendar({ 
  selectedDate, 
  onDateSelect, 
  currentMonth, 
  onMonthChange,
  taskDates = new Set()
}: MiniCalendarProps) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  return (
    <div className="p-3 bg-card rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentMonth, "MMM yyyy")}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((day, i) => (
          <div 
            key={i} 
            className="text-center text-[10px] font-medium text-muted-foreground h-5 flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const dateKey = format(day, "yyyy-MM-dd");
          const hasTask = taskDates.has(dateKey);
          const dayOfWeek = day.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={cn(
                "h-6 w-6 text-[11px] rounded flex items-center justify-center relative transition-colors",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentMonth && isWeekend && "text-muted-foreground",
                isToday && !isSelected && "bg-primary/10 text-primary font-medium",
                isSelected && "bg-primary text-primary-foreground font-medium",
                !isSelected && "hover:bg-accent"
              )}
            >
              {format(day, "d")}
              {hasTask && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
