'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { GripVertical } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type LineItem = {
  id: string;
  description: string;
  quantity: string;
  unit: string | null;
  unitPrice: string;
  sortOrder: number;
};

type MarkupRow = {
  id: string;
  label: string;
  percentage: string;
  sortOrder: number;
};

type MarkupRowWithAmount = MarkupRow & { amount: number };

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const EDITABLE_COLS = ['description', 'quantity', 'unit', 'unitPrice'] as const;
type EditableCol = (typeof EDITABLE_COLS)[number];

const UNIT_OPTIONS = ['CY', 'LF', 'SY', 'LS', 'EA', 'TON', 'HR'];

function fmt(val: string | number): string {
  const n = typeof val === 'string' ? Number.parseFloat(val) : val;
  if (Number.isNaN(n)) {
    return '$0.00';
  }
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function fmtQty(val: string): string {
  const n = Number.parseFloat(val);
  if (Number.isNaN(n) || n === 0) {
    return '';
  }
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcTotal(row: LineItem): number {
  const qty = Number.parseFloat(row.quantity);
  const up = Number.parseFloat(row.unitPrice);
  return Number.isNaN(qty) || Number.isNaN(up) ? 0 : qty * up;
}

const monoStyle = { fontFamily: '\'JetBrains Mono\', monospace' } as const;

type CellInputProps = {
  editValue: string;
  rowId: string;
  colId: EditableCol;
  numeric?: boolean;
  onValueChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent, rowId: string, colId: EditableCol) => void;
  onBlur: () => void;
};

function CellInput({ editValue, rowId, colId, numeric, onValueChange, onKeyDown, onBlur }: CellInputProps) {
  return (
    <input
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
      className={`size-full border-none bg-transparent p-0 text-sm leading-8 outline-none${numeric ? ' text-right' : ''}`}
      style={numeric ? monoStyle : undefined}
      value={editValue}
      onChange={e => onValueChange(e.target.value)}
      onKeyDown={e => onKeyDown(e, rowId, colId)}
      onBlur={onBlur}
    />
  );
}

type UnitCellInputProps = {
  editValue: string;
  rowId: string;
  onValueChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent, rowId: string, colId: EditableCol) => void;
  onBlur: () => void;
};

function UnitCellInput({ editValue, rowId, onValueChange, onKeyDown, onBlur }: UnitCellInputProps) {
  return (
    <>
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        list="mana-unit-options"
        className="size-full border-none bg-transparent p-0 text-sm uppercase leading-8 outline-none"
        value={editValue}
        onChange={e => onValueChange(e.target.value.toUpperCase())}
        onKeyDown={e => onKeyDown(e, rowId, 'unit')}
        onBlur={onBlur}
      />
      <datalist id="mana-unit-options">
        {UNIT_OPTIONS.map(u => (
          <option key={u} value={u} />
        ))}
      </datalist>
    </>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-stone-100">
      <td className="h-8 px-3">
        <div className="size-3 animate-pulse rounded bg-stone-100" />
      </td>
      <td className="h-8 px-3">
        <div className="h-3 w-52 animate-pulse rounded bg-stone-100" />
      </td>
      <td className="h-8 px-3">
        <div className="ml-auto h-3 w-10 animate-pulse rounded bg-stone-100" />
      </td>
      <td className="h-8 px-3">
        <div className="h-3 w-8 animate-pulse rounded bg-stone-100" />
      </td>
      <td className="h-8 px-3">
        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-stone-100" />
      </td>
      <td className="h-8 px-3">
        <div className="ml-auto h-3 w-20 animate-pulse rounded bg-stone-100" />
      </td>
      <td className="h-8 px-2" />
    </tr>
  );
}

type SortableRowProps = {
  row: LineItem;
  rowIdx: number;
  editingCell: { rowId: string; colId: EditableCol } | null;
  editValue: string;
  setEditValue: (v: string) => void;
  openCell: (rowId: string, colId: EditableCol, val: string) => void;
  handleKeyDown: (e: React.KeyboardEvent, rowId: string, colId: EditableCol) => Promise<void>;
  handleBlur: () => void;
  deleteRow: (id: string) => void;
};

