import React, { useState } from 'react';
import axios from 'axios';
import { Database, Shield, ShieldAlert, Terminal, Play, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SQLiSandbox({ apiBaseUrl, wafEnabled, logs, refreshStats }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [results, setResults] = useState(null);
  const [dbError, setDbError] = useState(null);
  const [queryExecuted, setQueryExecuted] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [
    { label: 'Normal User', value: 'manav' },
    { label: 'Admin User', value: 'admin' },
    { label: 'SQL Bypass Login (\' OR 1=1)', value: "admin' OR '1'='1" },
    { label: 'Dump System Secrets (UNION SELECT)', value: "' UNION SELECT secret_key, description, 'secret' FROM system_secrets --" },
    { label: 'Exfiltrate Payment Cards', value: "' UNION SELECT owner_name, card_number, cvv FROM payment_cards --" }
  ];

  const handleRunQuery = async (inputVal = usernameInput) => {
    if (!inputVal.trim()) {
      toast.error('Please enter a username or select a payload');
      return;
    }
    setLoading(true);
    setResults(null);
    setDbError(null);
    setQueryExecuted('');

    try {
      const response = await axios.post(`${apiBaseUrl}/security/sqli`, { username: inputVal });
      setResults(response.data.data);
      setQueryExecuted(response.data.queryExecuted);
      toast.success('Query executed successfully');
      refreshStats();
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.wafBlocked) {
          setDbError('❌ BLOCK: Web Application Firewall intercepted SQL injection threat.');
          toast.error('Attack Blocked by WAF!');
        } else {
          setDbError(`❌ Database Error: ${err.response.data.dbError}`);
          setQueryExecuted(err.response.data.queryExecuted);
          toast.error('Database Syntax Error');
        }
      } else {
        setDbError('❌ Connection lost or internal error.');
      }
      refreshStats();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Input Panel */}
      <div className="lg:col-span-1 glass rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">SQL Injection Playground</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Input a parameter or load a threat payload to search for users. Check how sanitization blocks malicious strings when WAF is enabled.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500 block mb-2">
                SQL Username Parameter
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. manav or admin' OR '1'='1"
                className="w-full bg-[#161622] border border-[#2e2e42] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-sm font-mono"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleRunQuery()}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 text-sm"
              >
                <Play className="w-4 h-4" /> Run Query
              </button>
              <button
                onClick={() => {
                  setUsernameInput('');
                  setResults(null);
                  setDbError(null);
                  setQueryExecuted('');
                }}
                className="bg-[#1f1f2e] border border-[#2e2e42] hover:bg-[#2a2a3d] text-white p-3 rounded-xl transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-xs font-semibold uppercase text-gray-500 block mb-2">
              Preset Exploit Payloads
            </label>
            <div className="space-y-2">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setUsernameInput(preset.value);
                    handleRunQuery(preset.value);
                  }}
                  className="w-full text-left text-xs bg-[#12121a] hover:bg-[#1a1a26] border border-[#232333] hover:border-blue-500/50 p-2.5 rounded-lg text-gray-300 font-mono transition-all overflow-hidden text-ellipsis whitespace-nowrap block"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#232333] flex items-center gap-3">
          {wafEnabled ? (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg w-full text-xs">
              <Shield className="w-4 h-4 shrink-0" />
              <span>WAF Shield: ACTIVE (Parameterized Query)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg w-full text-xs animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>WAF Shield: OFF (Vulnerable String Concat)</span>
            </div>
          )}
        </div>
      </div>

      {/* Middle & Right Output Terminal */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* SQL Execution Output */}
        <div className="glass rounded-2xl p-6 flex-1 flex flex-col min-h-[300px]">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-300">Database Engine Output</h3>
          </div>

          <div className="bg-[#0b0b12] border border-[#1e1e2d] rounded-xl p-4 flex-1 font-mono text-xs overflow-auto space-y-4">
            {queryExecuted && (
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-[10px] mb-1 font-sans">SQL Command Executed:</p>
                <div className="bg-[#12121a] text-blue-300 p-3 rounded-lg border border-[#20202e] overflow-x-auto break-all">
                  {queryExecuted}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
                <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                Querying database...
              </div>
            )}

            {!loading && results && (
              <div>
                <p className="text-gray-500 uppercase tracking-wider text-[10px] mb-2 font-sans">
                  Query Results ({results.length} row(s) returned):
                </p>
                {results.length > 0 ? (
                  <div className="overflow-x-auto border border-[#20202e] rounded-lg">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#161622] text-gray-400 border-b border-[#20202e]">
                          {Object.keys(results[0]).map((key) => (
                            <th key={key} className="px-4 py-2 text-left font-bold">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((row, idx) => (
                          <tr key={idx} className="border-b border-[#1b1b26] hover:bg-[#1a1a26]/30">
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx} className="px-4 py-2 text-green-400">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-yellow-500">0 rows returned. User not found.</p>
                )}
              </div>
            )}

            {!loading && dbError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl space-y-2">
                <p className="font-semibold">{dbError}</p>
                {dbError.includes('Database syntax error') && (
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    💡 <strong>Vulnerability Insight:</strong> The application failed to sanitize the input parameters before passing them to the SQLite query engine. The unclosed quotation marks directly modify the query structure, breaking SQL parse logic!
                  </p>
                )}
              </div>
            )}

            {!loading && !results && !dbError && (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
                <Database className="w-8 h-8 opacity-25" />
                <p>Run a query or click a preset payload to query the SQL engine</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
