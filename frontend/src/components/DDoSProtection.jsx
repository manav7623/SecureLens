import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Shield, Activity, Play, Square, RefreshCcw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function DDoSProtection({ apiBaseUrl, rateLimitEnabled, refreshStats }) {
  const [trafficRate, setTrafficRate] = useState(25); // requests per tick
  const [isFlooding, setIsFlooding] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [allowedCount, setAllowedCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);

  const floodInterval = useRef(null);

  // Initialize chart history
  useEffect(() => {
    const initialData = Array.from({ length: 15 }, (_, i) => ({
      time: `${i}s`,
      allowed: 0,
      blocked: 0
    }));
    setChartData(initialData);

    return () => clearInterval(floodInterval.current);
  }, []);

  const handleStartFlood = () => {
    if (isFlooding) return;
    setIsFlooding(true);
    toast.success('DDoS Simulator: Traffic Flood Started');

    let tick = 0;
    floodInterval.current = setInterval(async () => {
      // Simulate sending rapid-fire HTTP requests
      let allowed = 0;
      let blocked = 0;

      // We make one actual call per tick with flag to register activity, 
      // then we simulate the bulk rate based on trafficRate slider + rateLimit state
      try {
        const payloadCount = rateLimitEnabled ? Math.min(10, trafficRate) : trafficRate;
        const blockedSim = rateLimitEnabled ? Math.max(0, trafficRate - 10) : 0;

        // Perform real request
        const res = await axios.post(`${apiBaseUrl}/security/sqli`, { username: 'manav' });
        if (res.data.success) {
          allowed += payloadCount;
          blocked += blockedSim;
        }
      } catch (err) {
        // If rate limit is active, the real API returns 429
        if (err.response && err.response.status === 429) {
          blocked += trafficRate;
        } else {
          allowed += trafficRate; // fallback if connection issue
        }
      }

      setAllowedCount(prev => prev + allowed);
      setBlockedCount(prev => prev + blocked);

      setChartData(prev => {
        const nextData = [...prev.slice(1)];
        nextData.push({
          time: `${tick++}s`,
          allowed,
          blocked
        });
        return nextData;
      });

      refreshStats();
    }, 1000);
  };

  const handleStopFlood = () => {
    if (!isFlooding) return;
    clearInterval(floodInterval.current);
    setIsFlooding(false);
    toast.error('DDoS Simulator: Flood Stopped');
  };

  const handleResetData = () => {
    handleStopFlood();
    setAllowedCount(0);
    setBlockedCount(0);
    const resetData = Array.from({ length: 15 }, (_, i) => ({
      time: `${i}s`,
      allowed: 0,
      blocked: 0
    }));
    setChartData(resetData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Simulation Controls */}
      <div className="glass rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">DDoS Flood Simulator</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Generate continuous mock packet floods to simulate a Distributed Denial of Service attack. Toggle the **Rate Limiter Shield** to inspect packet filtering.
          </p>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-semibold uppercase text-gray-500 mb-2">
                <span>Traffic Rate</span>
                <span className="text-emerald-400">{trafficRate} Req/Sec</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={trafficRate}
                onChange={(e) => setTrafficRate(parseInt(e.target.value))}
                className="w-full h-1 bg-[#1e1e2d] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>Low Surge</span>
                <span>Extreme Attack</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {!isFlooding ? (
                <button
                  onClick={handleStartFlood}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 text-sm"
                >
                  <Play className="w-4 h-4" /> Flood
                </button>
              ) : (
                <button
                  onClick={handleStopFlood}
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20 text-sm animate-pulse"
                >
                  <Square className="w-4 h-4" /> Stop
                </button>
              )}
              <button
                onClick={handleResetData}
                className="bg-[#1f1f2e] border border-[#2e2e42] hover:bg-[#2a2a3d] text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
              >
                <RefreshCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#232333]">
          {rateLimitEnabled ? (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2.5 rounded-lg text-xs">
              <Shield className="w-4 h-4 shrink-0" />
              <span>DDoS Shield: ACTIVE (Rate-Limiter Active)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2.5 rounded-lg text-xs animate-pulse">
              <Shield className="w-4 h-4 shrink-0 animate-spin-slow" />
              <span>DDoS Shield: INACTIVE (No Rate Limits)</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Panel */}
      <div className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-300">Live Traffic Logs</h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-gray-400">Allowed: <strong className="text-emerald-400 font-mono">{allowedCount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-gray-400">Blocked: <strong className="text-red-500 font-mono">{blockedCount}</strong></span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" vertical={false} />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} />
                <YAxis stroke="#4b5563" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161622', borderColor: '#2e2e42', borderRadius: '8px', color: '#fff' }}
                  labelClassName="font-mono text-xs text-gray-400"
                />
                <Area type="monotone" dataKey="allowed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAllowed)" name="Allowed Req" />
                <Area type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorBlocked)" name="Blocked Req" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4 bg-[#0d0d14] border border-[#1e1e2d] p-3.5 rounded-xl text-xs text-gray-400 leading-relaxed font-mono">
          {rateLimitEnabled ? (
            <span className="text-green-400">
              ✔️ WAF Rate-Limiter identifies excessive IP requests and responds with HTTP 429 (Too Many Requests), ensuring server thread pools remain responsive during attacks.
            </span>
          ) : (
            <span className="text-yellow-500 animate-pulse">
              ⚠️ Warning: No rate limit rules are defined. Large scales of automated traffic will saturate database pools and result in memory exhaustion (Denial of Service).
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
