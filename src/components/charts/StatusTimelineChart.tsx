"use client"

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { FiClock } from "react-icons/fi";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface StatusTimelineChartProps {
  data: {
    period: string;
    [status: string]: any;
  }[];
  theme: "light" | "dark";
  groupBy: "month" | "quarter" | "year";
}

export function StatusTimelineChart({ data, theme, groupBy }: StatusTimelineChartProps) {
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

  // Extrair todos os status únicos
  const allStatus = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'period') allStatus.add(key);
    });
  });

  const statusColors: Record<string, string> = {
    'CONCLUIDO': '#32CD32',
    'ERRO_LOGIN': '#FF4500',
    'ERRO_SISTEMA': '#FFD600',
    'MODULO_NAO_HABILITADO': '#6366F1',
    'SEM_ACESSO': '#3B82F6',
    'PENDENCIA': '#FF0000',
    'SEM_MOVIMENTO': '#778899'
  };

  const series = Array.from(allStatus).map(status => ({
    name: status,
    data: data.map(item => item[status] || 0),
    color: statusColors[status] || '#999999'
  }));

  const options: ApexOptions = {
    chart: {
      type: 'line',
      background: currentTheme.background,
      foreColor: currentTheme.textColor,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      zoom: {
        enabled: true
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: data.map(item => item.period),
      labels: {
        style: {
          colors: currentTheme.textColor
        }
      },
      title: {
        text: groupBy === 'month' ? 'Mês' : groupBy === 'quarter' ? 'Trimestre' : 'Ano',
        style: {
          color: currentTheme.textColor
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: currentTheme.textColor
        }
      },
      title: {
        text: 'Quantidade',
        style: {
          color: currentTheme.textColor
        }
      }
    },
    title: {
      text: 'Evolução dos Status',
      align: 'left',
      style: {
        color: currentTheme.textColor,
        fontSize: '16px'
      }
    },
    legend: {
      position: 'top',
      labels: {
        colors: currentTheme.textColor
      }
    },
    grid: {
      borderColor: currentTheme.gridColor,
      strokeDashArray: 4
    },
    tooltip: {
      theme: theme,
      y: {
        formatter: (val) => `${val} registro${val === 1 ? '' : 's'}`
      }
    }
  };

  return (
    <div className="h-full">
      {typeof window !== 'undefined' && (
        <Chart
          options={options}
          series={series}
          type="line"
          height={400}
        />
      )}
    </div>
  );
}