function SortableRow({
  row,
  rowIdx,
  editingCell,
  editValue,
  setEditValue,
  openCell,
  handleKeyDown,
  handleBlur,
  deleteRow,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });

  const isEditingRow = editingCell?.rowId === row.id;
  const cellBtnBase = 'block w-full text-left bg-transparent border-none p-0 text-sm cursor-text';

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: isDragging ? 'relative' : undefined,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="group border-b border-stone-100 last:border-0 hover:bg-stone-50/60"
    >
      {/* Drag handle */}
      <td className="h-8 w-6 px-1 align-middle">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="flex size-5 cursor-grab items-center justify-center text-stone-300 opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={13} />
        </button>
      </td>

      {/* # */}
      <td className="size-8 select-none px-1 text-right align-middle text-xs text-stone-400">
        {rowIdx + 1}
      </td>

      {/* Description */}
      <td className="h-8 min-w-[200px] px-3 align-middle">
        {isEditingRow && editingCell.colId === 'description'
          ? (
              <CellInput
                editValue={editValue}
                rowId={row.id}
                colId="description"
                onValueChange={setEditValue}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
              />
            )
          : (
              <button
                type="button"
                className={`${cellBtnBase} truncate`}
                onClick={() => openCell(row.id, 'description', row.description)}
              >
                {row.description || <span className="text-stone-300">Description…</span>}
              </button>
            )}
      </td>

      {/* Qty */}
      <td className="h-8 px-3 align-middle">
        {isEditingRow && editingCell.colId === 'quantity'
          ? (
              <CellInput
                editValue={editValue}
                rowId={row.id}
                colId="quantity"
                numeric
                onValueChange={setEditValue}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
              />
            )
          : (
              <button
                type="button"
                className={`${cellBtnBase} text-right`}
                style={monoStyle}
                onClick={() => openCell(row.id, 'quantity', row.quantity)}
              >
                {fmtQty(row.quantity) || <span className="text-stone-300">0.00</span>}
              </button>
            )}
      </td>

      {/* Unit */}
      <td className="h-8 px-3 align-middle">
        {isEditingRow && editingCell.colId === 'unit'
          ? (
              <UnitCellInput
                editValue={editValue}
                rowId={row.id}
                onValueChange={setEditValue}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
              />
            )
          : (
              <button
                type="button"
                className={`${cellBtnBase} uppercase`}
                onClick={() => openCell(row.id, 'unit', row.unit ?? '')}
              >
                {row.unit || <span className="text-stone-300">—</span>}
              </button>
            )}
      </td>

      {/* Unit Price */}
      <td className="h-8 px-3 align-middle">
        {isEditingRow && editingCell.colId === 'unitPrice'
          ? (
              <CellInput
                editValue={editValue}
                rowId={row.id}
                colId="unitPrice"
                numeric
                onValueChange={setEditValue}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
              />
            )
          : (
              <button
                type="button"
                className={`${cellBtnBase} text-right`}
                style={monoStyle}
                onClick={() => openCell(row.id, 'unitPrice', row.unitPrice)}
              >
                {fmt(row.unitPrice)}
              </button>
            )}
      </td>

      {/* Total */}
      <td className="h-8 px-3 text-right align-middle">
        <span className="font-semibold" style={monoStyle}>
          {fmt(calcTotal(row))}
        </span>
      </td>

      {/* Delete */}
      <td className="h-8 px-2 align-middle">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Delete row"
          className="flex size-5 items-center justify-center text-lg leading-none text-stone-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          onClick={() => deleteRow(row.id)}
        >
          ×
        </button>
      </td>
    </tr>
  );
}

