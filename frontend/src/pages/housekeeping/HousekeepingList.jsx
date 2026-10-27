// frontend/src/pages/housekeeping/HousekeepingList.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import toast from "react-hot-toast";
import api from "../../api/axios";

const COLUMNS = [
  { id: "pending", label: "Pending", color: "bg-yellow-50 border-yellow-200" },
  {
    id: "in_progress",
    label: "In Progress",
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "completed",
    label: "Completed",
    color: "bg-green-50 border-green-200",
  },
];

function TaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task._id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">
          Room {task.roomId?.roomNumber || "—"}
        </span>
        <span className="text-xs text-gray-500 capitalize">
          {task.priority}
        </span>
      </div>
      <p className="text-xs text-gray-500 capitalize">
        {task.taskType?.replace(/_/g, " ")}
      </p>
      {task.assignedTo && (
        <p className="text-xs text-primary-600 mt-1">
          👤 {task.assignedTo.firstName} {task.assignedTo.lastName}
        </p>
      )}
    </div>
  );
}

function Column({ column, tasks }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  // ⚠️ Safety check — always pass an array to Column
  const list = Array.isArray(tasks) ? tasks : [];

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 p-4 min-h-[500px] transition-colors ${column.color} ${
        isOver ? "ring-2 ring-primary-400" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{column.label}</h3>
        <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-full">
          {list.length}
        </span>
      </div>
      <div className="space-y-2">
        {list.map((task) => (
          <TaskCard key={task._id} task={task} />
        ))}
        {list.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">No tasks</p>
        )}
      </div>
    </div>
  );
}

export default function HousekeepingList() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["housekeeping"],
    queryFn: () => api.get("/housekeeping"),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, status }) =>
      api.patch(`/housekeeping/${id}`, { status }),
    onSuccess: () => {
      toast.success("Task updated");
      qc.invalidateQueries({ queryKey: ["housekeeping"] });
    },
    onError: (e) => toast.error(e.message || "Update failed"),
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const task = tasks.find((t) => t._id === active.id);
    if (!task) return;

    const newStatus = over.id;
    if (newStatus !== task.status) {
      updateTask.mutate({ id: task._id, status: newStatus });
    }
  };

  // ⚠️ Handle BOTH response shapes: array or { tasks: [...] }
  const tasks = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.data?.tasks)
      ? data.data.tasks
      : [];

  console.log("🏠 Housekeeping data:", data); // ← debug: check console

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Housekeeping
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Drag tasks between columns to update their status
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load tasks: {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading tasks...</div>
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                column={col}
                tasks={tasks.filter((t) => t.status === col.id)}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
