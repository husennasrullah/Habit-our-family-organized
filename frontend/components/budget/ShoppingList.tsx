"use client";

import { useState, useRef } from "react";
import { Plus, Check, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useShoppingItems,
  useCreateShoppingItem,
  useToggleShoppingItem,
  useDeleteShoppingItem,
  useClearCheckedItems,
} from "@/hooks/useBudget";
import { toast } from "sonner";

export function ShoppingList() {
  const [newItem, setNewItem] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useShoppingItems();
  const createItem  = useCreateShoppingItem();
  const toggleItem  = useToggleShoppingItem();
  const deleteItem  = useDeleteShoppingItem();
  const clearChecked = useClearCheckedItems();

  const unchecked = items.filter((i) => !i.is_checked);
  const checked   = items.filter((i) =>  i.is_checked);

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
    try {
      await clearChecked.mutateAsync();
      toast.success("Item tercentang dihapus");
    } catch {
      toast.error("Gagal menghapus item");
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-neutral-800">Daftar Belanja</h3>
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
            className="text-xs font-medium text-neutral-400 hover:text-error-600 transition-colors"
          >
            {clearChecked.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Hapus tercentang"}
          </button>
        )}
      </div>

      {/* Add item */}
      <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
        <input
          ref={inputRef}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Tambah item belanja..."
          className="flex-1 bg-transparent py-1 text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim() || createItem.isPending}
          className="rounded-lg bg-primary-500 p-1.5 text-white hover:bg-primary-600 disabled:opacity-40 transition-colors"
        >
          {createItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {/* Item list */}
      <ul className="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
        {isLoading ? (
          <li className="px-4 py-6 text-center text-sm text-neutral-400">Memuat...</li>
        ) : items.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-neutral-400">
            Daftar belanja kosong
          </li>
        ) : (
          <>
            {unchecked.map((item) => (
              <li key={item.id} className="group flex items-center gap-3 px-4 py-2.5">
                <button
                  onClick={() => toggleItem.mutate(item.id)}
                  className="flex-shrink-0 h-5 w-5 rounded-full border-2 border-neutral-300 hover:border-primary-400 transition-colors"
                />
                <span className="flex-1 text-sm text-neutral-800">
                  {item.name}
                  {item.quantity !== "1" && (
                    <span className="ml-1 text-xs text-neutral-400">× {item.quantity}{item.unit}</span>
                  )}
                </span>
                <button
                  onClick={() => deleteItem.mutate(item.id)}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 text-neutral-400 hover:text-error-600 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}

            {checked.map((item) => (
              <li key={item.id} className="group flex items-center gap-3 px-4 py-2 bg-neutral-50/60">
                <button
                  onClick={() => toggleItem.mutate(item.id)}
                  className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-success-500"
                >
                  <Check className="h-3 w-3 text-white" />
                </button>
                <span className="flex-1 text-sm text-neutral-400 line-through">{item.name}</span>
                <button
                  onClick={() => deleteItem.mutate(item.id)}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 text-neutral-400 hover:text-error-600 transition-all"
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
