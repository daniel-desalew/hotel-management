import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiCheckCircle, FiClock } from "react-icons/fi";
import toast from "react-hot-toast";
import { attendanceApi } from "../../api/attendanceApi";
import { hotelApi } from "../../api/hotelApi";
import { staffApi } from "../../api/staffApi";

const EMPTY_FORM = {
  hotelId: "",
  staffId: "",
  date: new Date().toISOString().slice(0, 10),
  status: "present",
  checkIn: "",
  checkOut: "",
  notes: "",
};

export default function AttendanceList() {
  const [records, setRecords] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadHotels = async () => {
    try {
      const res = await hotelApi.getAll({ limit: 100 });
      setHotels(res?.data?.hotels || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadStaff = async (hotelId) => {
    if (!hotelId) {
      setStaff([]);
      return;
    }

    try {
      const res = await staffApi.getAll({ hotelId, limit: 100 });
      setStaff(res?.data?.staff || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRecords = async (hotelId) => {
    setLoading(true);
    try {
      const params = hotelId ? { hotelId } : {};
      const res = await attendanceApi.getAll(params);
      setRecords(res?.data?.records || []);
    } catch (error) {
      toast.error(error?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
    fetchRecords();
  }, []);

  useEffect(() => {
    const hotelId = form.hotelId;
    if (hotelId) {
      loadStaff(hotelId);
      fetchRecords(hotelId);
    } else {
      setStaff([]);
      setRecords([]);
    }
  }, [form.hotelId]);

  const selectedHotel = useMemo(
    () => hotels.find((hotel) => hotel._id === form.hotelId),
    [hotels, form.hotelId],
  );

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.hotelId || !form.staffId || !form.date) {
      toast.error("Hotel, staff member, and date are required");
      return;
    }

    setSaving(true);
    try {
      await attendanceApi.create({
        ...form,
        hotelId: form.hotelId,
        staffId: form.staffId,
      });
      toast.success("Attendance saved");
      setForm({ ...EMPTY_FORM, hotelId: form.hotelId });
      fetchRecords(form.hotelId);
    } catch (error) {
      toast.error(error?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-sm text-gray-500">
          Track daily staff presence and shifts
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
            <label className="label">Staff Member</label>
            <select
              className="input"
              value={form.staffId}
              onChange={(e) => setForm({ ...form, staffId: e.target.value })}
              disabled={!form.hotelId}
            >
              <option value="">Select staff</option>
              {staff.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.userId?.firstName || ""}{" "}
                  {member.userId?.lastName || ""} · {member.employeeId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="leave">Leave</option>
            </select>
          </div>

          <div>
            <label className="label">Check-in</label>
            <input
              type="datetime-local"
              className="input"
              value={form.checkIn}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Check-out</label>
            <input
              type="datetime-local"
              className="input"
              value={form.checkOut}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[90px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Attendance notes or reason"
            />
          </div>

          <button
            type="submit"
            className="btn-primary md:col-span-2"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Daily Attendance</h2>
            <p className="text-xs text-gray-500">
              {selectedHotel ? selectedHotel.name : "All hotels"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCalendar /> {records.length} entries
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Hours</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No attendance records yet
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {record.staffId?.userId?.firstName || ""}{" "}
                        {record.staffId?.userId?.lastName || ""}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.staffId?.employeeId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 capitalize">
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FiClock className="text-gray-400" />
                        {Number(record.hoursWorked || 0).toFixed(2)}h
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
