import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ title, data, labels, dataKey }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
  };

  const chartData = {
    labels: data.map(item => item[labels]),
    datasets: [
      {
        label: title,
        data: data.map(item => item[dataKey]),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
    ],
  };

  return <Bar options={options} data={chartData} />;
};

export default BarChart;
