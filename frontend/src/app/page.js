'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  Sliders, 
  AlertTriangle, 
  Eye, 
  Trash2, 
  RefreshCw, 
  Activity, 
  Lock, 
  Settings, 
  KeyRound, 
  Database, 
  UserCheck 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { io } from 'socket.io-client';

// Sandbox components
import SQLiSandbox from '../components/SQLiSandbox';
import PwCrackerSandbox from '../components/PwCrackerSandbox';
import DDoSProtection from '../components/DDoSProtection';
import RBACSandbox from '../components/RBACSandbox';
import TheftDetection from '../components/TheftDetection';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export default function SecureLensHome() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [defenseConfig, setDefenseConfig] = useState({
    wafEnabled: false,
    rateLimitEnabled: false,
    sessionLockEnabled: false,
    strictPasswordPolicy: false,
    rbacStrictMode: false
  });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    blockedRequests: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchSecurityState = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/security/config`);
      setDefenseConfig(response.data.config);
      setSecurityLogs(response.data.logs);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching security stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle defensive tools
  const handleToggleDefense = async (policyKey, currentVal) => {
    const nextVal = !currentVal;
    const payload = {
      wafEnabled: defenseConfig.wafEnabled,
      rateLimitEnabled: defenseConfig.rateLimitEnabled,
      sessionLockEnabled: defenseConfig.sessionLockEnabled,
      strictPasswordPolicy: defenseConfig.strictPasswordPolicy,
      rbacStrictMode: defenseConfig.rbacStrictMode
    };
    payload[policyKey] = nextVal;

    try {
      const response = await axios.post(`${API_BASE_URL}/security/config`, payload);
      if (response.data.success) {
        setDefenseConfig(response.data.config);
        toast.success(`${policyKey.replace('Enabled', '').replace('Policy', '').replace('Mode', '').toUpperCase()} Defense Updated`);
        fetchSecurityState();
      }
    } catch (err) {
      toast.error('Failed to change defense configurations.');
    }
  };

  // Clear logs
  const handleClearLogs = async () => {
    try {
      await axios.post(`${API_BASE_URL}/clear-logs`);
      setSecurityLogs([]);
      fetchSecurityState();
      toast.success('Logs Cleared');
    } catch (err) {
      toast.error('Failed to clear logs.');
    }
  };

  // Setup sockets for real-time telemetry feed
  useEffect(() => {
    fetchSecurityState();

    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('Telemetry Socket.IO Connected');
    });

    socket.on('securityLog', (newLog) => {
      setSecurityLogs(prev => [newLog, ...prev].slice(0, 100));
      // Re-trigger states refresh
      setStats(prev => {
        const isCritical = newLog.severity === 'CRITICAL' || newLog.severity === 'HIGH';
        const isBlocked = newLog.type.includes('BLOCKED') || newLog.type.includes('VIOLATION') || newLog.type.includes('HIJACK');
        return {
          totalAlerts: prev.totalAlerts + 1,
          criticalAlerts: prev.criticalAlerts + (isCritical ? 1 : 0),
          blockedRequests: prev.blockedRequests + (isBlocked ? 1 : 0)
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Security Dashboard', icon: Sliders },
    { id: 'sqli', label: 'SQL Injection Lab', icon: Database },
    { id: 'passwords', label: 'Credentials Auditor', icon: KeyRound },
    { id: 'ddos', label: 'DDoS Flood Lab', icon: Activity },
    { id: 'rbac', label: 'RBAC Gatekeeper', icon: UserCheck },
    { id: 'theft', label: 'Theft Simulator', icon: Lock }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col font-sans">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Header bar */}
      <header className="border-b border-[#1b1b26] bg-[#0c0c14]/90 sticky top-0 z-50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-md shadow-blue-500/5">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">SecureLens</h1>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Cybersecurity Threat Range</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={fetchSecurityState}
            className="p-2 bg-[#1f1f2e] border border-[#2e2e42] hover:bg-[#2a2a3d] rounded-lg text-gray-400 hover:text-white transition-all"
            title="Reload Security State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
            <span className="text-xs text-gray-400 font-semibold font-mono">IDS Gateway Arming: OK</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-5">
        
        {/* Sidebar Nav */}
        <aside className="col-span-1 border-r border-[#1b1b26] bg-[#0c0c14]/50 p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3 font-mono">Simulators & Labs</span>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        activeTab === item.id
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                          : 'text-gray-400 hover:bg-[#161622] hover:text-white'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Defense Controllers */}
            <div className="pt-6 border-t border-[#1b1b26] space-y-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block font-mono">WAF / IDS Controls</span>
              
              <div className="space-y-3">
                {/* WAF Switch */}
                <div className="flex items-center justify-between bg-[#13131c] border border-[#20202e] p-3 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-gray-300">Web App Firewall</span>
                    <span className="text-[9px] text-gray-500 font-mono">Blocks SQL Injection</span>
                  </div>
                  <button 
                    onClick={() => handleToggleDefense('wafEnabled', defenseConfig.wafEnabled)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                      defenseConfig.wafEnabled ? 'bg-green-500 flex justify-end' : 'bg-red-500/30 flex justify-start'
                    }`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Rate Limiting Switch */}
                <div className="flex items-center justify-between bg-[#13131c] border border-[#20202e] p-3 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-gray-300">Rate Limiter (DoS)</span>
                    <span className="text-[9px] text-gray-500 font-mono">Anti request packet flood</span>
                  </div>
                  <button 
                    onClick={() => handleToggleDefense('rateLimitEnabled', defenseConfig.rateLimitEnabled)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                      defenseConfig.rateLimitEnabled ? 'bg-green-500 flex justify-end' : 'bg-red-500/30 flex justify-start'
                    }`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Session lock Switch */}
                <div className="flex items-center justify-between bg-[#13131c] border border-[#20202e] p-3 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-gray-300">Session Lock (IP)</span>
                    <span className="text-[9px] text-gray-500 font-mono">Anti theft fingerprint</span>
                  </div>
                  <button 
                    onClick={() => handleToggleDefense('sessionLockEnabled', defenseConfig.sessionLockEnabled)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                      defenseConfig.sessionLockEnabled ? 'bg-green-500 flex justify-end' : 'bg-red-500/30 flex justify-start'
                    }`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Strict Password Policy */}
                <div className="flex items-center justify-between bg-[#13131c] border border-[#20202e] p-3 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-gray-300">Strict Passwords</span>
                    <span className="text-[9px] text-gray-500 font-mono">Min 8 chars, numbers, caps</span>
                  </div>
                  <button 
                    onClick={() => handleToggleDefense('strictPasswordPolicy', defenseConfig.strictPasswordPolicy)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                      defenseConfig.strictPasswordPolicy ? 'bg-green-500 flex justify-end' : 'bg-red-500/30 flex justify-start'
                    }`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Strict RBAC */}
                <div className="flex items-center justify-between bg-[#13131c] border border-[#20202e] p-3 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-gray-300">Strict Auth RBAC</span>
                    <span className="text-[9px] text-gray-500 font-mono">Block unauthorized roles</span>
                  </div>
                  <button 
                    onClick={() => handleToggleDefense('rbacStrictMode', defenseConfig.rbacStrictMode)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                      defenseConfig.rbacStrictMode ? 'bg-green-500 flex justify-end' : 'bg-red-500/30 flex justify-start'
                    }`}
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-600 font-mono text-center">
            SecureLens Threat Center © 2026
          </div>
        </aside>

        {/* Dashboard Work Area */}
        <main className="col-span-1 xl:col-span-4 p-8 space-y-8 overflow-y-auto">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-3">
              <div className="w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              <span>Synchronizing telemetry databases...</span>
            </div>
          ) : (
            <>
              {/* Tab: Dashboard SIEM overview */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  {/* Title & description */}
                  <div>
                    <h2 className="text-2xl font-black">Threat Command Center</h2>
                    <p className="text-gray-400 text-sm mt-1">Real-time alerts, intrusion detection analytics, and network telemetry logs.</p>
                  </div>

                  {/* Telemetry quick status blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass rounded-2xl p-6 border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start text-gray-500 uppercase tracking-wider text-xs mb-2 font-mono">
                        <span>Total Security Alerts</span>
                        <AlertTriangle className="w-4.5 h-4.5 text-blue-400" />
                      </div>
                      <h3 className="text-3xl font-black font-mono text-blue-400">{stats.totalAlerts}</h3>
                      <span className="text-[10px] text-gray-500 mt-1 block">Active monitor alerts recorded</span>
                    </div>

                    <div className="glass rounded-2xl p-6 border-l-4 border-l-rose-500">
                      <div className="flex justify-between items-start text-gray-500 uppercase tracking-wider text-xs mb-2 font-mono">
                        <span>High-Severity Threats</span>
                        <ShieldAlert className="w-4.5 h-4.5 text-rose-400" />
                      </div>
                      <h3 className="text-3xl font-black font-mono text-rose-400">{stats.criticalAlerts}</h3>
                      <span className="text-[10px] text-gray-500 mt-1 block">Critical breaches and bypass triggers</span>
                    </div>

                    <div className="glass rounded-2xl p-6 border-l-4 border-l-green-500">
                      <div className="flex justify-between items-start text-gray-500 uppercase tracking-wider text-xs mb-2 font-mono">
                        <span>Threat Interceptions</span>
                        <ShieldCheck className="w-4.5 h-4.5 text-green-400" />
                      </div>
                      <h3 className="text-3xl font-black font-mono text-green-400">{stats.blockedRequests}</h3>
                      <span className="text-[10px] text-gray-500 mt-1 block">Blocked injections and session thefts</span>
                    </div>
                  </div>

                  {/* Incident Feed Section */}
                  <div className="glass rounded-2xl p-6 flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-gray-400" />
                        <h3 className="font-bold text-gray-200">Incident Event Feed (SIEM Logs)</h3>
                      </div>
                      <button 
                        onClick={handleClearLogs}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear Feed
                      </button>
                    </div>

                    {/* Live events timeline */}
                    <div className="flex-1 bg-[#0b0b12] border border-[#1e1e2d] rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-[450px] space-y-2.5">
                      {securityLogs.length > 0 ? (
                        securityLogs.map((log) => (
                          <div 
                            key={log.id} 
                            className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                              log.severity === 'CRITICAL' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                              log.severity === 'HIGH' ? 'bg-orange-500/5 border-orange-500/20 text-orange-400' :
                              log.severity === 'MEDIUM' ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/5 border-blue-500/10 text-blue-400'
                            }`}
                          >
                            <div className="space-y-1 max-w-[85%]">
                              <div className="flex items-center gap-2 text-[9px] text-gray-500">
                                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span>•</span>
                                <span className="font-bold uppercase tracking-wider">{log.type}</span>
                              </div>
                              <p className="text-gray-200 font-sans text-xs">{log.message}</p>
                            </div>
                            
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-center self-start md:self-center uppercase ${
                              log.severity === 'CRITICAL' || log.severity === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                              log.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-blue-500/10 text-blue-400'
                            }`}>
                              {log.severity}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
                          <Eye className="w-8 h-8 opacity-20" />
                          <span>No incidents recorded. System secure.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: SQLi Sandbox */}
              {activeTab === 'sqli' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black">SQL Injection Lab</h2>
                    <p className="text-gray-400 text-sm mt-1">Simulate database queries and experience WAF defense parameterization.</p>
                  </div>
                  <SQLiSandbox 
                    apiBaseUrl={API_BASE_URL} 
                    wafEnabled={defenseConfig.wafEnabled} 
                    logs={securityLogs}
                    refreshStats={fetchSecurityState}
                  />
                </div>
              )}

              {/* Tab: Passwords Strength & Cracking */}
              {activeTab === 'passwords' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black">Credentials & Hashing Auditor</h2>
                    <p className="text-gray-400 text-sm mt-1">Audit password entropy complexity and test dictionary hashes GPU speed cracking.</p>
                  </div>
                  <PwCrackerSandbox 
                    apiBaseUrl={API_BASE_URL} 
                    strictPasswordPolicy={defenseConfig.strictPasswordPolicy}
                    refreshStats={fetchSecurityState}
                  />
                </div>
              )}

              {/* Tab: DDoS Protection */}
              {activeTab === 'ddos' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black">DDoS Attack Playground</h2>
                    <p className="text-gray-400 text-sm mt-1">Generate request packets surge floods to review WAF rate-limiting response.</p>
                  </div>
                  <DDoSProtection 
                    apiBaseUrl={API_BASE_URL} 
                    rateLimitEnabled={defenseConfig.rateLimitEnabled}
                    refreshStats={fetchSecurityState}
                  />
                </div>
              )}

              {/* Tab: RBAC Access Control */}
              {activeTab === 'rbac' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black">Role-Based Access (RBAC) Sandbox</h2>
                    <p className="text-gray-400 text-sm mt-1">Evaluate guest, user, and administrator authorization rulesets.</p>
                  </div>
                  <RBACSandbox 
                    apiBaseUrl={API_BASE_URL} 
                    rbacStrictMode={defenseConfig.rbacStrictMode}
                    refreshStats={fetchSecurityState}
                  />
                </div>
              )}

              {/* Tab: Session hijacking theft */}
              {activeTab === 'theft' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black">Session Theft & Anomaly Simulator</h2>
                    <p className="text-gray-400 text-sm mt-1">Inspect cookie hijacking defenses via IP address and User-Agent fingerprint audits.</p>
                  </div>
                  <TheftDetection 
                    apiBaseUrl={API_BASE_URL} 
                    sessionLockEnabled={defenseConfig.sessionLockEnabled}
                    refreshStats={fetchSecurityState}
                  />
                </div>
              )}
            </>
          )}

        </main>

      </div>
    </div>
  );
}
