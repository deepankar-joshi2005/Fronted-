interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  render?: (row: any) => any;
}

interface TableProps {
  columns: Column[];
  data: any[];
  keyField?: string;
}

const ALIGN_CLASS = { left: "text-left", center: "text-center", right: "text-right" };

export default function Table({ columns, data, keyField = "id" }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-semibold text-text-muted ${ALIGN_CLASS[col.align || "left"]}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[keyField]} className="border-b border-border last:border-0 hover:bg-surface-2/60">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 align-middle text-text ${ALIGN_CLASS[col.align || "left"]}`}>
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
