import React, { useState, useEffect } from 'react';
import { 
  Table as TableIcon, Users, Clock, ArrowRightLeft, 
  Plus, Check, X, ShieldAlert, Sparkles, Utensils,
  Layers, Box
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Table } from '../../types/index.ts';
import { FloorPlan3D } from '../3d/FloorPlan3D.tsx';
import { TiltCard3D } from '../3d/TiltCard3D.tsx';

interface Props {
  onOpenTablePOS?: (table: Table) => void;
}

export const TablesView: React.FC<Props> = ({ onOpenTablePOS }) => {
  const { currentBranch } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [viewMode, setViewMode] = useState<'3D_SPATIAL' | '2D_GRID'>('3D_SPATIAL');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [transferSource, setTransferSource] = useState<Table | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableArea, setNewTableArea] = useState<Table['area']>('Main Hall');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await api.get(`/tables?branchId=${currentBranch?.id || ''}`);
        setTables(res || []);
      } catch (err) {
        console.error('Error fetching tables:', err);
      }
    }
    fetchTables();
  }, [currentBranch]);

  const areas = ['ALL', 'Main Hall', 'Terrace', 'Lounge Bar', 'Private Dining'];

  const filteredTables = tables.filter(t => selectedArea === 'ALL' || t.area === selectedArea);

  const handleTransferTable = async () => {
    if (!transferSource || !transferTargetId) return;
    try {
      await api.post('/tables/transfer', {
        sourceTableId: transferSource.id,
        targetTableId: transferTargetId,
      });
      // Refresh
      const res = await api.get(`/tables?branchId=${currentBranch?.id || ''}`);
      setTables(res || []);
      setTransferSource(null);
      setTransferTargetId('');
    } catch (err) {
      console.error('Table transfer failed:', err);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber) return;
    try {
      const res = await api.post('/tables', {
        branch_id: currentBranch?.id,
        table_number: newTableNumber,
        area: newTableArea,
        capacity: newTableCapacity,
      });
      setTables(prev => [...prev, res]);
      setShowAddTableModal(false);
      setNewTableNumber('');
    } catch (err) {
      console.error('Failed to create table:', err);
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'FREE':
        return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400';
      case 'OCCUPIED':
        return 'border-amber-500/50 bg-amber-500/10 text-amber-300';
      case 'BILLING':
        return 'border-purple-500/50 bg-purple-500/10 text-purple-300';
      case 'RESERVED':
        return 'border-blue-500/40 bg-blue-500/5 text-blue-400';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header & Area Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Interactive Restaurant Floor Plan</h2>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {tables.length} Total Tables
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor real-time table occupancy, active sessions, and transfer guests for {currentBranch?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 3D vs 2D View Switcher */}
          <div className="flex p-0.5 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold trough-3d">
            <button
              onClick={() => setViewMode('3D_SPATIAL')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === '3D_SPATIAL'
                  ? 'btn-3d btn-3d-amber font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Spatial Floor</span>
            </button>
            <button
              onClick={() => setViewMode('2D_GRID')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === '2D_GRID'
                  ? 'btn-3d btn-3d-amber font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Grid</span>
            </button>
          </div>

          {/* Areas bar */}
          <div className="flex p-0.5 bg-slate-900 rounded-xl border border-slate-800 trough-3d">
            {areas.map(a => (
              <button
                key={a}
                onClick={() => setSelectedArea(a)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedArea === a ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddTableModal(true)}
            className="px-3.5 py-1.5 btn-3d btn-3d-slate text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Table
          </button>
        </div>
      </div>

      {/* 3D SPATIAL FLOOR PLAN VIEW */}
      {viewMode === '3D_SPATIAL' && (
        <div className="space-y-4">
          <FloorPlan3D
            tables={filteredTables}
            onOpenPOS={onOpenTablePOS}
          />
        </div>
      )}

      {/* Status Legend (Shown for 2D Grid) */}
      {viewMode === '2D_GRID' && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 trough-3d">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Status:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>FREE ({tables.filter(t => t.status === 'FREE').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>OCCUPIED ({tables.filter(t => t.status === 'OCCUPIED').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span>BILLING ({tables.filter(t => t.status === 'BILLING').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>RESERVED ({tables.filter(t => t.status === 'RESERVED').length})</span>
          </div>
        </div>
      )}

      {/* Visual Tables Grid with 3D Tilt Cards */}
      {viewMode === '2D_GRID' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredTables.map(tbl => {
            const isOccupied = tbl.status === 'OCCUPIED';
            const isBilling = tbl.status === 'BILLING';

            return (
              <TiltCard3D
                key={tbl.id}
                maxTilt={8}
                className="rounded-2xl"
              >
                <div
                  className={`p-4 rounded-2xl card-3d border transition-all flex flex-col justify-between h-full relative overflow-hidden group ${getStatusColor(tbl.status)}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-black font-mono tracking-tight text-white">
                        {tbl.table_number}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/80 font-semibold border border-slate-800">
                        {tbl.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{tbl.capacity} Seats ({tbl.area})</span>
                      </div>

                      {tbl.guest_name && (
                        <div className="text-[11px] text-amber-300 font-semibold truncate">
                          {tbl.guest_name}
                        </div>
                      )}

                      {tbl.occupied_since && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{tbl.occupied_since}</span>
                        </div>
                      )}

                      {tbl.server_name && (
                        <div className="text-[10px] text-slate-400">
                          Server: {tbl.server_name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons inside card */}
                  <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1">
                    {(isOccupied || isBilling) && (
                      <button
                        type="button"
                        onClick={() => setTransferSource(tbl)}
                        className="p-1.5 btn-3d btn-3d-slate rounded-lg text-[10px] flex items-center gap-1"
                        title="Transfer Table"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        Move
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenTablePOS && onOpenTablePOS(tbl)}
                      className="flex-1 py-1.5 px-2 btn-3d btn-3d-amber text-[11px] text-center cursor-pointer flex items-center justify-center gap-1 font-bold rounded-lg"
                    >
                      <Utensils className="w-3 h-3" />
                      {isOccupied ? 'View Order' : 'Seat & Order'}
                    </button>
                  </div>
                </div>
              </TiltCard3D>
            );
          })}
        </div>
      )}

      {/* Transfer Table Modal */}
      {transferSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                Transfer Order from {transferSource.table_number}
              </h3>
              <button
                onClick={() => setTransferSource(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select destination table to relocate active guest order and KOT tickets seamlessly.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Available Table
              </label>
              <select
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="">Select Target Table...</option>
                {tables
                  .filter(t => t.id !== transferSource.id && t.status === 'FREE')
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.table_number} ({t.area} · {t.capacity}pax)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setTransferSource(null)}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferTable}
                disabled={!transferTargetId}
                className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors disabled:opacity-40 cursor-pointer"
              >
                Execute Table Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add New Table to Floor Plan</h3>
              <button
                onClick={() => setShowAddTableModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Table Number *</label>
                <input
                  type="text"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g. T09, B05, PDR3"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Area / Zone</label>
                <select
                  value={newTableArea}
                  onChange={(e) => setNewTableArea(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="Main Hall">Main Hall</option>
                  <option value="Terrace">Terrace</option>
                  <option value="Lounge Bar">Lounge Bar</option>
                  <option value="Private Dining">Private Dining</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
