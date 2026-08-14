import React, { useState } from 'react';
import axios from 'axios';
import { KeyRound, ShieldAlert, Cpu, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PwCrackerSandbox({ apiBaseUrl, strictPasswordPolicy, refreshStats }) {
  const [passwordInput, setPasswordInput] = useState('');
  const [crackMethod, setCrackMethod] = useState('MD5');
  const [auditedStrength, setAuditedStrength] = useState(null);
  const [crackedResults, setCrackedResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAuditPassword = async (pwd) => {
    if (!pwd) {
      setAuditedStrength(null);
      return;
    }

    try {
      const response = await axios.post(`${apiBaseUrl}/security/pw-strength`, { password: pwd });
      setAuditedStrength(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateCrack = async () => {
    if (!passwordInput.trim()) {
      toast.error('Please input a target password first.');
      return;
    }
    setLoading(true);
    setCrackedResults(null);

    try {
      const response = await axios.post(`${apiBaseUrl}/security/pw-crack`, {
        password: passwordInput,
        hashType: crackMethod
      });
      setCrackedResults(response.data);
      toast.success('Simulation complete');
      refreshStats();
    } catch (err) {
      toast.error('Simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1.0e+9) return (num / 1.0e+9).toFixed(1) + ' Billion';
    if (num >= 1.0e+6) return (num / 1.0e+6).toFixed(1) + ' Million';
    if (num >= 1.0e+3) return (num / 1.0e+3).toFixed(1) + ' Thousand';
    return num;
  };

  const formatSeconds = (sec) => {
    if (sec === 0) return '0 seconds (Instant)';
    if (sec < 1) return (sec * 1000).toFixed(0) + ' Milliseconds';
    if (sec >= 86400) return (sec / 86400).toFixed(1) + ' Days';
    if (sec >= 3600) return (sec / 3600).toFixed(1) + ' Hours';
    if (sec >= 60) return (sec / 60).toFixed(1) + ' Minutes';
    return sec.toFixed(2) + ' Seconds';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Strength Auditor */}
      <div className="glass rounded-2xl p-6 flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Password Strength Auditor</h2>
          </div>
          <p className="text-gray-400 text-sm">
            Check how password entropy, length, and complexity dictate cracking vulnerability. Enforcing strict security requirements forces users to select complex credentials.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500 block mb-2">
              Input Password for Auditing
            </label>
            <input
              type="text"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                handleAuditPassword(e.target.value);
              }}
              placeholder="Type a password here..."
              className="w-full bg-[#161622] border border-[#2e2e42] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all text-sm font-mono"
            />
          </div>

          {auditedStrength && (
            <div className="space-y-4 bg-[#0d0d14] border border-[#1e1e2d] rounded-xl p-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Audited Strength:</span>
                <span className={`font-bold px-2 py-1 rounded text-xs ${
                  auditedStrength.strength === 'STRONG' ? 'text-green-400 bg-green-500/15' :
                  auditedStrength.strength === 'MEDIUM' ? 'text-yellow-400 bg-yellow-500/15' :
                  'text-red-400 bg-red-500/15'
                }`}>
                  {auditedStrength.strength}
                </span>
              </div>

              {/* Entropy Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Entropy Score</span>
                  <span>{auditedStrength.score} / 6</span>
                </div>
                <div className="h-2 w-full bg-[#1b1b26] rounded-full overflow-hidden flex gap-0.5">
                  {[...Array(6)].map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-full flex-1 ${
                        idx < auditedStrength.score
                          ? auditedStrength.strength === 'STRONG' ? 'bg-green-500' :
                            auditedStrength.strength === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Policies list */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="flex items-center gap-1.5 text-gray-300">
                  {auditedStrength.requirementsMet.length ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-gray-600 shrink-0" />}
                  <span>Min 8 characters</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-300">
                  {auditedStrength.requirementsMet.uppercase ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-gray-600 shrink-0" />}
                  <span>Uppercase character</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-300">
                  {auditedStrength.requirementsMet.lowercase ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-gray-600 shrink-0" />}
                  <span>Lowercase character</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-300">
                  {auditedStrength.requirementsMet.number ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-gray-600 shrink-0" />}
                  <span>Contains numbers</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-300">
                  {auditedStrength.requirementsMet.special ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-gray-600 shrink-0" />}
                  <span>Special character</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-300">
                  {auditedStrength.requirementsMet.notCommon ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  <span>Not in common list</span>
                </div>
              </div>

              {strictPasswordPolicy && (
                <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  auditedStrength.isCompliant 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {auditedStrength.isCompliant ? (
                    <span>Complies with corporate policy</span>
                  ) : (
                    <span>VIOLATION: Fails compliance criteria</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cracking Simulator */}
      <div className="glass rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Hash Cracking Simulator</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Compare hash algorithms (MD5, SHA-256 vs Bcrypt). Watch dictionary bypass speed difference to understand why slow hashing (key stretching) protects passwords.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500 block mb-2">
                Select Hash Algorithm
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['MD5', 'SHA-256', 'BCRYPT'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setCrackMethod(method)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold font-mono transition-all ${
                      crackMethod === method
                        ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-md shadow-red-500/5'
                        : 'bg-[#161622] border-[#2e2e42] hover:bg-[#202030] text-gray-400'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSimulateCrack}
              disabled={loading || !passwordInput}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Simulating attacks...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" /> Simulate Cracking Attack
                </>
              )}
            </button>
          </div>
        </div>

        {crackedResults && (
          <div className="mt-6 pt-6 border-t border-[#232333] space-y-3 font-mono text-xs">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-sans mb-1">Generated Hash:</span>
              <div className="bg-[#0b0b12] text-gray-300 p-2.5 rounded-lg border border-[#20202e] break-all">
                {crackedResults.hash}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#0d0d14] border border-[#1e1e2d] p-3 rounded-lg">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-sans">Simulated Attempts:</span>
                <span className="text-red-400 font-bold">{formatNumber(crackedResults.simulatedAttempts)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-sans">Time Required:</span>
                <span className="text-red-400 font-bold">{formatSeconds(crackedResults.simulatedDurationSec)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded-xl">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-[11px] leading-relaxed">
                💡 <strong>Cracking Log:</strong> {crackedResults.tip}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
