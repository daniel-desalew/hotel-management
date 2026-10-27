import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiShoppingCart } from "react-icons/fi";
import { hotelApi } from "../../api/hotelApi";
import { restaurantOrderApi } from "../../api/restaurantOrderApi";

const emptyItem = { itemName: "", qty: 1, unitPrice: "", notes: "" };
const emptyForm = {
  hotelId: "",
  guestName: "",
  tableNumber: "",
  taxRate: "10",
  status: "pending",
  paymentStatus: "unpaid",
  items: [{ ...emptyItem }],
};

export default function RestaurantOrders() {
  const [hotels, setHotels] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
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

  const fetchOrders = async (hotelId) => {
    setLoading(true);
    try {
      const params = hotelId ? { hotelId } : {};
      const res = await restaurantOrderApi.getAll(params);
      setOrders(res?.data?.orders || []);
    } catch (error) {
      toast.error(error?.message || "Failed to load restaurant orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (form.hotelId) {
      fetchOrders(form.hotelId);
    }
  }, [form.hotelId]);

  const selectedHotel = useMemo(
    () => hotels.find((hotel) => hotel._id === form.hotelId),
    [hotels, form.hotelId],
  );

  const updateItem = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const subtotal = form.items.reduce((sum, item) => {
    const qty = Number(item.qty || 0);
    const price = Number(item.unitPrice || 0);
    return sum + qty * price;
  }, 0);

  const tax = subtotal * (Number(form.taxRate || 0) / 100);
  const total = subtotal + tax;

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.hotelId || !form.items.some((item) => item.itemName.trim())) {
      toast.error("Hotel and at least one item are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        hotelId: form.hotelId,
        taxRate: Number(form.taxRate || 0),
        items: form.items.map((item) => ({
          itemName: item.itemName,
          qty: Number(item.qty || 1),
          unitPrice: Number(item.unitPrice || 0),
          notes: item.notes || "",
        })),
      };

      await restaurantOrderApi.create(payload);
      toast.success("Restaurant order created");
      setForm({ ...emptyForm, hotelId: form.hotelId });
      fetchOrders(form.hotelId);
    } catch (error) {
      toast.error(error?.message || "Failed to save restaurant order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Restaurant POS</h1>
        <p className="text-sm text-gray-500">
          Create and track food orders for guests and tables
        </p>
      </div>

      <div className="card">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
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
              <label className="label">Guest Name</label>
              <input
                className="input"
                value={form.guestName}
                onChange={(e) =>
                  setForm({ ...form, guestName: e.target.value })
                }
                placeholder="Walk-in Guest"
              />
            </div>

            <div>
              <label className="label">Table</label>
              <input
                className="input"
                value={form.tableNumber}
                onChange={(e) =>
                  setForm({ ...form, tableNumber: e.target.value })
                }
                placeholder="A12"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="served">Served</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="label">Payment</label>
              <select
                className="input"
                value={form.paymentStatus}
                onChange={(e) =>
                  setForm({ ...form, paymentStatus: e.target.value })
                }
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="label">Tax Rate %</label>
              <input
                type="number"
                className="input"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-3">
            {form.items.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-[2fr_1fr_1.2fr_1.2fr_auto]"
              >
                <input
                  className="input"
                  value={item.itemName}
                  onChange={(e) =>
                    updateItem(index, "itemName", e.target.value)
                  }
                  placeholder="Menu item"
                />
                <input
                  type="number"
                  className="input"
                  value={item.qty}
                  min="1"
                  onChange={(e) => updateItem(index, "qty", e.target.value)}
                  placeholder="Qty"
                />
                <input
                  type="number"
                  className="input"
                  value={item.unitPrice}
                  min="0"
                  onChange={(e) =>
                    updateItem(index, "unitPrice", e.target.value)
                  }
                  placeholder="Price"
                />
                <input
                  className="input"
                  value={item.notes}
                  onChange={(e) => updateItem(index, "notes", e.target.value)}
                  placeholder="Notes"
                />
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => removeItem(index)}
                  disabled={form.items.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-outline flex items-center gap-2"
              onClick={addItem}
            >
              <FiPlus /> Add Item
            </button>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create Order"}
          </button>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Recent Orders</h2>
            <p className="text-xs text-gray-500">
              {selectedHotel ? selectedHotel.name : "All hotels"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiShoppingCart /> {orders.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Table</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No restaurant orders yet
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">
                        {order.guestName}
                      </div>
                    </td>
                    <td className="px-4 py-3">{order.tableNumber || "—"}</td>
                    <td className="px-4 py-3 capitalize">{order.status}</td>
                    <td className="px-4 py-3">
                      ${Number(order.total || 0).toFixed(2)}
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
