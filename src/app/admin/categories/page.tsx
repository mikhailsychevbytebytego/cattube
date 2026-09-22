import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { AdminTable, Field, SubmitButton } from "@/components/admin/form-controls";
import { createCategory, deleteCategory, updateCategory } from "@/app/admin/actions";
import { listAdminCategories } from "@/lib/admin-catalog";

export default async function AdminCategoriesPage() {
  const rows = await listAdminCategories();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Categories</h1>
      <p className="mt-1 mb-4 text-sm text-ct-muted">
        The public home chip list always starts with All. Delete is blocked while videos still use a
        category.
      </p>
      <form action={createCategory} className="mb-6 flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Field label="Name" name="name" required />
        </div>
        <div className="w-28">
          <Field label="Sort" name="sortOrder" type="number" defaultValue={rows.length + 1} />
        </div>
        <SubmitButton>Add category</SubmitButton>
      </form>
      <AdminTable columns={["Name", "Sort", "Videos", ""]}>
        {rows.map((category) => (
          <tr key={category.id} className="border-t border-ct-border bg-ct-bg">
            <td className="px-3 py-2" colSpan={4}>
              <form action={updateCategory} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={category.id} />
                <input
                  name="name"
                  defaultValue={category.name}
                  className="w-48 rounded-lg border border-ct-border bg-ct-bg px-2 py-1 text-sm text-ct-text"
                />
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={category.sortOrder}
                  className="w-20 rounded-lg border border-ct-border bg-ct-bg px-2 py-1 text-sm text-ct-text"
                />
                <span className="text-sm text-ct-muted">{Number(category.videoCount)} videos</span>
                <button type="submit" className="text-sm font-medium hover:underline">
                  Save
                </button>
                {Number(category.videoCount) === 0 ? (
                  <ConfirmDelete action={deleteCategory} id={category.id} label={category.name} />
                ) : (
                  <span className="text-xs text-ct-muted">In use</span>
                )}
              </form>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
