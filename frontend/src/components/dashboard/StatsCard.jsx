import clsx from "clsx";

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color = "primary",
  trend,
}) {
  const colorMap = {
    primary: "bg-primary-50 text-primary-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold mt-2">{value ?? "—"}</p>
        {trend && (
          <p
            className={clsx(
              "text-xs mt-1 font-medium",
              trend > 0 ? "text-green-600" : "text-red-600",
            )}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last period
          </p>
        )}
      </div>
      {Icon && (
        <div
          className={clsx(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            colorMap[color],
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
