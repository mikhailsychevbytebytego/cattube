import type { ReactNode } from "react";

export function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  textarea,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  textarea?: boolean;
  rows?: number;
}) {
  const classes =
    "mt-1 w-full rounded-lg border border-ct-border bg-ct-bg px-3 py-2 text-sm text-ct-text outline-none focus:border-ct-text";
  return (
    <label className="block text-sm font-medium text-ct-text">
      {label}
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={rows}
          defaultValue={defaultValue ?? ""}
          className={classes}
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue ?? ""}
          className={classes}
        />
      )}
    </label>
  );
}

export function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-ct-text">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-full bg-ct-text px-4 py-2 text-sm font-medium text-ct-inverted hover:opacity-90"
    >
      {children}
    </button>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-sm text-red-600">{error}</p>;
}

export function AdminTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ct-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-ct-chip text-ct-muted">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
