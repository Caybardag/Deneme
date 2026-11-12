import React from 'react';
import { Sliders, Shield, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { SensitivityState } from '../types';

interface SensitivitySimulatorProps {
  sensitivity: SensitivityState;
  onChange: (next: SensitivityState) => void;
  baseSuccess: number;
  baseRisk: number;
}

export const SensitivitySimulator: React.FC<SensitivitySimulatorProps> = ({
  sensitivity,
  onChange,
  baseSuccess,
  baseRisk,
}) => {
  // Dynamic formula based on knobs
  const adjustedSuccess = Math.min(
    98,
    Math.max(
      20,
      Math.round(
        baseSuccess +
          (sensitivity.capitalBuffer - 50) * 0.25 -
          (sensitivity.timePressure - 50) * 0.2 +
          (sensitivity.conflictTolerance - 50) * 0.15 -
          (sensitivity.riskTolerance - 50) * 0.1
      )
    )
  );

  const adjustedRisk = Math.min(
    95,
    Math.max(
      10,
      Math.round(
        baseRisk +
          (sensitivity.riskTolerance - 50) * 0.35 +
          (sensitivity.timePressure - 50) * 0.2 -
          (sensitivity.capitalBuffer - 50) * 0.3
      )
    )
  );

  const clarityScore = Math.min(
    99,
    Math.max(
      35,
      Math.round(
        88 +
          (sensitivity.conflictTolerance - 50) * 0.15 -
          (sensitivity.timePressure - 50) * 0.15
      )
    )
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 mb-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Sliders className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Dinamik Değişken ve Duyarlılık Simülatörü</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Canlı Matematiksel Model
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Şartlar değiştikçe başarı olasılığı ve risk katsayısı anlık olarak yeniden hesaplanır.
            </p>
          </div>
        </div>

        {/* Real-time calculated indicators */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-center min-w-[90px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Başarı Oranı</span>
            <span className={`text-base font-extrabold ${adjustedSuccess >= 70 ? 'text-emerald-400' : adjustedSuccess >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              %{adjustedSuccess}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-center min-w-[90px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Risk Endeksi</span>
            <span className={`text-base font-extrabold ${adjustedRisk <= 35 ? 'text-emerald-400' : adjustedRisk <= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
              {adjustedRisk}/100
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-center min-w-[90px] hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Netlik Puanı</span>
            <span className="text-base font-extrabold text-teal-400">
              {clarityScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk Tolerance */}
        <div className="space-y-1.5 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Risk İştahı</span>
            </span>
            <span className="font-bold text-amber-400">%{sensitivity.riskTolerance}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sensitivity.riskTolerance}
            onChange={(e) => onChange({ ...sensitivity, riskTolerance: Number(e.target.value) })}
            className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Muhafazakar</span>
            <span>Agresif</span>
          </div>
        </div>

        {/* Time Pressure */}
        <div className="space-y-1.5 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Zaman / Aciliyet Baskısı</span>
            </span>
            <span className="font-bold text-rose-400">%{sensitivity.timePressure}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sensitivity.timePressure}
            onChange={(e) => onChange({ ...sensitivity, timePressure: Number(e.target.value) })}
            className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Rahat Vade</span>
            <span>Anlık Kriz</span>
          </div>
        </div>

        {/* Conflict Tolerance */}
        <div className="space-y-1.5 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              <span>Çatışma / Yüzleşme Eşiği</span>
            </span>
            <span className="font-bold text-teal-400">%{sensitivity.conflictTolerance}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sensitivity.conflictTolerance}
            onChange={(e) => onChange({ ...sensitivity, conflictTolerance: Number(e.target.value) })}
            className="w-full accent-teal-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Uyumcu</span>
            <span>Tavizsiz Otorite</span>
          </div>
        </div>

        {/* Capital / Buffer */}
        <div className="space-y-1.5 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nakit & Enerji Tamponu</span>
            </span>
            <span className="font-bold text-emerald-400">%{sensitivity.capitalBuffer}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sensitivity.capitalBuffer}
            onChange={(e) => onChange({ ...sensitivity, capitalBuffer: Number(e.target.value) })}
            className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Sıfır Rezerv</span>
            <span>Güçlü Rezerv</span>
          </div>
        </div>
      </div>
    </div>
  );
};