export function EstimateTable({ estimateId, projectName }: { estimateId: string; projectName: string }) {
  const [rows, setRows] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: EditableCol } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [exporting, setExporting] = useState(false);

  const [markupRows, setMarkupRows] = useState<MarkupRow[]>([]);
  const [markupEditId, setMarkupEditId] = useState<string | null>(null);
  const [markupEditValue, setMarkupEditValue] = useState('');
  const markupDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatches = useRef<Map<string, Partial<LineItem>>>(new Map());
  const startValueRef = useRef<string>('');
  const skipBlurRef = useRef(false);
  const failedPatchesRef = useRef<Map<string, Partial<LineItem>>>(new Map());
  const printViewRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setLoading(true);
    fetch(`/api/estimates/${estimateId}/line-items`)
      .then(r => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRows(data);
        }
      })
      .finally(() => setLoading(false));
  }, [estimateId]);

  useEffect(() => {
    fetch(`/api/estimates/${estimateId}/markup-rows`)
      .then(r => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMarkupRows(data);
        }
      });
  }, [estimateId]);

  const saveMarkupPct = useCallback((id: string, pct: string) => {
    if (markupDebounceTimer.current) {
      clearTimeout(markupDebounceTimer.current);
    }
    markupDebounceTimer.current = setTimeout(() => {
      fetch(`/api/markup-rows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage: pct }),
      });
    }, 500);
  }, []);

  const flushSaves = useCallback(async (patches: [string, Partial<LineItem>][]) => {
    setSaveStatus('saving');
    try {
      const results = await Promise.all(
        patches.map(([rowId, p]) =>
          fetch(`/api/line-items/${rowId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          }).then((r) => {
            if (!r.ok) {
              throw new Error(`${r.status}`);
            }
            return r;
          }),
        ),
      );
      // all succeeded
      void results;
      failedPatchesRef.current.clear();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(s => (s === 'saved' ? 'idle' : s)), 2000);
    } catch {
      // store failed patches for retry
      patches.forEach(([id, p]) => {
        const existing = failedPatchesRef.current.get(id) ?? {};
        failedPatchesRef.current.set(id, { ...existing, ...p });
      });
      setSaveStatus('error');
    }
  }, []);

  const scheduleSave = useCallback((id: string, patch: Partial<LineItem>) => {
    const existing = pendingPatches.current.get(id) ?? {};
    pendingPatches.current.set(id, { ...existing, ...patch });

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setSaveStatus('saving');
    debounceTimer.current = setTimeout(async () => {
      const saves = Array.from(pendingPatches.current.entries());
      pendingPatches.current.clear();
      await flushSaves(saves);
    }, 500);
  }, [flushSaves]);

  const retryFailedSaves = useCallback(async () => {
    const patches = Array.from(failedPatchesRef.current.entries());
    if (patches.length === 0) {
      return;
    }
    failedPatchesRef.current.clear();
    await flushSaves(patches);
  }, [flushSaves]);

  const exportPDF = useCallback(async () => {
    if (!printViewRef.current || exporting) {
      return;
    }
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF: JsPDF } = await import('jspdf');
      const canvas = await html2canvas(printViewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const imgH = (canvas.height / canvas.width) * pageW;
      let remaining = imgH;
      let y = 0;
      doc.addImage(imgData, 'PNG', 0, y, pageW, imgH);
      remaining -= pageH;
      while (remaining > 0) {
        y -= pageH;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, y, pageW, imgH);
        remaining -= pageH;
      }
      const dateStr = new Date().toISOString().slice(0, 10);
      const safeName = projectName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      doc.save(`${safeName}-estimate-${dateStr}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [exporting, projectName]);

  const applyEdit = useCallback(
    (rowId: string, colId: EditableCol, val: string) => {
      setRows(prev => prev.map(r => (r.id === rowId ? { ...r, [colId]: val } : r)));
      scheduleSave(rowId, { [colId]: val } as Partial<LineItem>);
    },
    [scheduleSave],
  );

  const openCell = useCallback((rowId: string, colId: EditableCol, currentVal: string) => {
    startValueRef.current = currentVal;
    setEditingCell({ rowId, colId });
    setEditValue(currentVal);
  }, []);

  const commitAndMove = useCallback(
    (next: { rowId: string; colId: EditableCol } | null) => {
      if (editingCell) {
        applyEdit(editingCell.rowId, editingCell.colId, editValue);
      }
      if (next) {
        setRows((prev) => {
          const row = prev.find(r => r.id === next.rowId);
          if (row) {
            const val = (row[next.colId] ?? '') as string;
            startValueRef.current = val;
            setEditValue(val);
          }
          return prev;
        });
        setEditingCell(next);
      } else {
        setEditingCell(null);
      }
    },
    [editingCell, editValue, applyEdit],
  );

  const addRow = useCallback(async (): Promise<LineItem> => {
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sortOrder), -1);
    const res = await fetch(`/api/estimates/${estimateId}/line-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sortOrder: maxOrder + 1 }),
    });
    const newRow: LineItem = await res.json();
    setRows(prev => [...prev, newRow]);
    return newRow;
  }, [estimateId, rows]);

  const deleteRow = useCallback(async (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
    await fetch(`/api/line-items/${id}`, { method: 'DELETE' });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setRows((prev) => {
      const oldIdx = prev.findIndex(r => r.id === active.id);
      const newIdx = prev.findIndex(r => r.id === over.id);
      const reordered = arrayMove(prev, oldIdx, newIdx).map((r, i) => ({ ...r, sortOrder: i }));
      // Persist new order (batched via existing debounce)
      reordered.forEach(r => scheduleSave(r.id, { sortOrder: r.sortOrder }));
      return reordered;
    });
  }, [scheduleSave]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent, rowId: string, colId: EditableCol) => {
      const rowIdx = rows.findIndex(r => r.id === rowId);
      const colIdx = EDITABLE_COLS.indexOf(colId);

      switch (e.key) {
        case 'Escape': {
          e.preventDefault();
          applyEdit(rowId, colId, startValueRef.current);
          skipBlurRef.current = true;
          setEditingCell(null);
          break;
        }
        case 'Tab': {
          e.preventDefault();
          skipBlurRef.current = true;
          if (!e.shiftKey) {
            if (colIdx < EDITABLE_COLS.length - 1) {
              commitAndMove({ rowId, colId: EDITABLE_COLS[colIdx + 1]! });
            } else if (rowIdx < rows.length - 1) {
              commitAndMove({ rowId: rows[rowIdx + 1]!.id, colId: EDITABLE_COLS[0]! });
            } else {
              // Tab on last cell of last row → create new row
              applyEdit(rowId, colId, editValue);
              setEditingCell(null);
              const newRow = await addRow();
              skipBlurRef.current = true;
              startValueRef.current = '';
              setEditValue('');
              setEditingCell({ rowId: newRow.id, colId: EDITABLE_COLS[0]! });
            }
          } else {
            if (colIdx > 0) {
              commitAndMove({ rowId, colId: EDITABLE_COLS[colIdx - 1]! });
            } else if (rowIdx > 0) {
              commitAndMove({ rowId: rows[rowIdx - 1]!.id, colId: EDITABLE_COLS[EDITABLE_COLS.length - 1]! });
            } else {
              commitAndMove(null);
            }
          }
          break;
        }
        case 'Enter':
        case 'ArrowDown': {
          e.preventDefault();
          skipBlurRef.current = true;
          if (rowIdx < rows.length - 1) {
            commitAndMove({ rowId: rows[rowIdx + 1]!.id, colId });
          } else if (e.key === 'Enter') {
            // Enter on last row → create new row
            applyEdit(rowId, colId, editValue);
            setEditingCell(null);
            const newRow = await addRow();
            skipBlurRef.current = true;
            startValueRef.current = '';
            setEditValue('');
            setEditingCell({ rowId: newRow.id, colId: EDITABLE_COLS[0]! });
          } else {
            commitAndMove(null);
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          skipBlurRef.current = true;
          if (rowIdx > 0) {
            commitAndMove({ rowId: rows[rowIdx - 1]!.id, colId });
          }
          break;
        }
      }
    },
    [rows, applyEdit, editValue, commitAndMove, addRow],
  );

  const handleBlur = useCallback(() => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    if (editingCell) {
      applyEdit(editingCell.rowId, editingCell.colId, editValue);
      setEditingCell(null);
    }
  }, [editingCell, editValue, applyEdit]);

  const table = useReactTable({
    data: rows,
    columns: [],
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.id,
  });

  const subtotal = rows.reduce((sum, r) => sum + calcTotal(r), 0);

  const markupChain: MarkupRowWithAmount[] = useMemo(() => {
    const sorted = [...markupRows].sort((a, b) => a.sortOrder - b.sortOrder);
    let running = subtotal;
    return sorted.map((r) => {
      const pct = Number.parseFloat(r.percentage) || 0;
      const amount = running * (pct / 100);
      running += amount;
      return { ...r, amount };
    });
  }, [markupRows, subtotal]);

  const grandTotal = subtotal + markupChain.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="relative w-full">
      {/* Header bar: export button + save status */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={exportPDF}
          disabled={exporting || loading}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#C2410C' }}
        >
          {exporting
            ? (
                <>
                  <svg className="size-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Generating…
                </>
              )
            : (
                <>
                  <svg className="size-3" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a.5.5 0 0 1 .5.5v8.793l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V.5A.5.5 0 0 1 8 0zM1 13.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5z" />
                  </svg>
                  Export PDF
                </>
              )}
        </button>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="animate-pulse text-xs text-stone-400">Saving…</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600">Saved</span>
          )}
          {saveStatus === 'error' && (
            <>
              <span className="text-xs text-red-500">Save failed</span>
              <button
                type="button"
                onClick={retryFailedSaves}
                className="text-xs text-red-500 underline hover:text-red-700"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              {/* drag handle col */}
              <th className="w-6" />
              {(['#', 'Description', 'Qty', 'Unit', 'Unit Price', 'Total', ''] as const).map((h, i) => (
                <th
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  className="h-8 whitespace-nowrap px-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
                  style={{
                    width: i === 0 ? 32 : i === 2 ? 100 : i === 3 ? 72 : i === 4 ? 120 : i === 5 ? 130 : i === 6 ? 32 : undefined,
                    textAlign: i === 2 || i === 4 || i === 5 ? 'right' : undefined,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <SkeletonRow key={i} />
              ))
              : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                      {table.getRowModel().rows.map((tableRow, rowIdx) => (
                        <SortableRow
                          key={tableRow.original.id}
                          row={tableRow.original}
                          rowIdx={rowIdx}
                          editingCell={editingCell}
                          editValue={editValue}
                          setEditValue={setEditValue}
                          openCell={openCell}
                          handleKeyDown={handleKeyDown}
                          handleBlur={handleBlur}
                          deleteRow={deleteRow}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="h-16 text-center align-middle text-sm text-stone-400">
                  <span>No line items yet. </span>
                  <button
                    type="button"
                    className="font-medium text-[#C2410C] underline-offset-2 hover:underline"
                    onClick={addRow}
                  >
                    Add your first line item →
                  </button>
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            {/* Subtotal */}
            <tr className="border-t-2 border-stone-300 bg-stone-50">
              <td colSpan={6} className="h-9 px-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">
                Subtotal
              </td>
              <td className="h-9 px-3 text-right font-semibold text-stone-700" style={monoStyle}>
                {fmt(subtotal)}
              </td>
              <td />
            </tr>

            {/* Markup rows */}
            {markupChain.length > 0 && (
              <tr className="border-t border-stone-200">
                <td colSpan={8} className="p-0" />
              </tr>
            )}
            {markupChain.map(row => (
              <tr key={row.id} className="bg-stone-50/40 hover:bg-stone-50">
                <td colSpan={5} className="h-8 px-3 text-right align-middle text-sm text-stone-500">
                  {row.label}
                </td>
                <td className="h-8 px-3 align-middle">
                  <div className="flex items-center justify-end gap-0.5">
                    {markupEditId === row.id
                      ? (
                          <input
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                            className="w-14 border-none bg-transparent text-right text-sm leading-8 outline-none"
                            style={monoStyle}
                            value={markupEditValue}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMarkupEditValue(v);
                              setMarkupRows(prev => prev.map(r => r.id === row.id ? { ...r, percentage: v } : r));
                              saveMarkupPct(row.id, v);
                            }}
                            onBlur={() => setMarkupEditId(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') {
                                e.preventDefault();
                                setMarkupEditId(null);
                              }
                            }}
                          />
                        )
                      : (
                          <button
                            type="button"
                            className="w-14 cursor-text bg-transparent text-right text-sm text-stone-700 hover:text-stone-900"
                            style={monoStyle}
                            onClick={() => {
                              setMarkupEditId(row.id);
                              setMarkupEditValue(row.percentage);
                            }}
                          >
                            {Number.parseFloat(row.percentage).toFixed(1)}
                          </button>
                        )}
                    <span className="select-none text-sm text-stone-400">%</span>
                  </div>
                </td>
                <td className="h-8 px-3 text-right align-middle text-sm text-stone-600" style={monoStyle}>
                  {fmt(row.amount)}
                </td>
                <td />
              </tr>
            ))}

            {/* Grand Total */}
            <tr className="border-t-2 border-stone-400">
              <td colSpan={6} className="h-10 px-3 text-right align-middle text-sm font-bold uppercase tracking-wider" style={{ color: '#C2410C' }}>
                Grand Total
              </td>
              <td className="h-10 px-3 text-right align-middle text-base font-bold" style={{ ...monoStyle, color: '#C2410C' }}>
                {fmt(grandTotal)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-[#C2410C]"
      >
        <span className="text-base font-bold leading-none">+</span>
        {' '}
        Add Row
      </button>

      {/* Hidden print view — captured by html2canvas for PDF export */}
      <div
        ref={printViewRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '800px',
          backgroundColor: '#ffffff',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: '13px',
          color: '#1c1917',
          padding: '48px 56px',
          boxSizing: 'border-box',
          lineHeight: '1.5',
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '3px solid #C2410C', paddingBottom: '20px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#C2410C', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Robertson Civil
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1c1917', marginTop: '6px' }}>
                {projectName}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#78716c' }}>
              <div style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '11px' }}>
                Estimate
              </div>
              <div style={{ marginTop: '4px' }}>
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Line items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#fafaf9', borderBottom: '2px solid #e7e5e4' }}>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#78716c', width: '36px' }}>#</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#78716c' }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#78716c', width: '80px' }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#78716c', width: '56px' }}>Unit</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#78716c', width: '110px' }}>Unit Price</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#78716c', width: '110px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#a8a29e', fontSize: '12px' }}>{idx + 1}</td>
                <td style={{ padding: '8px 10px' }}>{row.description}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtQty(row.quantity)}</td>
                <td style={{ padding: '8px 10px', textTransform: 'uppercase', fontSize: '12px' }}>{row.unit ?? ''}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(row.unitPrice)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmt(calcTotal(row))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #d6d3d1', backgroundColor: '#fafaf9' }}>
              <td colSpan={5} style={{ padding: '10px 10px', textAlign: 'right', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#78716c' }}>
                Subtotal
              </td>
              <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#1c1917' }}>
                {fmt(subtotal)}
              </td>
            </tr>
            {markupChain.map(row => (
              <tr key={row.id} style={{ borderTop: '1px solid #e7e5e4' }}>
                <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right', color: '#78716c' }}>{row.label}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#78716c', fontFamily: 'monospace' }}>
                  {Number.parseFloat(row.percentage).toFixed(1)}
                  %
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#44403c' }}>
                  {fmt(row.amount)}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid #a8a29e' }}>
              <td colSpan={5} style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#C2410C' }}>
                Grand Total
              </td>
              <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '16px', color: '#C2410C' }}>
                {fmt(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '12px', borderTop: '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a8a29e' }}>
          <span>Generated by Mana</span>
          <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}
