
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AnalyticsData } from '../types';

interface AnalyticsViewProps {
  data: AnalyticsData;
}

const COLORS = ['#10b981', '#64748b', '#ef4444'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ data }) => {
  return (
    <div className="p-6 h-full overflow-y-auto bg-white space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Nova Performance Insights</h2>
          <p className="text-slate-500 text-sm">Real-time engagement metrics and sentiment analysis</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 border border-slate-100 rounded-2xl bg-indigo-50/50 flex flex-col items-center">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Messages</span>
          <span className="text-4xl font-black text-indigo-600">{data.totalMessages}</span>
        </div>
        <div className="p-5 border border-slate-100 rounded-2xl bg-teal-50/50 flex flex-col items-center">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Avg. Response Time</span>
          <span className="text-4xl font-black text-teal-600">{data.avgResponseTime}ms</span>
        </div>
        <div className="p-5 border border-slate-100 rounded-2xl bg-amber-50/50 flex flex-col items-center">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">User Satisfaction</span>
          <span className="text-4xl font-black text-amber-600">88%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 border border-slate-100 rounded-2xl shadow-sm bg-slate-50/30">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Sentiment Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.sentimentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.sentimentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {data.sentimentDistribution.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs font-medium text-slate-600">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border border-slate-100 rounded-2xl shadow-sm bg-slate-50/30">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Message Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.messageVolume}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
