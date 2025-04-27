import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (date: Date | undefined) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  className?: string;
}

export function DatePicker({ 
  value, 
  onChange, 
  open, 
  setOpen,
  className
}: DatePickerProps) {
  const parseDate = (dateString: string) => {
    if (!dateString) return undefined;
    
    // Extrai apenas os componentes de data (ignora o fuso horário)
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day -1);
    
    return isValid(date) ? date : undefined;
  };

  const dateValue = parseDate(value);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Cria uma data local sem considerar o fuso horário
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      onChange(localDate);
    } else { 
      onChange(undefined);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-medium",
            "h-10 px-4 py-3 rounded-lg border border-gray-300",
            "hover:border-blue-500 focus:ring-2 focus:ring-blue-200",
            "transition-all duration-200",
            !dateValue && "text-gray-500",
            className
          )}
        >
          <CalendarIcon className="mr-3 h-5 w-5 text-blue-500" />
          {dateValue ? (
            <span className="text-gray-800">
              {format(dateValue, "PPP", { locale: ptBR })}
            </span>
          ) : (
            <span>Selecione uma data</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 shadow-xl border border-gray-200 rounded-xl" 
        align="start"
        sideOffset={4}
      >
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}