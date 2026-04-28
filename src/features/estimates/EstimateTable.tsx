'use client';

import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useCallback, useEffect, useRef, useState } from 'react';

type LineItem = {
  id: string;
  description: string;
  quantity: string;
  unit: string | null;
  unitPrice: string;
  sortOrder: number;
};

type SaveStatus = 'idle' | 'saving' | 'saved';

const EDITABLE_COLS = ['description', 'quantity', 'unit', 'unitPrice'] as const;
type EditableCol = (typeof EDITABLE_COLS)[number];

function fmt(val: string | number): string {
  const n = typeof val === 'string' ? Number.parseFloat(val) : val;
  if (Number.isNaN(n)) {
    return '$0.00';
  }
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function calcTotal(row: LineItem): number {
  const qty = Number.parseFloat(row.quantity);
  const up = Number.parseFloat(row.unitPrice);
  return Number.isNaN(qty) || Number.isNaN(up) ? 0 : qty * up;
}

function displayQty(val: string): string {
  const n = Number.parseFloat(val);
  if (Number.isNaN(n) || n === 0) {
    return '';
  }
  return n % 1 === 0 ? String(Math.trunc(n)) : val;
}

const monoStyle = { fontFamily: '\'JetBrains Mono\', monospace' } as const;

// Defined at module level to satisfy react/no-nested-components
type CellInputProps = {
  editValue: string;
  rowId: string;
  colId: EditableCol;
  numeric?: boolean;
  upper?: boolean;
  onValueChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent, rowId: string, colId: EditableCol) => void;
  onBlur: () => void;
};

function CellInput({
  editValue,
  rowId,
  colId,
  numeric,
  upper,
  onValueChange,
  onKeyDown,
  onBlur,
}: CellInputProps) {
  return (
    <input
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
      className={`size-full border-none bg-transparent p-0 text-sm leading-8 outline-none${numeric ? ' text-right' : ''}`}
      style={numeric ? monoStyle : undefined}
      value={editValue}
      onChange={(e) => {
        const v = upper ? e.target.value.toUpperCase() : e.target.value;
        onValueChange(v);
      }}
      onKeyDown={e => onKeyDown(e, rowId, colId)}
      onBlur={onBlur}
    />
  );
}

export function EstimateTable({ estimateId }: { estimateId: string }) {
  const [rows, setRows] = useState<LineItem[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: EditableCol } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatches = useRef<Map<string, Partial<LineItem>>>(new Map());
  const startValueRef = useRef<string>('');
  const skipBlurRef = useRef(false);

  useEffect(() => {
    fetch(`/api/estimates/${estimateId}/line-items`)
      .then(r => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRows(data);
        }
      });
  }, [estimateId]);

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
      await Promise.all(
        saves.map(([rowId, p]) =>
          fetch(`/api/line-items/${rowId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          }),
        ),
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  }, []);

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
              commitAndMove({
                rowId: rows[rowIdx - 1]!.id,
                colId: EDITABLE_COLS[EDITABLE_COLS.length - 1]!,
              });
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

  const grandTotal = rows.reduce((sum, r) => sum + calcTotal(r), 0);

  const cellBtnBase = 'block w-full text-left bg-transparent border-none p-0 text-sm cursor-text';

  return (
    <div className="w-full">
      <div className="mb-1 flex h-5 justify-end">
        {saveStatus === 'saving' && (
          <span className="animate-pulse text-xs text-stone-400">Saving…</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-xs text-green-600">Saved</span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              {(['#', 'Description', 'Qty', 'Unit', 'Unit Price', 'Total', ''] as const).map(
                (h, i) => (
                  <th
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="h-8 whitespace-nowrap px-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
                    style={{
                      width: i === 0 ? 40 : i === 2 ? 90 : i === 3 ? 72 : i === 4 ? 120 : i === 5 ? 130 : i === 6 ? 32 : undefined,
                      textAlign: i === 2 || i === 4 || i === 5 ? 'right' : undefined,
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {table.getRowModel().rows.map((tableRow, rowIdx) => {
              const row = tableRow.original;
              const isEditingRow = editingCell?.rowId === row.id;

              return (
                <tr
                  key={row.id}
                  className="group border-b border-stone-100 last:border-0 hover:bg-stone-50/60"
                >
                  {/* # */}
                  <td className="h-8 select-none px-3 text-right align-middle text-xs text-stone-400">
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
                            {row.description || (
                              <span className="text-stone-300">Description…</span>
                            )}
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
                            {displayQty(row.quantity) || (
                              <span className="text-stone-300">0</span>
                            )}
                          </button>
                        )}
                  </td>

                  {/* Unit */}
                  <td className="h-8 px-3 align-middle">
                    {isEditingRow && editingCell.colId === 'unit'
                      ? (
                          <CellInput
                            editValue={editValue}
                            rowId={row.id}
                            colId="unit"
                            upper
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

                  {/* Total (computed, read-only) */}
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
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="h-12 text-center text-sm text-stone-400">
                  No line items yet —
                  {' '}
                  <button
                    type="button"
                    className="underline hover:text-[#C2410C]"
                    onClick={addRow}
                  >
                    Add Row
                  </button>
                  {' '}
                  or press Tab to start
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-stone-300 bg-stone-50">
              <td
                colSpan={5}
                className="h-8 px-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Subtotal
              </td>
              <td className="h-8 px-3 text-right font-bold" style={monoStyle}>
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
    </div>
  );
}
