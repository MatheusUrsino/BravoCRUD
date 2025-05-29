"use client"

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { FiTrendingUp } from "react-icons/fi";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface RevenueTreemapChartProps {
  data: {
    x: string;
    y: number;
  }[];
  theme: "light" | "dark";
}

export function RevenueTreemapChart({ data, theme }: RevenueTreemapChartProps) {
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
      type: 'treemap',
      background: currentTheme.background,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      }
    },
    title: {
      text: 'Faturamento por Empresa',
      align: 'center',
      style: {
        color: currentTheme.textColor,
        fontSize: '16px'
      }
    },
    colors: [
      '#3B93A5',
      '#F7B844',
      '#ADD8C7',
      '#EC3C65',
      '#CDD7B6',
      '#C1F666',
      '#D43F97',
      '#1E5D8C',
      '#421243',
      '#7F94B0',
      '#EF6537',
      '#C0ADDB'
    ],
    plotOptions: {
      treemap: {
        distributed: true,
        enableShades: true,
        shadeIntensity: 0.5,
        reverseNegativeShade: true,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 10000,
              color: '#3B93A5'
            },
            {
              from: 10001,
              to: 50000,
              color: '#F7B844'
            },
            {
              from: 50001,
              to: 100000,
              color: '#ADD8C7'
            },
            {
              from: 100001,
              to: 500000,
              color: '#EC3C65'
            },
            {
              from: 500001,
              to: 1000000,
              color: '#CDD7B6'
            }
          ]
        }
      }
    },
    tooltip: {
      theme: theme,
      y: {
        formatter: (val) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: [currentTheme.textColor]
      },
      formatter: (text, op) => {
        const valueLabel = `R$ ${op.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        // Return a single string combining both pieces of information
        return `${text}\n${valueLabel}`;
      },
      offsetY: -4
    }
  };

  const series = [{
    data: data
  }];

  return (
    <div className="h-full">
      {typeof window !== 'undefined' && (
        <Chart
          options={options}
          series={series}
          type="treemap"
          height={500}
        />
      )}
    </div>
  );
}