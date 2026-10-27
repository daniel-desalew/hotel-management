import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { serviceRequestApi } from "../../api/serviceRequestApi";
import { hotelApi } from "../../api/hotelApi";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  hotelId: "",
  guestName: "",
  roomNumber: "",
  requestType: "room_service",
  title: "",
  description: "",
  priority: "medium",
};

export default function ServiceRequests() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await serviceRequestApi.getAll({
        hotelId: form.hotelId || user?.hotelId,
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      });
      setRequests(response?.data?.requests || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load service requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadHotels = async () => {
      try {
        const res = await hotelApi.getAll({ limit: 100 });
        setHotels(res?.data?.hotels || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadHotels();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [form.hotelId, statusFilter, user?.hotelId]);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.hotelId || !form.title || !form.description) {
      toast.error("Hotel, title and description are required");
      return;
    }

    try {
      setSubmitting(true);
      await serviceRequestApi.create(form);
      toast.success("Service request created");
      setForm(emptyForm);
      await loadRequests();
    } catch (err) {
      toast.error(err?.message || "Failed to create service request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignToMe = async (requestId) => {
    if (!user?._id) {
      toast.error("User account not available");
      return;
    }

    try {
      await serviceRequestApi.assign(requestId, { assignedTo: user._id });
      toast.success("Request assigned to you");
      await loadRequests();
    } catch (err) {
      toast.error(err?.message || "Failed to assign request");
    }
  };

  const handleComplete = async (requestId) => {
    try {
      await serviceRequestApi.complete(requestId, {
        notes: "Completed by guest services team",
      });
      toast.success("Request marked completed");
      await loadRequests();
    } catch (err) {
      toast.error(err?.message || "Failed to complete request");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guest Services</h1>
        <p className="text-sm text-gray-500">
          Handle guest requests and service follow-ups
        </p>
      </div>

      <div className="card">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Hotel</label>
            <select
              className="input"
              value={form.hotelId}
              onChange={(e) => setForm({ ...form, hotelId: e.target.value })}
            >
              <option value="">Select hotel</option>
              {hotels.map((hotel) => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Request Type</label>
            <select
              className="input"
              value={form.requestType}
              onChange={(e) =>
                setForm({ ...form, requestType: e.target.value })
              }
            >
              <option value="room_service">Room Service</option>
              <option value="laundry">Laundry</option>
              <option value="transport">Transport</option>
              <option value="concierge">Concierge</option>
              <option value="amenity">Amenity</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Guest Name</label>
            <input
              className="input"
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
              placeholder="Guest full name"
            />
          </div>

          <div>
            <label className="label">Room Number</label>
            <input
              className="input"
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              placeholder="204"
            />
          </div>

          <div>
            <label className="label">Priority</label>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="label">Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Extra pillows requested"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea
              rows="3"
              className="input"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Detailed request or guest note"
            />
          </div>

          <button
            type="submit"
            className="btn-primary md:col-span-2"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Create Request"}
          </button>
        </form>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-gray-200 p-4">
          <label className="text-sm text-gray-600">Status filter</label>
          <select
            className="input mt-2 max-w-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Guest</th>
                <th className="px-4 py-3 text-left">Request</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Loading guest requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request._id}
                    className="border-t border-gray-100 align-top"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {request.guestName || "Guest"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Room {request.roomNumber || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{request.title}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {request.requestType?.replace("_", " ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{request.priority}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          request.status === "completed"
                            ? "badge-success"
                            : request.status === "assigned" ||
                                request.status === "in_progress"
                              ? "badge-info"
                              : request.status === "cancelled"
                                ? "badge-danger"
                                : "badge-warning"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {request.status !== "completed" &&
                          request.status !== "cancelled" && (
                            <button
                              type="button"
                              className="btn-outline text-xs"
                              onClick={() => handleAssignToMe(request._id)}
                            >
                              Assign to me
                            </button>
                          )}
                        {request.status !== "completed" &&
                          request.status !== "cancelled" && (
                            <button
                              type="button"
                              className="btn-primary text-xs"
                              onClick={() => handleComplete(request._id)}
                            >
                              Complete
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
