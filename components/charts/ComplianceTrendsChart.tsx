'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ComplianceTrendsChartProps {
  data: Array<{
    week: string;
    complianceRate: number;
    totalLogs: number;
  }>;
}

export default function ComplianceTrendsChart({
  data,
}: ComplianceTrendsChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `Week ${value}`}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            labelFormatter={(value) => `Week ${value}`}
            formatter={(value: number, name: string) => [
              `${value}%`,
              name === 'complianceRate' ? 'Compliance Rate' : 'Total Logs',
            ]}
          />
          <Bar dataKey="complianceRate" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

