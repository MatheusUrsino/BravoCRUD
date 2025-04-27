"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "./button";
import { cn } from "@/utils/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, ...props }: CalendarProps) {
    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);

    const [selectedMonth, setSelectedMonth] = React.useState<number | null>(null);
    const [selectedYear, setSelectedYear] = React.useState<number | null>(null);

    const [currentMonth, setCurrentMonth] = React.useState(props.defaultMonth || new Date());

    return (
        <DayPicker
            locale={ptBR}
            month={currentMonth}
            onMonthChange={(date) => {
                setCurrentMonth(date);
                setSelectedMonth(date.getMonth());
                setSelectedYear(date.getFullYear());
            }}
            showOutsideDays={false}
            className={cn(
                "p-4 bg-white rounded-xl shadow-lg border border-gray-200 w-[320px]",
                className
            )}
            classNames={{
                months: "flex flex-col space-y-4",
                month: "space-y-4",
                caption: "flex justify-center items-center gap-2 ",
                caption_label: "flex items-center gap-2 text-sm font-semibold text-gray-800 " ,
                nav: "flex items-center gap-1 justify-between px-5",
                nav_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-7 w-7 p-0 text-gray-600 hover:text-gray-900 "
                ),
                table: "w-full border-collapse ",
                weekdays: "flex items-center justify-center text-xs font-semibold text-gray-800 flex-row space-x-4",
                head_row: "flex bg-black",
                head_cell: "text-gray-500 w-9 font-medium text-[0.75rem] uppercase",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative",
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100",
                    "relative z-10 text-xs text-gray-500 " // Smaller font and lighter color
                ),
                day_selected: "bg-blue-600 text-white hover:bg-blue-600",
                day_today: "bg-gray-100 text-gray-900 font-semibold",
                day_disabled: "text-gray-300 opacity-50",
                day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                  // @ts-expect-error
                Caption: () => (
                    <div className="flex items-center gap-2">
                        <select
                            className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            value={currentMonth.getMonth()}
                            onChange={(e) => {
                                const newMonth = Number(e.target.value);
                                setSelectedMonth(newMonth);
                                setSelectedYear(currentMonth.getFullYear());
                                setCurrentMonth(new Date(currentMonth.getFullYear(), newMonth));
                            }}
                        >
                            {months.map((month, idx) => (
                                <option key={month} value={idx}>
                                    {month}
                                </option>
                            ))}
                        </select>

                        <select
                            className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            value={currentMonth.getFullYear()}
                            onChange={(e) => {
                                const newYear = Number(e.target.value);
                                setSelectedYear(newYear);
                                setSelectedMonth(currentMonth.getMonth());
                                setCurrentMonth(new Date(newYear, currentMonth.getMonth()));
                            }}
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                )
            }}
            navigation={{
                components: {
                    IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                    IconRight: () => <ChevronRight className="h-4 w-4" />,
                }
            }}
            formatters={{
                formatWeekdayName: (weekday) => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][weekday.getDay()],
            }}
            modifiersStyles={{
                selected: { position: "relative", zIndex: 10 },
            }}
            {...props}
        />
    );
}

Calendar.displayName = "Calendar";

export { Calendar };