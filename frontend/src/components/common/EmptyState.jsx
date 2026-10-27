// frontend/src/components/common/EmptyState.jsx
export default function EmptyState({ icon = "📭", title, message, action }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {message && <p className="text-sm text-gray-500 mt-1">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
