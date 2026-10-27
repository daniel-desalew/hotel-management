import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { roomApi } from "../../api/roomApi";
import Loader from "../../components/common/Loader";
import RoomStatusBadge from "../../components/room/RoomStatusBadge";
import Button from "../../components/common/Button";
import toast from "react-hot-toast";

export default function RoomDetail() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await roomApi.getOne(id);
        setRoom(res.data);
      } catch (err) {
        toast.error("Room not found");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const changeStatus = async (status) => {
    try {
      const res = await roomApi.changeStatus(id, { status });
      setRoom(res.data);
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!room) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-gray-500">Room</p>
        <h1 className="text-3xl font-bold">{room.roomNumber}</h1>
        <p className="text-gray-500">Floor {room.floor}</p>
      </div>

      <div className="card space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Status</span>
          <RoomStatusBadge status={room.status} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Housekeeping</span>
          <span className="text-sm capitalize">{room.housekeepingStatus}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Room Type</span>
          <span className="text-sm">{room.roomTypeId?.name}</span>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Change Status</h3>
        <div className="flex flex-wrap gap-2">
          {[
            "available",
            "occupied",
            "cleaning",
            "maintenance",
            "out_of_order",
          ].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={room.status === s ? "primary" : "secondary"}
              onClick={() => changeStatus(s)}
            >
              {s.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
