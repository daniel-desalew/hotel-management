import Badge from "../common/Badge";

const statusColors = {
  available: "green",
  occupied: "blue",
  reserved: "yellow",
  cleaning: "orange",
  maintenance: "purple",
  out_of_order: "red",
};

export default function RoomStatusBadge({ status }) {
  return (
    <Badge color={statusColors[status] || "gray"}>
      {status?.replace("_", " ")}
    </Badge>
  );
}
