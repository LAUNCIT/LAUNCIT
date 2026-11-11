import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Award,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from 'lucide-react';
import { Appointment } from '../types';
import { formatCOP } from '../utils/scheduleUtils';

interface DailyRevenueTrendChartProps {
  appointments: Appointment[];
  monthlyGoal?: number;
}

type ChartMetricView = 'daily' | 'cumulative' | 'comparison';

interface TooltipPayloadItem {
  value: number;
  name: string;
  dataKey: string;
  color: string;
  payload: {
    day: number;
    dateLabel: string;
    dayName: string;
    dailyRevenue: number;
    cumulativeRevenue: number;
    dailyTarget: number;
    appointmentCount: number;
    isPeak?: boolean;
    isToday?: boolean;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const diffVsTarget = data.dailyRevenue - data.dailyTarget;
  const isAboveTarget = diffVsTarget >= 0;

  return (
    <div className="p-3.5 rounded-2xl bg-obsidian-900/95 backdrop-blur-md border border-sand-200/20 dark:border-obsidian-750 shadow-2xl space-y-2 min-w-[210px] text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-champagne-400" />
          <span className="font-extrabold text-white">
            {data.dayName}, {data.dateLabel}
          </span>
        </div>
        {data.isToday && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Hoy
          </span>
        )}
        {data.isPeak && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
            <Award className="w-2.5 h-2.5" /> Pico
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Ingresos del Día:</span>
          <span className="font-mono font-black text-champagne-300 text-sm">
            {formatCOP(data.dailyRevenue)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Citas Confirmadas:</span>
          <span className="font-mono font-bold text-white">
            {data.appointmentCount} {data.appointmentCount === 1 ? 'cita' : 'citas'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Acumulado Mes:</span>
          <span className="font-mono font-bold text-slate-300">
            {formatCOP(data.cumulativeRevenue)}
          </span>
        </div>

        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Vs Meta Diaria:</span>
          <span
            className={`font-mono font-bold flex items-center gap-0.5 ${
              isAboveTarget ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {isAboveTarget ? (
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-slate-400" />
            )}
            {formatCOP(Math.abs(diffVsTarget))}
          </span>
        </div>
      </div>
    </div>
  );
};

export const DailyRevenueTrendChart: React.FC<DailyRevenueTrendChartProps> = ({
  appointments,
  monthlyGoal = 1000000,
}) => {
  const [metricView, setMetricView] = useState<ChartMetricView>('daily');
  const [showTargetLine, setShowTargetLine] = useState(true);

  // Parse day number from appointment dateKey (e.g. "Dom, 01 Nov" -> 1, "Mar, 10 Nov" -> 10)
  const chartData = useMemo(() => {
    const daysInMonth = 30; // Noviembre tiene 30 días
    const dailyTarget = Math.round(monthlyGoal / daysInMonth);

    // Initialize all 30 days
    const daysMap = new Map<
      number,
      {
        day: number;
        dateLabel: string;
        dayName: string;
        dailyRevenue: number;
        appointmentCount: number;
      }
    >();

    // Day names for November 2026 (Nov 1 is Sunday)
    const dayNames = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    for (let d = 1; d <= daysInMonth; d++) {
      const paddedDay = d < 10 ? `0${d}` : `${d}`;
      // In Nov 2026: Nov 1 is Sunday (index 0)
      const dayOfWeekIndex = (d - 1) % 7;
      daysMap.set(d, {
        day: d,
        dateLabel: `${paddedDay} Nov`,
        dayName: dayNames[dayOfWeekIndex],
        dailyRevenue: 0,
        appointmentCount: 0,
      });
    }

    // Accumulate confirmed appointments
    const confirmed = appointments.filter((a) => a.status === 'Confirmada');

    confirmed.forEach((apt) => {
      if (!apt.dateKey || typeof apt.dateKey !== 'string') return;
      // Extract numeric day from dateKey (e.g. "Dom, 01 Nov" or "Mar, 10 Nov")
      const match = apt.dateKey.match(/\b0?([1-9]|[12][0-9]|3[01])\b/);
      if (match) {
        const dayNum = parseInt(match[1], 10);
        if (dayNum >= 1 && dayNum <= daysInMonth) {
          const entry = daysMap.get(dayNum);
          if (entry) {
            entry.dailyRevenue += Number(apt.price) || 0;
            entry.appointmentCount += 1;
          }
        }
      }
    });

    // Compute cumulative sum and mark peaks
    let runningCumulative = 0;
    let peakRevenue = 0;

    daysMap.forEach((entry) => {
      if (entry.dailyRevenue > peakRevenue) {
        peakRevenue = entry.dailyRevenue;
      }
    });

    const result = Array.from(daysMap.values()).map((entry) => {
      runningCumulative += entry.dailyRevenue;
      return {
        ...entry,
        cumulativeRevenue: runningCumulative,
        dailyTarget,
        isPeak: entry.dailyRevenue > 0 && entry.dailyRevenue === peakRevenue,
        isToday: entry.day === 9, // Nov 9 is today in the environment
      };
    });

    return result;
  }, [appointments, monthlyGoal]);

  // Overall comparison statistics
  const stats = useMemo(() => {
    const confirmed = appointments.filter((a) => a.status === 'Confirmada');
    const totalRevenue = confirmed.reduce(
      (sum, a) => sum + (Number(a.price) || 0),
      0
    );

    let peakDay = chartData[0];
    let daysWithSales = 0;

    chartData.forEach((d) => {
      if (d.dailyRevenue > (peakDay?.dailyRevenue || 0)) {
        peakDay = d;
      }
      if (d.dailyRevenue > 0) {
        daysWithSales += 1;
      }
    });

    const avgDailyRevenue =
      daysWithSales > 0 ? Math.round(totalRevenue / daysWithSales) : 0;
    const dailyTarget = Math.round(monthlyGoal / 30);

    return {
      totalRevenue,
      peakDay,
      daysWithSales,
      avgDailyRevenue,
      dailyTarget,
      confirmedCount: confirmed.length,
    };
  }, [appointments, chartData, monthlyGoal]);

  const formatYAxis = (value: number) => {
    if (value === 0) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${Math.round(value / 1000)}k`;
    return `$${value}`;
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-5 shadow-subtle">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-sand-200 dark:border-obsidian-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-champagne-500/15 border border-champagne-500/30 flex items-center justify-center text-champagne-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Tendencia Diaria de Ingresos · Noviembre 2026
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-champagne-500/15 text-champagne-400 border border-champagne-500/30">
                  Recharts Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparativa visual del desempeño diario y ritmo acumulado a partir de citas confirmadas
              </p>
            </div>
          </div>
        </div>

        {/* View Switchers & Target Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Segmented Control */}
          <div className="p-1 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMetricView('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                metricView === 'daily'
                  ? 'bg-slate-900 dark:bg-champagne-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Ingresos Diarios</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricView('cumulative')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                metricView === 'cumulative'
                  ? 'bg-slate-900 dark:bg-champagne-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Acumulado</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricView('comparison')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                metricView === 'comparison'
                  ? 'bg-slate-900 dark:bg-champagne-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Diario vs Meta</span>
            </button>
          </div>

          {/* Toggle Target Line */}
          <button
            type="button"
            onClick={() => setShowTargetLine(!showTargetLine)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showTargetLine
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-sand-100 dark:bg-obsidian-850 border-sand-200 dark:border-obsidian-750 text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showTargetLine ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            <span>Meta Diaria ({formatCOP(stats.dailyTarget)})</span>
          </button>
        </div>
      </div>

      {/* Mini Performance Comparison Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Award className="w-3 h-3 text-champagne-400" /> Pico Máximo Diario
          </span>
          <p className="text-sm sm:text-base font-black font-mono text-champagne-400 tabular-nums">
            {formatCOP(stats.peakDay?.dailyRevenue || 0)}
          </p>
          <span className="text-[10px] text-slate-400 block truncate">
            {stats.peakDay ? `${stats.peakDay.dayName}, ${stats.peakDay.dateLabel}` : 'Sin datos'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Promedio Día Activo
          </span>
          <p className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white tabular-nums">
            {formatCOP(stats.avgDailyRevenue)}
          </p>
          <span className="text-[10px] text-slate-400 block">
            {stats.daysWithSales} de 30 días con citas
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Meta Diaria Benchmark
          </span>
          <p className="text-sm sm:text-base font-black font-mono text-amber-300 tabular-nums">
            {formatCOP(stats.dailyTarget)}
          </p>
          <span className="text-[10px] text-slate-400 block">
            Base mensual {formatCOP(monthlyGoal)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-400" /> Total Acumulado Mes
          </span>
          <p className="text-sm sm:text-base font-black font-mono text-emerald-400 tabular-nums">
            {formatCOP(stats.totalRevenue)}
          </p>
          <span className="text-[10px] text-slate-400 block">
            {stats.confirmedCount} citas confirmadas
          </span>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="w-full h-[320px] sm:h-[350px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
          >
            <defs>
              {/* Luxury Champagne Gold Linear Gradient */}
              <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.35} />
                <stop offset="60%" stopColor="#D4AF37" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.0} />
              </linearGradient>

              {/* Emerald Green Linear Gradient for Cumulative */}
              <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="60%" stopColor="#10B981" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.2}
              vertical={false}
            />

            <XAxis
              dataKey="dateLabel"
              tickLine={false}
              axisLine={{ stroke: '#334155', opacity: 0.3 }}
              tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }}
              interval={2}
            />

            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#334155', opacity: 0.3 }}
              tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={formatYAxis}
              domain={[0, 'auto']}
            />

            <Tooltip content={<CustomChartTooltip />} />

            {/* Benchmark Target Reference Line */}
            {showTargetLine && (
              <ReferenceLine
                y={metricView === 'cumulative' ? monthlyGoal : stats.dailyTarget}
                stroke="#10B981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value:
                    metricView === 'cumulative'
                      ? `Meta Mes: ${formatCOP(monthlyGoal)}`
                      : `Meta Diaria: ${formatCOP(stats.dailyTarget)}`,
                  fill: '#10B981',
                  fontSize: 10,
                  position: 'top',
                }}
              />
            )}

            {/* Peak reference line if in daily view */}
            {metricView !== 'cumulative' && stats.peakDay && stats.peakDay.dailyRevenue > 0 && (
              <ReferenceLine
                x={stats.peakDay.dateLabel}
                stroke="#F59E0B"
                strokeDasharray="2 2"
                strokeWidth={1}
                label={{
                  value: 'Pico',
                  fill: '#F59E0B',
                  fontSize: 9,
                  position: 'insideTopLeft',
                }}
              />
            )}

            {/* Mode 1: Daily Revenue */}
            {(metricView === 'daily' || metricView === 'comparison') && (
              <>
                <Area
                  type="monotone"
                  dataKey="dailyRevenue"
                  fill="url(#goldAreaGrad)"
                  stroke="none"
                  isAnimationActive={true}
                  animationDuration={900}
                />
                <Line
                  type="monotone"
                  dataKey="dailyRevenue"
                  name="Ingreso Diario"
                  stroke="#F59E0B"
                  strokeWidth={2.8}
                  dot={{
                    r: 3,
                    fill: '#F59E0B',
                    stroke: '#1E293B',
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#FCD34D',
                    stroke: '#0F172A',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </>
            )}

            {/* Mode 2: Cumulative Revenue */}
            {metricView === 'cumulative' && (
              <>
                <Area
                  type="monotone"
                  dataKey="cumulativeRevenue"
                  fill="url(#emeraldAreaGrad)"
                  stroke="none"
                  isAnimationActive={true}
                  animationDuration={900}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeRevenue"
                  name="Ingreso Acumulado"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{
                    r: 2.5,
                    fill: '#10B981',
                    stroke: '#0F172A',
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#34D399',
                    stroke: '#0F172A',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </>
            )}

            {/* Mode 3: Comparison - Also display cumulative as secondary line */}
            {metricView === 'comparison' && (
              <Line
                type="monotone"
                dataKey="dailyTarget"
                name="Meta Diaria Objetivo"
                stroke="#64748B"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Legend & Insights */}
      <div className="pt-2 border-t border-sand-200 dark:border-obsidian-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-amber-400" />
            <span className="font-semibold text-slate-300">Ingresos Diarios Confirmados (COP)</span>
          </div>
          {showTargetLine && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-emerald-400" />
              <span className="font-semibold text-emerald-400">Objetivo / Meta ({formatCOP(stats.dailyTarget)}/día)</span>
            </div>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <span>Actualizado en tiempo real al registrar citas</span>
        </div>
      </div>
    </div>
  );
};
