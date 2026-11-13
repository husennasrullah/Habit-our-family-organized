"use client";

import type { ShoppingItem } from "@/types";
import { QueryError } from "@/components/shared/QueryError";
import { useState, useRef } from "react";
import { Plus, Check, Trash2, ShoppingCart, Loader2 } from "lucide-react";
// import { cn } from "@/lib/utils";
import {
  useShoppingItems,
  useCreateShoppingItem,
  useToggleShoppingItem,
  useDeleteShoppingItem,
  useClearCheckedItems,
} from "@/hooks/useBudget";
import { toast } from "sonner";

export function ShoppingList({
  onCheckout,
}: {
  onCheckout: (items: ShoppingItem[]) => void;
}) {
  const [newItem, setNewItem] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading, isError, refetch } = useShoppingItems();
  const createItem = useCreateShoppingItem();
  const toggleItem = useToggleShoppingItem();
  const deleteItem = useDeleteShoppingItem();
  const clearChecked = useClearCheckedItems();

  const unchecked = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

  const handleAdd = async () => {
    const name = newItem.trim();
    if (!name) return;
    try {
      await createItem.mutateAsync({ name });
      setNewItem("");
      inputRef.current?.focus();
    } catch {
      toast.error("Gagal menambahkan item");
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Hapus semua item belanja yang sudah dicentang?"))
      return;
    try {
      await clearChecked.mutateAsync();
      toast.success("Item tercentang dihapus");
    } catch {
      toast.error("Gagal menghapus item");
    }
  };

  if (isError) return <QueryError retry={() => void refetch()} />;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-foreground">
            Daftar Belanja
          </h3>
          {items.length > 0 && (
            <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-600">
              {unchecked.length}
            </span>
          )}
        </div>
        {checked.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearChecked.isPending}
            className="text-xs font-medium text-muted-foreground hover:text-error-600 transition-colors"
          >
            {clearChecked.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Hapus tercentang"
            )}
          </button>
        )}
      </div>

      {checked.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-primary-50 px-4 py-3 dark:bg-primary-950">
          <p className="text-sm">
            {checked.length} item siap dicatat. Isi total sesuai struk.
          </p>
          <button
            onClick={() => onCheckout(checked)}
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Selesaikan belanja
          </button>
        </div>
      )}
      {/* Add item */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <input
          ref={inputRef}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          aria-label="Item belanja baru"
          placeholder="Tambah item belanja..."
          className="flex-1 bg-transparent py-1 text-sm text-foreground placeholder-neutral-400 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim() || createItem.isPending}
          className="rounded-lg bg-primary-500 p-1.5 text-white hover:bg-primary-600 disabled:opacity-40 transition-colors"
          aria-label="Tambah"
        >
          {createItem.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Item list */}
      <ul className="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
        {isLoading ? (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">
            Memuat...
          </li>
        ) : items.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            Daftar belanja kosong
          </li>
        ) : (
          <>
            {unchecked.map((item) => (
              <li
                key={item.id}
                className="group flex items-center gap-3 px-4 py-2.5"
              >
                <button
                  onClick={() => toggleItem.mutate(item.id)}
                  role="checkbox"
                  aria-checked={false}
                  aria-label={`Tandai ${item.name} sudah dibeli`}
                  disabled={toggleItem.isPending}
                  className="shopping-check flex shrink-0 items-center justify-center rounded-lg p-0 hover:bg-muted disabled:opacity-50"
                >
                  <span
                    aria-hidden="true"
                    className="shopping-check-mark rounded-full border-2 border-neutral-300"
                  />
                </button>
                <span className="flex-1 text-sm text-foreground">
                  {item.name}
                  {item.quantity !== "1" && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      × {item.quantity}
                      {item.unit}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => {
                    if (window.confirm(`Hapus ${item.name}?`))
                      deleteItem.mutate(item.id);
                  }}
                  disabled={deleteItem.isPending}
                  className="opacity-100 rounded p-1 text-muted-foreground hover:text-error-600 transition-all"
                  aria-label="Hapus"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}

            {checked.map((item) => (
              <li
                key={item.id}
                className="group flex items-center gap-3 px-4 py-2 bg-muted/60"
              >
                <button
                  onClick={() => toggleItem.mutate(item.id)}
                  role="checkbox"
                  aria-checked={true}
                  disabled={toggleItem.isPending}
                  className="shopping-check flex shrink-0 items-center justify-center rounded-lg p-0 hover:bg-muted disabled:opacity-50"
                  aria-label={`Tandai ${item.name} belum dibeli`}
                >
                  <span
                    aria-hidden="true"
                    className="shopping-check-mark flex items-center justify-center rounded-full bg-primary-600"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </span>
                </button>
                <span className="flex-1 text-sm text-muted-foreground line-through">
                  {item.name}
                </span>
                <button
                  onClick={() => {
                    if (window.confirm(`Hapus ${item.name}?`))
                      deleteItem.mutate(item.id);
                  }}
                  disabled={deleteItem.isPending}
                  className="opacity-100 rounded p-1 text-muted-foreground hover:text-error-600 transition-all"
                  aria-label="Hapus"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  );
}
