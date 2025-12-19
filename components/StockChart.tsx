
import React, { useMemo } from 'react';
import { StockDataPoint } from '../types';

interface StockChartProps {
  data: StockDataPoint[];
  currentPrice: number;
}

const StockChart: React.FC<StockChartProps> = ({ data, currentPrice }) => {
  const width = 600;
  const height = 300;
  const padding = 40;

  const { points, areaPoints } = useMemo(() => {
    if (data.length === 0) return { points: "", areaPoints: "" };
    
    const maxPrice = Math.max(...data.map(d => d.price), 70);
    const minPrice = 0;
    
    const calculatedPoints = data.map((d, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - ((d.price - minPrice) / (maxPrice - minPrice)) * (height - padding * 2);
      return { x, y };
    });

    const pointsStr = calculatedPoints.map(p => `${p.x},${p.y}`).join(" ");
    const areaPointsStr = `${padding},${height-padding} ` + pointsStr + ` ${width-padding},${height-padding}`;
    
    return { points: pointsStr, areaPoints: areaPointsStr };
  }, [data]);

  const isCrash = currentPrice < 20;

  return (
    <div className="w-full bg-black border border-slate-700 rounded-lg p-4 font-mono shadow-inner relative overflow-hidden group">
      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="flex justify-between items-end mb-4 relative z-10">
        <div>
          <h3 className="text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2">
            WCOM (WorldCom, Inc.)
            <span className={`w-2 h-2 rounded-full ${isCrash ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
          </h3>
          <div className={`text-3xl font-bold ${isCrash ? 'text-red-500' : 'text-emerald-500'}`}>
            ${currentPrice.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
            <div className="text-[10px] text-slate-500">MARKET: NASDAQ</div>
            <div className="text-[10px] text-slate-500">VOL: 24.5M</div>
        </div>
      </div>

      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible relative z-10">
        {/* Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#334155" strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="1" />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isCrash ? "#ef4444" : "#10b981"} stopOpacity="0.2" />
            <stop offset="100%" stopColor={isCrash ? "#ef4444" : "#10b981"} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area */}
        <polyline 
            points={areaPoints}
            fill="url(#chartGradient)"
            stroke="none"
        />

        {/* Line */}
        <polyline 
          points={points} 
          fill="none" 
          stroke={isCrash ? "#ef4444" : "#10b981"} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"
        />
        
        {/* Dots */}
        {data.map((d, i) => {
           const maxPrice = Math.max(...data.map(p => p.price), 70);
           const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
           const y = height - padding - ((d.price - 0) / (maxPrice - 0)) * (height - padding * 2);
           return (
             <g key={i} className="group/dot">
                <circle cx={x} cy={y} r="3" fill="#1e293b" stroke={d.price < 20 ? "#ef4444" : "#10b981"} strokeWidth="1.5" />
                {/* Tooltip */}
                <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none">
                    <rect x={x - 30} y={y - 35} width="60" height="24" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <text x={x} y={y - 20} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">${d.price.toFixed(0)}</text>
                </g>
             </g>
           );
        })}
      </svg>
      
      {/* Time Labels */}
      <div className="flex justify-between px-10 mt-2 text-[10px] text-slate-500 font-bold uppercase relative z-10">
        <span>1999</span>
        <span>2000</span>
        <span>2001</span>
        <span>2002</span>
      </div>
    </div>
  );
};

export default StockChart;
