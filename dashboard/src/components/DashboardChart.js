import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DashboardChart = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Applications per Day (Last 7 Days)',
      },
    },
  };

  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  }).reverse();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Applications',
        data: labels.map(label => {
          const dayData = data.find(d => d.date === label);
          return dayData ? dayData.count : 0;
        }),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  return <Bar options={options} data={chartData} />;
};

export default DashboardChart;
