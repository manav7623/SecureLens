import React, { useState } from 'react';
import axios from 'axios';
import { UserCheck, ShieldAlert, Lock, Unlock, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RBACSandbox({ apiBaseUrl, rbacStrictMode, refreshStats }) {
  const [selectedRole, setSelectedRole] = useState('guest');
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const testResources = [
    { name: 'Public Overview', endpoint: '/security/rbac/guest-data', roles: ['guest', 'user', 'admin'] },
    { name: 'Employee Database', endpoint: '/security/rbac/user-data', roles: ['user', 'admin'] },
    { name: 'Decryption Keys', endpoint: '/security/rbac/admin-data', roles: ['admin'] }
  ];

  const handleAccessResource = async (resource) => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}${resource.endpoint}`, {
        headers: { 'x-virtual-role': selectedRole }
      });

      const log = {
        timestamp: new Date().toLocaleTimeString(),
        resource: resource.name,
        roleAttempt: selectedRole,
        status: 'GRANTED',
        data: response.data.data
      };

      setAccessLogs(prev => [log, ...prev].slice(0, 10));
      toast.success(`Access Granted to ${resource.name}`);
      refreshStats();
    } catch (err) {
      const errorMsg = err.response && err.response.data ? err.response.data.error : 'Unauthorized Access';
      
      const log = {
        timestamp: new Date().toLocaleTimeString(),
        resource: resource.name,
        roleAttempt: selectedRole,
        status: 'DENIED',
        data: errorMsg
      };

      setAccessLogs(prev => [log, ...prev].slice(0, 10));
      toast.error(`Access Denied: ${resource.name}`);
      refreshStats();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Role Manager */}
      <div className="glass rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">RBAC Control Panel</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Assign yourself a virtual security role, then request access to internal system endpoints to check authentication and authorization gates.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500 block mb-2">
                Select Your Virtual Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['guest', 'user', 'admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase transition-all ${
                      selectedRole === role
                        ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400 shadow-md shadow-yellow-500/5'
                        : 'bg-[#161622] border-[#2e2e42] hover:bg-[#202030] text-gray-400'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500 block">
                Request Target Resources
              </label>
              {testResources.map((res, index) => (
                <button
                  key={index}
                  onClick={() => handleAccessResource(res)}
                  disabled={loading}
                  className="w-full bg-[#12121a] hover:bg-[#1a1a26] border border-[#232333] hover:border-yellow-500/50 p-3 rounded-xl flex items-center justify-between text-xs text-gray-300 font-semibold transition-all disabled:opacity-50"
                >
                  <span>{res.name}</span>
                  <div className="flex gap-1">
                    {res.roles.includes(selectedRole) ? (
                      <Unlock className="w-4 h-4 text-green-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#232333]">
          {rbacStrictMode ? (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2.5 rounded-lg text-xs">
              <Unlock className="w-4 h-4 shrink-0" />
              <span>RBAC Policy: STRICT (Unauthorized Requests Blocked)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2.5 rounded-lg text-xs animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>RBAC Policy: PERMISSIVE (Logs only, No Route Blocks)</span>
            </div>
          )}
        </div>
      </div>

      {/* Access Log Feed */}
      <div className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col min-h-[300px]">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-300">Access Telemetry Logs</h3>
        </div>

        <div className="bg-[#0b0b12] border border-[#1e1e2d] rounded-xl p-4 flex-1 font-mono text-xs overflow-auto space-y-3">
          {accessLogs.length > 0 ? (
            accessLogs.map((log, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                  log.status === 'GRANTED'
                    ? 'bg-green-500/5 border-green-500/10 text-green-400'
                    : 'bg-red-500/5 border-red-500/10 text-red-400'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{log.timestamp}</span>
                    <span>•</span>
                    <span className="uppercase font-bold">Attempt: {log.roleAttempt}</span>
                  </div>
                  <div className="font-semibold text-gray-200">
                    Requesting Resource: <strong className="underline">{log.resource}</strong>
                  </div>
                  <div className="text-[11px] text-gray-400 break-all leading-relaxed pt-1">
                    Response Payload: <span className="font-bold">{log.data}</span>
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded text-[10px] font-bold self-start md:self-center ${
                  log.status === 'GRANTED' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {log.status}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
              <UserCheck className="w-8 h-8 opacity-25" />
              <p>Simulate endpoints access requests to view real-time auth decisions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
