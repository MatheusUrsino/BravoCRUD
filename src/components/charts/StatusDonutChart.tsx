"use client"

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { FiPieChart } from "react-icons/fi";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface StatusDonutChartProps {
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

export function StatusDonutChart({ stats, theme, showDataLabels }: StatusDonutChartProps) {
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
      type: 'donut',
      background: currentTheme.background,
      foreColor: currentTheme.textColor,
      toolbar: { show: false }
    },
    labels: STATUS_LABELS.map(s => s.label),
    colors: STATUS_LABELS.map(s => s.color),
    legend: {
      position: 'bottom',
      labels: {
        colors: currentTheme.textColor
      }
    },
    dataLabels: {
      enabled: showDataLabels,
      style: {
        colors: [currentTheme.background]
      },
      dropShadow: {
        enabled: false
      }
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              color: currentTheme.textColor,
              formatter: () => stats.total.toString()
            }
          }
        }
      }
    },
    tooltip: {
      theme: theme,
      y: {
        formatter: (value) => `${value} (${stats.total ? Math.round((value / stats.total) * 100) : 0}%)`
      }
    }
  };

  const series = [
    stats.concluido,
    stats.erro_login,
    stats.erro_sistema,
    stats.modulo_nao_habilitado,
    stats.sem_acesso,
    stats.pendencia,
    stats.sem_movimento
  ];

return (
    <div className="h-full">
      <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
        <FiPieChart /> Distribuição dos Status
      </h2>
      {typeof window !== 'undefined' && (
        <Chart
          options={options}
          series={series}
          type="donut"
          height={340}
        />
      )}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {STATUS_LABELS.map((s, idx) => (
          <span key={s.key} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: s.color + "22", color: s.color }}>
            <span className="font-medium">{s.label}</span>
            <span className={theme === "dark" ? "ml-1 text-gray-300" : "ml-1 text-gray-500"}>{series[idx]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}