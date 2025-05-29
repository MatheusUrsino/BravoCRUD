"use client"

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { FiBarChart2 } from "react-icons/fi";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface AliquotaHistogramChartProps {
  data: {
    range: string;
    count: number;
  }[];
  theme: "light" | "dark";
}

export function AliquotaHistogramChart({ data, theme }: AliquotaHistogramChartProps) {
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
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '80%',
        distributed: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: ['#3B93A5', '#77B6EA', '#545454', '#FFA500', '#9370DB', '#32CD32'],
    dataLabels: {
      enabled: true,
      style: {
        colors: [currentTheme.textColor]
      }
    },
    xaxis: {
      categories: data.map(item => item.range),
      labels: {
        style: {
          colors: currentTheme.textColor,
          fontSize: '12px'
        },
        rotate: -45,
        rotateAlways: true
      },
      title: {
        text: 'Faixa de Alíquota (%)',
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
      text: 'Distribuição de Alíquotas',
      align: 'center',
      style: {
        color: currentTheme.textColor,
        fontSize: '16px'
      }
    },
    tooltip: {
      theme: theme,
      y: {
        formatter: (val) => `${val} empresa${val === 1 ? '' : 's'}`
      }
    }
  };

  const series = [{
    name: 'Empresas',
    data: data.map(item => item.count)
  }];

  return (
    <div className="h-full">
      {typeof window !== 'undefined' && (
        <Chart
          options={options}
          series={series}
          type="bar"
          height={400}
        />
      )}
    </div>
  );
}