import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { GET_EVENT_STATS_V2 } from '../../checkin/graphql/operations';
import { AttendanceStatsV2 } from '../../tickets/types';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const EventPerformanceAnalyticsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const { data, loading, error } = useQuery<{ getAttendanceStats: AttendanceStatsV2 }>(
    GET_EVENT_STATS_V2,
    { variables: { eventId }, skip: !eventId },
  );

  const stats = data?.getAttendanceStats;

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );

  if (error)
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen text-red-500 font-bold">
        Error loading analytics: {error.message}
      </div>
    );

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="flex-1 bg-background min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-2 text-[0.65rem] font-bold text-primary tracking-[0.05em] uppercase mb-4">
            <span className="w-6 h-[2px] bg-primary"></span>
            Performance Insights
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2">
            Event Analytics
          </h1>
          <p className="text-muted-foreground font-medium">
            Real-time data visualization of attendee engagement and ticket distribution.
          </p>
        </header>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            {
              label: 'Total Registration',
              value: stats?.total || 0,
              icon: 'groups',
              color: 'text-primary',
              bgColor: 'bg-primary/5',
            },
            {
              label: 'Checked In',
              value: stats?.checkedIn || 0,
              icon: 'how_to_reg',
              color: 'text-emerald-500',
              bgColor: 'bg-emerald-500/5',
            },
            {
              label: 'Not Arrived',
              value: stats?.notArrived || 0,
              icon: 'pending',
              color: 'text-orange-500',
              bgColor: 'bg-orange-500/5',
            },
            {
              label: 'Unassigned',
              value: stats?.unassigned || 0,
              icon: 'person_add',
              color: 'text-indigo-500',
              bgColor: 'bg-indigo-500/5',
            },
          ].map((kpi, idx) => (
            <div
              key={idx}
              className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${kpi.bgColor}`}>
                  <span className={`material-symbols-outlined ${kpi.color} text-lg leading-none`}>
                    {kpi.icon}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none">
                  Live
                </span>
              </div>
              <p className="text-3xl font-black text-foreground leading-none mb-2 tabular-nums">
                {kpi.value.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                {kpi.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Traffic Heatmap (Area Chart) */}
          <div className="lg:col-span-2 bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-foreground">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Check-in Traffic
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.checkInTimeline || []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border) / 0.3)"
                  />
                  <XAxis
                    dataKey="bucket"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderRadius: '16px',
                      border: '1px solid hsl(var(--border))',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: '800',
                      color: 'hsl(var(--foreground))',
                    }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tier Distribution (Pie Chart) */}
          <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-foreground">
              <span className="material-symbols-outlined text-indigo-500">confirmation_number</span>
              Ticket Distribution
            </h3>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.byTicketType || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="total"
                    stroke="none"
                  >
                    {(stats?.byTicketType || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length] as string} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderRadius: '12px',
                      border: '1px solid hsl(var(--border))',
                      fontWeight: '700',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-foreground">{stats?.total || 0}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Total
                </span>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              {(stats?.byTicketType || []).map(
                (tier: { name: string; checkedIn: number; total: number }, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shadow-lg shadow-black/5"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      ></div>
                      <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                        {tier.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-foreground">{tier.checkedIn}</span>
                      <span className="text-[10px] font-bold text-muted-foreground/50">
                        / {tier.total}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPerformanceAnalyticsPage;
