import { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  render?: (row: any) => any;
  // Excluded from drag-and-drop reordering even when onReorderColumns is set
  // — e.g. an "Actions" column that should always stay pinned last.
  noReorder?: boolean;
}

interface TableProps {
  columns: Column[];
  data: any[];
  keyField?: string;
  // Optional — when provided, column headers become drag handles and this is
  // called with the full new column-key order on drop. Omit for the default,
  // unchanged behavior (used by every other Table in the app today).
  onReorderColumns?: (newColumnKeyOrder: string[]) => void;
  // Optional — extra classes appended to a row's <tr>, e.g. to highlight rows
  // that fail a validation check. Omit for the default, unstyled row.
  rowClassName?: (row: any) => string;
}

const ALIGN_CLASS = { left: "text-left", center: "text-center", right: "text-right" };

// Distance from the scroll container's edge (px) within which dragging
// triggers auto-scroll, and how many px it scrolls per animation frame.
const AUTO_SCROLL_EDGE = 56;
const AUTO_SCROLL_SPEED = 14;

export default function Table({ columns, data, keyField = "id", onReorderColumns, rowClassName }: TableProps) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [scrollDirection, setScrollDirection] = useState<"left" | "right" | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Runs continuously (not just on dragover ticks) so holding near an edge
  // keeps scrolling even if the pointer stops moving — a plain onDragOver
  // handler alone only fires while the browser reports drag movement, which
  // reads as "stuck" the moment you hold still near the edge to let it scroll.
  useEffect(() => {
    if (!scrollDirection) return;
    let frameId: number;
    const step = () => {
      const el = scrollContainerRef.current;
      if (el) el.scrollLeft += scrollDirection === "left" ? -AUTO_SCROLL_SPEED : AUTO_SCROLL_SPEED;
      frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [scrollDirection]);

  function stopDrag() {
    setDragKey(null);
    setDragOverKey(null);
    setScrollDirection(null);
  }

  function handleContainerDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!dragKey) return;
    e.preventDefault();
    const el = scrollContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (e.clientX - rect.left < AUTO_SCROLL_EDGE) setScrollDirection("left");
    else if (rect.right - e.clientX < AUTO_SCROLL_EDGE) setScrollDirection("right");
    else setScrollDirection(null);
  }

  function handleDrop(targetKey: string) {
    if (onReorderColumns && dragKey && dragKey !== targetKey) {
      const order = columns.map((c) => c.key);
      const fromIdx = order.indexOf(dragKey);
      const toIdx = order.indexOf(targetKey);
      if (fromIdx !== -1 && toIdx !== -1) {
        const next = [...order];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        onReorderColumns(next);
      }
    }
    stopDrag();
  }

  return (
    <div
      ref={scrollContainerRef}
      onDragOver={onReorderColumns ? handleContainerDragOver : undefined}
      className="overflow-x-auto rounded-2xl border border-border bg-surface"
    >
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {columns.map((col) => {
              const reorderable = !!onReorderColumns && !col.noReorder;
              return (
                <th
                  key={col.key}
                  draggable={reorderable}
                  onDragStart={reorderable ? () => setDragKey(col.key) : undefined}
                  onDragOver={
                    reorderable
                      ? (e) => {
                          e.preventDefault();
                          if (dragOverKey !== col.key) setDragOverKey(col.key);
                        }
                      : undefined
                  }
                  onDrop={
                    reorderable
                      ? (e) => {
                          e.preventDefault();
                          handleDrop(col.key);
                        }
                      : undefined
                  }
                  onDragEnd={reorderable ? stopDrag : undefined}
                  className={`whitespace-nowrap px-4 py-3 font-semibold text-text-muted transition-colors ${ALIGN_CLASS[col.align || "left"]} ${
                    reorderable ? "cursor-grab select-none" : ""
                  } ${dragOverKey === col.key && dragKey !== col.key ? "bg-brand-soft" : ""}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {reorderable && <GripVertical size={12} className="shrink-0 text-text-muted/60" />}
                    {col.label}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row[keyField]}
              className={`border-b border-border last:border-0 hover:bg-surface-2/60 ${rowClassName ? rowClassName(row) : ""}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`whitespace-nowrap px-4 py-3 align-middle text-text ${ALIGN_CLASS[col.align || "left"]}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
