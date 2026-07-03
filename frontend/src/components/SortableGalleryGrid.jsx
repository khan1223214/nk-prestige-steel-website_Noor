import React from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical, Trash } from "@phosphor-icons/react";
import { api, BACKEND_URL } from "../lib/api";
import { toast } from "sonner";

function SortableTile({ g, onToggle, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: g.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : "auto",
  };
  const src = g.file_path?.startsWith("http") ? g.file_path : `${BACKEND_URL}/api/files/${g.file_path}`;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="glass-card sharp overflow-hidden group relative select-none"
      data-testid={`gallery-admin-${g.id}`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="absolute top-1 left-1 w-8 h-8 flex items-center justify-center bg-[#0A1128]/85 border border-white/10 text-[#D4AF37] cursor-grab active:cursor-grabbing hover:bg-[#D4AF37] hover:text-[#060B14] z-10"
        data-testid={`gallery-drag-${g.id}`}
      >
        <DotsSixVertical size={14} weight="bold" />
      </button>
      <div className="aspect-square">
        {g.media_type === "video" ? (
          <video src={src} className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
        )}
      </div>
      <div className="p-3">
        <div className="text-xs text-white truncate">{g.title || "Untitled"}</div>
        <div className="text-[10px] text-[#94A3B8]">{g.category}</div>
        <div className="flex justify-between mt-2">
          <button onClick={() => onToggle(g)} className="text-[10px] text-[#D4AF37]">
            {g.visible ? "Visible ✓" : "Hidden ✗"}
          </button>
          <button onClick={() => onRemove(g.id)} className="text-[#EF4444]"><Trash size={14} /></button>
        </div>
      </div>
    </div>
  );
}

export default function SortableGalleryGrid({ items, setItems }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const persistOrder = async (list) => {
    try {
      await api.post("/gallery/reorder", { ids: list.map((g) => g.id) });
    } catch {
      toast.error("Reorder failed — refresh to see the actual order.");
    }
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((g) => g.id === active.id);
    const newIdx = items.findIndex((g) => g.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    persistOrder(next);
  };

  const toggleVisible = async (g) => {
    await api.put(`/gallery/${g.id}`, { ...g, visible: !g.visible });
    setItems((prev) => prev.map((x) => (x.id === g.id ? { ...x, visible: !g.visible } : x)));
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await api.delete(`/gallery/${id}`);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((g) => g.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="admin-gallery-grid">
          {items.map((g) => (
            <SortableTile key={g.id} g={g} onToggle={toggleVisible} onRemove={remove} />
          ))}
          {items.length === 0 && <p className="text-[#94A3B8] col-span-full">No gallery items yet — upload some!</p>}
        </div>
      </SortableContext>
    </DndContext>
  );
}
