"use client"

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { FiTrendingUp } from "react-icons/fi";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface RevenueChartProps {
  data: {
    labels: string[];
    values: number[];
  };
  theme: "light" | "dark";
  showDataLabels: boolean;
  showTrendLine: boolean;
  averageRevenue?: number;
}

export function RevenueChart({
  data,
  theme,
  showDataLabels,
  showTrendLine,
  averageRevenue
}: RevenueChartProps) {
  const chartThemeConfig = {
    light: { textColor: "#374151", background: "#fff" },
    dark: { textColor: "#f3f4f6", background: "#1f2937" }
  };
  const currentTheme = chartThemeConfig[theme];

  const options: ApexOptions = {
    chart: { type: "bar", background: currentTheme.background, toolbar: { show: false } },
    xaxis: {
      categories: data.labels,
      labels: { style: { colors: currentTheme.textColor } },
      title: { text: "Período" }
    },
    yaxis: {
      labels: {
        style: { colors: currentTheme.textColor },
        formatter: (val: number) =>
          val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      },
      title: { text: "Faturamento (R$)" }
    },
    dataLabels: {
      enabled: showDataLabels,
      formatter: (val: number) =>
        val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      style: { colors: [currentTheme.textColor] }
    },
    colors: ["#2563eb"],
    legend: { show: false },
    title: {
      text: "Faturamento por Período",
      align: "center",
      style: { color: currentTheme.textColor }
    },
    annotations: showTrendLine && averageRevenue
      ? {
          yaxis: [
            {
              y: averageRevenue,
              borderColor: "#f59e42",
              label: {
                borderColor: "#f59e42",
                style: { color: "#fff", background: "#f59e42" },
                text: `Média: ${averageRevenue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })}`
              }
            }
          ]
        }
      : undefined
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
        <FiTrendingUp /> Faturamento por Período
      </h2>
      <Chart
        options={options}
        series={[{ name: "Faturamento", data: data.values }]}
        type="bar"
        height={340}
      />
    </div>
  );
}