"use client";

type ConfirmDeleteProps = {
  action: (formData: FormData) => void | Promise<void>;
  id: number;
  label: string;
};

export function ConfirmDelete({ action, id, label }: ConfirmDeleteProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${label}?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-sm font-medium text-red-600 hover:underline"
      >
        Delete
      </button>
    </form>
  );
}
