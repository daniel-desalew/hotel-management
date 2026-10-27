import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiBriefcase, FiDollarSign } from "react-icons/fi";
import { hotelApi } from "../../api/hotelApi";
import { payrollApi } from "../../api/payrollApi";
import { staffApi } from "../../api/staffApi";

const EMPTY_FORM = {
  hotelId: "",
  staffId: "",
  period: new Date().toISOString().slice(0, 7),
  baseSalary: "",
  overtimeHours: "0",
  allowances: "0",
  deductions: "0",
  status: "draft",
  notes: "",
};

export default function PayrollList() {
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
      const res = await payrollApi.getAll(params);
      setRecords(res?.data?.records || []);
    } catch (error) {
      toast.error(error?.message || "Failed to load payroll");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
    fetchRecords();
  }, []);

  useEffect(() => {
    if (form.hotelId) {
      loadStaff(form.hotelId);
      fetchRecords(form.hotelId);
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

    if (!form.hotelId || !form.staffId || !form.period) {
      toast.error("Hotel, staff member, and period are required");
      return;
    }

    setSaving(true);
    try {
      await payrollApi.create({
        ...form,
        hotelId: form.hotelId,
        staffId: form.staffId,
        baseSalary: Number(form.baseSalary || 0),
        overtimeHours: Number(form.overtimeHours || 0),
        allowances: Number(form.allowances || 0),
        deductions: Number(form.deductions || 0),
      });
      toast.success("Payroll saved");
      setForm({ ...EMPTY_FORM, hotelId: form.hotelId });
      fetchRecords(form.hotelId);
    } catch (error) {
      toast.error(error?.message || "Failed to save payroll");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payroll</h1>
        <p className="text-sm text-gray-500">
          Track staff salaries, overtime, and net pay
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
            <label className="label">Pay Period</label>
            <input
              type="month"
              className="input"
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label className="label">Base Salary</label>
            <input
              type="number"
              className="input"
              value={form.baseSalary}
              onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
              placeholder="1500"
            />
          </div>

          <div>
            <label className="label">Overtime Hours</label>
            <input
              type="number"
              className="input"
              value={form.overtimeHours}
              onChange={(e) =>
                setForm({ ...form, overtimeHours: e.target.value })
              }
              placeholder="0"
            />
          </div>

          <div>
            <label className="label">Allowances</label>
            <input
              type="number"
              className="input"
              value={form.allowances}
              onChange={(e) => setForm({ ...form, allowances: e.target.value })}
              placeholder="0"
            />
          </div>

          <div>
            <label className="label">Deductions</label>
            <input
              type="number"
              className="input"
              value={form.deductions}
              onChange={(e) => setForm({ ...form, deductions: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[90px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Payroll notes or adjustments"
            />
          </div>

          <button
            type="submit"
            className="btn-primary md:col-span-2"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Payroll"}
          </button>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Payroll Summary</h2>
            <p className="text-xs text-gray-500">
              {selectedHotel ? selectedHotel.name : "All hotels"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiBriefcase /> {records.length} records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-left">Gross</th>
                <th className="px-4 py-3 text-left">Net</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Loading payroll...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No payroll records yet
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
                    <td className="px-4 py-3">{record.period}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FiDollarSign /> $
                        {Number(record.grossPay || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      ${Number(record.netPay || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 capitalize">{record.status}</td>
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
