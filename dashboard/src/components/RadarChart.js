import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const RadarChart = ({ skillsData, className = '' }) => {
  // Process skills data to extract labels and values
  const skills = skillsData || [];
  const labels = skills.map(skill => skill.name || skill.skill || skill);
  const userSkills = skills.map(skill => skill.userLevel || skill.user_level || 0);
  const jobRequirements = skills.map(skill => skill.jobRequirement || skill.job_requirement || 0);
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Your Skills',
        data: userSkills,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(139, 92, 246, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Job Requirements',
        data: jobRequirements,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(16, 185, 129, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          color: 'rgb(107, 114, 128)',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.r}/10`;
          }
        }
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 10,
        min: 0,
        ticks: {
          stepSize: 2,
          color: 'rgb(156, 163, 175)',
          font: {
            size: 10,
            family: 'Inter, sans-serif',
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.3)',
          lineWidth: 1,
        },
        angleLines: {
          color: 'rgba(156, 163, 175, 0.3)',
          lineWidth: 1,
        },
        pointLabels: {
          color: 'rgb(75, 85, 99)',
          font: {
            size: 11,
            family: 'Inter, sans-serif',
            weight: '500',
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'point',
    },
  };

  // Dark mode adjustments
  if (document.documentElement.classList.contains('dark')) {
    options.plugins.legend.labels.color = 'rgb(209, 213, 219)';
    options.scales.r.ticks.color = 'rgb(156, 163, 175)';
    options.scales.r.grid.color = 'rgba(156, 163, 175, 0.2)';
    options.scales.r.angleLines.color = 'rgba(156, 163, 175, 0.2)';
    options.scales.r.pointLabels.color = 'rgb(209, 213, 219)';
  }

  if (skills.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">No Skills Data</h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Skills analysis will appear here after job matching
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Radar data={data} options={options} />
    </div>
  );
};

export default RadarChart;