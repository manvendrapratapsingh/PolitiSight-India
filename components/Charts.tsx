import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { ChartDataPoint } from '../types';

interface ChartProps {
  data: ChartDataPoint[];
  config?: {
    xLabel?: string;
    yLabel?: string;
    title?: string;
  };
}

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-slate-200 font-semibold mb-1">{label}</p>
        <p className="text-cyan-400 font-mono">
          {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export const AnalysisBarChart: React.FC<ChartProps> = ({ data, config }) => {
  return (
    <div className="w-full h-80 my-6 bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
      {config?.title && <h4 className="text-center text-slate-300 mb-4 font-display text-sm uppercase tracking-wider">{config.title}</h4>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
          <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
          <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AnalysisPieChart: React.FC<ChartProps> = ({ data, config }) => {
  return (
    <div className="w-full h-80 my-6 bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
       {config?.title && <h4 className="text-center text-slate-300 mb-4 font-display text-sm uppercase tracking-wider">{config.title}</h4>}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value) => <span className="text-slate-300 ml-2">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AnalysisLineChart: React.FC<ChartProps> = ({ data, config }) => {
  return (
    <div className="w-full h-80 my-6 bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
       {config?.title && <h4 className="text-center text-slate-300 mb-4 font-display text-sm uppercase tracking-wider">{config.title}</h4>}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
          <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="value" stroke="#06B6D4" strokeWidth={3} dot={{fill: '#06B6D4', strokeWidth: 2}} activeDot={{r: 8}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};