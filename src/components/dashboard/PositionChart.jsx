import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../common';

const data = [
  { date: 'Nov 1', srat: 18, proFormation: 12, bienVieillir: 25 },
  { date: 'Nov 8', srat: 16, proFormation: 11, bienVieillir: 22 },
  { date: 'Nov 15', srat: 15, proFormation: 10, bienVieillir: 20 },
  { date: 'Nov 22', srat: 14, proFormation: 9, bienVieillir: 18 },
  { date: 'Nov 29', srat: 13, proFormation: 8, bienVieillir: 16 },
  { date: 'Dec 6', srat: 12, proFormation: 8, bienVieillir: 15 },
  { date: 'Dec 13', srat: 11, proFormation: 7, bienVieillir: 14 },
  { date: 'Dec 20', srat: 10, proFormation: 7, bienVieillir: 13 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-xl">
        <p className="text-sm text-dark-muted mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-dark-muted">{entry.name}:</span>
            <span className="text-white font-medium">Pos. {entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function PositionChart() {
  return (
    <Card title="Évolution des Positions">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis reversed stroke="#94a3b8" fontSize={12} domain={[1, 30]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="srat"
              name="SRAT"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="proFormation"
              name="Pro Formation"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="bienVieillir"
              name="Bien Vieillir"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
