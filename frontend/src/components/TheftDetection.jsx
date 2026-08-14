import React, { useState } from 'react';
import axios from 'axios';
import { Shield, ShieldAlert, Sparkles, Copy, AlertTriangle, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TheftDetection({ apiBaseUrl, sessionLockEnabled, refreshStats }) {
  const [sessionToken, setSessionToken] = useState('eyJhY2Nlc3NfdG9rZW4iOiJzZWN1cmVsZW5zXzIwMjZfc2Vzc2lvbl90b2tlbl85OTk4ODgifQ==');
  const [clientIp, setClientIp] = useState('127.0.0.1');
  const [userAgent, setUserAgent] = useState('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  const [results, setResults] = useState(null);
  const [isHijackMode, setIsHijackMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const triggerAttack = async () => {
    setLoading(true);
    setResults(null);

    const headers = {
      'Authorization': `Bearer ${sessionToken}`,
      'x-virtual-ip': clientIp,
      'x-virtual-user-agent': userAgent,
    };

    if (isHijackMode) {
      headers['x-simulate-theft'] = 'true';
    }

    try {
      const response = await axios.post(`${apiBaseUrl}/simulate-theft`, { hijacked: isHijackMode ? 'true' : 'false' }, { headers });
      setResults({
        status: 'SUCCESS',
        code: 200,
        message: 'Session verified. Request authorized.',
        description: 'Session fingerprints matches server-side active records.'
      });
      toast.success('Session Verified: Authorized');
      refreshStats();
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setResults({
          status: 'BLOCKED',
          code: 401,
          message: err.response.data.error,
          description: 'Intrusion Detection System aborted the request: Potential credential theft or session token hijacking detected (Fingerprint anomaly).'
        });
        toast.error('Session Hijack Attempt Blocked!');
      } else {
        toast.error('Connection lost or internal error.');
      }
      refreshStats();
    } finally {
      setLoading(false);
    }
  };

  const loadNormalSession = () => {
    setIsHijackMode(false);
    setClientIp('127.0.0.1');
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    toast.success('Loaded Standard Client Session Parameters');
  };

  const loadHijackedSession = () => {
    setIsHijackMode(true);
    setClientIp('198.51.100.155'); // Fake external IP address
    setUserAgent('Python-urllib/3.9 (Automated scraper agent)'); // Fake user-agent script
    toast.error('Session Token Stolen: Fingerprints Swapped');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Session Configurations */}
      <div className="glass rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Session Theft Simulator</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Simulate a Session Hijack attack. Obtain a valid session cookie/token and spoof HTTP headers (IP / User Agent fingerprint) to bypass active authorization.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500 block mb-2 flex items-center justify-between">
                <span>Active Session Token</span>
                <span className="text-[10px] text-gray-600 font-mono">BASE64 JWT</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sessionToken}
                  readOnly
                  className="w-full bg-[#161622] border border-[#2e2e42] rounded-xl px-3 py-2 text-white font-mono text-[10px] select-all focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sessionToken);
                    toast.success('Token Copied!');
                  }}
                  className="bg-[#1f1f2e] border border-[#2e2e42] hover:bg-[#2a2a3d] text-white p-2.5 rounded-xl transition-all"
                  title="Copy Token"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={loadNormalSession}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex justify-between items-center transition-all ${
                  !isHijackMode 
                    ? 'bg-green-500/15 border-green-500/30 text-green-400' 
                    : 'bg-[#161622] border-[#2e2e42] hover:bg-[#202030] text-gray-400'
                }`}
              >
                <span>Authorized Owner (Manav)</span>
                <span className="text-[10px] uppercase font-bold">IP: 127.0.0.1</span>
              </button>

              <button
                onClick={loadHijackedSession}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex justify-between items-center transition-all ${
                  isHijackMode 
                    ? 'bg-red-500/15 border-red-500/30 text-red-400 animate-pulse' 
                    : 'bg-[#161622] border-[#2e2e42] hover:bg-[#202030] text-gray-400'
                }`}
              >
                <span>Malicious Attacker</span>
                <span className="text-[10px] uppercase font-bold">IP: 198.51.100.155</span>
              </button>
            </div>

            <button
              onClick={triggerAttack}
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Verifying session...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Request Endpoint with Token
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#232333]">
          {sessionLockEnabled ? (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2.5 rounded-lg text-xs">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Session Fingerprint: STRICT (IP/UA Check Active)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2.5 rounded-lg text-xs animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0 animate-spin-slow" />
              <span>Session Fingerprint: PERMISSIVE (Token only validation)</span>
            </div>
          )}
        </div>
      </div>

      {/* Verification Terminal */}
      <div className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-300">Intrusion Detection Gateway</h3>
          </div>

          <div className="bg-[#0b0b12] border border-[#1e1e2d] rounded-xl p-4 flex-1 font-mono text-xs overflow-auto space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs bg-[#161622] p-3 rounded-lg border border-[#20202e]">
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-sans mb-0.5">Session virtual IP:</span>
                <span className="text-gray-300">{clientIp}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[9px] uppercase font-sans mb-0.5">Session virtual User-Agent:</span>
                <span className="text-gray-300 truncate block" title={userAgent}>{userAgent}</span>
              </div>
            </div>

            {results ? (
              <div className={`p-4 rounded-xl border space-y-2 ${
                results.status === 'SUCCESS'
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <div className="flex justify-between items-center font-bold">
                  <span>{results.message}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-black/30">HTTP {results.code}</span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed pt-1">
                  {results.description}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500 gap-2">
                <Shield className="w-8 h-8 opacity-25" />
                <p>Select session parameters and query the server to check authorization filters</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 bg-[#0d0d14] border border-[#1e1e2d] p-3.5 rounded-xl text-xs text-gray-400 leading-relaxed font-mono">
          <div className="flex gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500 shrink-0" />
            <span>
              💡 <strong>Intrusion Check:</strong> In a real-world scenario, attackers steal session identifiers (like cookies or localstorage tokens) via XSS or packet sniffing. Strict session locks bind a token to the user's specific network coordinates.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
