import React, { useState } from 'react';
import { GitBranch, ChevronRight, CheckCircle, AlertTriangle, ArrowRight, CornerDownRight, Percent, Award } from 'lucide-react';
import { DecisionNode } from '../types';

interface DecisionTreeViewProps {
  decisionTree?: DecisionNode[];
}

export const DecisionTreeView: React.FC<DecisionTreeViewProps> = ({ decisionTree }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!decisionTree || decisionTree.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        Bu çözüm için karar ağacı hesaplanmadı.
      </div>
    );
  }

  const renderNode = (node: DecisionNode, depth: number = 0) => {
    const isSelected = selectedNodeId === node.id;
    return (
      <div key={node.id} className="space-y-3">
        <div
          onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
          className={`border rounded-2xl p-4 sm:p-5 transition-all cursor-pointer relative ${
            isSelected
              ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {depth > 0 && (
            <div className="absolute -left-5 top-6 text-slate-600">
              <CornerDownRight className="w-4 h-4" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                <GitBranch className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400">
                {node.branchCondition}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Percent className="w-3 h-3 text-emerald-400" />
                <span>%{node.probability} Olasılık</span>
              </span>

              <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${
                node.payoff >= 70
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : node.payoff >= 40
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>
                <Award className="w-3 h-3" />
                <span>Getiri: +{node.payoff}/100</span>
              </span>
            </div>
          </div>

          <h4 className="text-sm sm:text-base font-bold text-white mb-1.5">
            {node.title}
          </h4>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {node.action}
          </p>
        </div>

        {/* Children Branches */}
        {node.children && node.children.length > 0 && (
          <div className="space-y-3 pl-2 sm:pl-4 border-l border-slate-800/80 my-2">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-7 backdrop-blur-md space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-400" />
            <span>Olasılıksal Karar Dallanma Grafiği</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Muhatabın vereceği tepkiye veya piyasa şartlarına göre hangi yolun hangi olasılıkla ne kazandıracağını gösteren matematiksel eylem dalları.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Yüksek Getiri</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 ml-2" />
          <span>Orta Getiri</span>
        </div>
      </div>

      <div className="space-y-4">
        {decisionTree.map((rootNode) => renderNode(rootNode, 0))}
      </div>
    </div>
  );
};
