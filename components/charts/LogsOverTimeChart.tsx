'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LogsOverTimeChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
}

export default function LogsOverTimeChart({ data }: LogsOverTimeChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            }
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) =>
              new Date(value).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            }
            formatter={(value: number) => [value, 'Logs']}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#114FB3"
            strokeWidth={2}
            dot={{ fill: '#114FB3', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#114FB3', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

