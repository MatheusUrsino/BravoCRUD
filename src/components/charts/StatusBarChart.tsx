"use client"

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { FiBarChart2 } from "react-icons/fi";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface StatusBarChartProps {
  stats: {
    total: number;
    concluido: number;
    erro_login: number;
    erro_sistema: number;
    modulo_nao_habilitado: number;
    sem_acesso: number;
    pendencia: number;
    sem_movimento: number;
  };
  theme: "light" | "dark";
  showDataLabels: boolean;
}

const STATUS_LABELS = [
  { key: "concluido", label: "Concluído", color: "#32CD32" },
  { key: "erro_login", label: "Erro de login", color: "#FF4500" },
  { key: "erro_sistema", label: "Erro de sistema", color: "#FFD600" },
  { key: "modulo_nao_habilitado", label: "Módulo não habilitado", color: "#6366F1" },
  { key: "sem_acesso", label: "Sem acesso", color: "#3B82F6" },
  { key: "pendencia", label: "Pendência", color: "#FF0000" },
  { key: "sem_movimento", label: "Sem movimento", color: "#778899" },
];

export function StatusBarChart({ stats, theme, showDataLabels }: StatusBarChartProps) {
  const chartThemeConfig = {
    light: {
      textColor: '#374151',
      background: '#ffffff',
      gridColor: '#e5e7eb',
      axisColor: '#6b7280'
    },
    dark: {
      textColor: '#f3f4f6',
      background: '#1f2937',
      gridColor: '#4b5563',
      axisColor: '#9ca3af'
    }
  };

  const currentTheme = chartThemeConfig[theme];

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      background: currentTheme.background,
      foreColor: currentTheme.textColor,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: '60%',
        distributed: true,
      }
    },
    colors: STATUS_LABELS.map(s => s.color),
    dataLabels: {
      enabled: showDataLabels,
      style: {
        colors: [currentTheme.textColor]
      }
    },
    xaxis: {
      categories: STATUS_LABELS.map(s => s.label),
      labels: {
        style: { colors: currentTheme.textColor }
      },
      title: { text: "Quantidade", style: { color: currentTheme.textColor } }
    },
    yaxis: {
      labels: { style: { colors: currentTheme.textColor } }
    },
    grid: {
      borderColor: currentTheme.gridColor,
      strokeDashArray: 4
    },
    tooltip: {
      theme: theme,
      y: {
        formatter: (value) => `${value} registro${value === 1 ? "" : "s"}`
      }
    }
  };

  const series = [{ data: [
    stats.concluido,
    stats.erro_login,
    stats.erro_sistema,
    stats.modulo_nao_habilitado,
    stats.sem_acesso,
    stats.pendencia,
    stats.sem_movimento
  ] }];

  return (
    <div className="h-full">
      <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
        <FiBarChart2 /> Status por Quantidade
      </h2>
      {typeof window !== 'undefined' && (
        <Chart
          options={options}
          series={series}
          type="bar"
          height={340}
        />
      )}
    </div>
  );
}