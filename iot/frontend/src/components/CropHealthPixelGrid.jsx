import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Activity, AlertTriangle, CheckCircle2, Info, Grid as GridIcon, RefreshCw, Zap } from 'lucide-react';

export default function CropHealthPixelGrid({
  meanNdvi = 0.582,
  cropType = 'Mixed Crop',
  healthyPct = 78.4,
  stressedPct = 8.6,
  onZoneSelect
}) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Generate an 8 columns x 6 rows = 48 micro-plot grid matrix
  const gridMatrix = useMemo(() => {
    const cols = 8;
    const rows = 6;
    const cells = [];

    // Deterministic pseudo-random seed based on meanNdvi
    const seed = Math.floor(meanNdvi * 10000);
    const pseudoRandom = (i) => {
      const x = Math.sin(seed + i * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const rnd = pseudoRandom(idx);

        // Spatial moisture/health gradient across farm field
        const spatialGradient = Math.sin(c / 2.5) * 0.08 + Math.cos(r / 2.0) * 0.06;
        let cellNdvi = meanNdvi + (rnd - 0.5) * 0.28 + spatialGradient;
        cellNdvi = Math.max(0.12, Math.min(0.92, cellNdvi));

        let status = 'healthy';
        let colorClass = '';
        let statusLabel = 'Healthy';
        let bgStyle = '';

        if (cellNdvi >= 0.58) {
          status = 'healthy';
          statusLabel = 'Healthy Canopy';
          // Color variations matching high-density healthy vegetation
          const greenShades = [
            '#15803d', '#16a34a', '#22c55e', '#166534',
            '#14532d', '#10b981', '#059669', '#047857'
          ];
          bgStyle = greenShades[Math.floor(rnd * greenShades.length)];
        } else if (cellNdvi >= 0.38) {
          status = 'moderate';
          statusLabel = 'Moderate Growth';
          // Yellow-green / olive / chartreuse shades
          const oliveShades = [
            '#65a30d', '#84cc16', '#4d7c0f', '#854d0e',
            '#a16207', '#3f6212', '#713f12', '#6b7280'
          ];
          bgStyle = oliveShades[Math.floor(rnd * oliveShades.length)];
        } else {
          status = 'stressed';
          statusLabel = 'Stressed / Dry';
          // Red / Crimson / Amber shades for water deficit sub-plots
          const redShades = [
            '#dc2626', '#b91c1c', '#991b1b', '#ef4444',
            '#ea580c', '#d97706'
          ];
          bgStyle = redShades[Math.floor(rnd * redShades.length)];
        }

        const moisture = Math.round(cellNdvi * 55 + 12);
        const zoneId = `Zone ${rowLabels[r]}-${c + 1}`;

        let advice = 'Canopy is healthy and robust. No irrigation adjustment needed.';
        if (status === 'stressed') {
          advice = `Water deficit detected in ${zoneId}. Recommend +15 mins drip line cycle.`;
        } else if (status === 'moderate') {
          advice = `Sub-plot ${zoneId} shows moderate growth. Maintain regular watering schedule.`;
        }

        cells.push({
          id: idx,
          row: r + 1,
          col: c + 1,
          rowLabel: rowLabels[r],
          zoneId,
          ndvi: parseFloat(cellNdvi.toFixed(3)),
          status,
          statusLabel,
          bgStyle,
          moisture,
          advice
        });
      }
    }
    return cells;
  }, [meanNdvi]);

  const activeCell = hoveredCell || selectedCell || gridMatrix[10];

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-2xl space-y-6 text-foreground">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GridIcon className="text-emerald-400" size={18} />
            <h3 className="text-lg font-black tracking-tight text-white">Crop Health Sub-Plot Grid</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            8x6 Spatial Resolution Matrix · 48 Micro-Plot NDVI Analysis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold text-emerald-400">
            Mean NDVI: {meanNdvi.toFixed(3)}
          </div>
        </div>
      </div>

      {/* 8x6 Rounded Pixel Matrix Grid Container */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-inner">
        <div className="grid grid-cols-8 gap-2 aspect-[4/3] sm:aspect-[16/10] w-full">
          {gridMatrix.map((cell) => {
            const isHovered = hoveredCell?.id === cell.id;
            const isSelected = selectedCell?.id === cell.id;

            return (
              <motion.button
                key={cell.id}
                whileHover={{ scale: 1.08, zIndex: 10 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setHoveredCell(cell)}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => {
                  setSelectedCell(cell);
                  if (onZoneSelect) onZoneSelect(cell);
                }}
                className={`relative w-full h-full rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400/50 cursor-pointer overflow-hidden ${
                  isSelected ? 'ring-2 ring-white scale-105 shadow-xl z-20' : ''
                }`}
                style={{ backgroundColor: cell.bgStyle }}
                title={`${cell.zoneId}: NDVI ${cell.ndvi} (${cell.statusLabel})`}
              >
                {/* Micro Cell Highlight Border */}
                <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />

                {/* Sub-zone Label Overlay on hover/select */}
                {(isHovered || isSelected) && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-1 text-center">
                    <span className="text-[9px] font-black text-white leading-none font-mono">
                      {cell.rowLabel}{cell.col}
                    </span>
                    <span className="text-[8px] font-mono font-bold text-emerald-300 mt-0.5">
                      {cell.ndvi}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Legend Bar (Matching screenshot exactly) */}
      <div className="flex items-center gap-6 pt-2 border-t border-slate-800/80 text-xs font-bold text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
          <span>Stressed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span>Healthy</span>
        </div>
      </div>

      {/* Active Sub-Plot Inspection Card */}
      {activeCell && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCell.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-white text-xs shadow-lg"
                style={{ backgroundColor: activeCell.bgStyle }}
              >
                {activeCell.rowLabel}{activeCell.col}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">{activeCell.zoneId}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      activeCell.status === 'healthy'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : activeCell.status === 'moderate'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {activeCell.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{activeCell.advice}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Sub-Plot NDVI</div>
                <div className="text-lg font-black font-mono text-emerald-400">{activeCell.ndvi}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Soil Moisture</div>
                <div className="text-lg font-black font-mono text-cyan-400">{activeCell.moisture}%</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
