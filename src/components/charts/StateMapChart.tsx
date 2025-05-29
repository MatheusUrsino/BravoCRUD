import dynamic from "next/dynamic";
import React from "react";

// ApexCharts precisa ser importado dinamicamente no Next.js
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StateData {
  estado: string;
  count: number;
}

interface Props {
  data: StateData[];
  theme?: "light" | "dark";
}

export function StateMapChart({ data, theme = "light" }: Props) {
  const options = {
    chart: {
      type: "bar" as "bar",
      toolbar: { show: false },
      background: "transparent"
    },
    theme: { mode: theme },
    xaxis: {
      categories: data.map(d => d.estado),
      title: { text: "Estado" }
    },
    yaxis: {
      title: { text: "Quantidade de Registros" }
    },
    colors: ["#2563eb"],
    dataLabels: { enabled: true }
  };

  const series = [
    {
      name: "Registros",
      data: data.map(d => d.count)
    }
  ];

  return (
    <ApexChart
      options={options}
      series={series}
      type="bar"
      height={350}
    />
  );
}