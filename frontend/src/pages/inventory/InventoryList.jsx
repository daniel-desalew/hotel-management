import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { inventoryApi } from "../../api/inventoryApi";
import { hotelApi } from "../../api/hotelApi";

const emptyForm = {
  hotelId: "",
  name: "",
  category: "housekeeping",
  stock: 0,
  reorderLevel: 0,
  unit: "units",
  supplier: "",
  notes: "",
};

export default function InventoryList() {
  const [hotels, setHotels] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.getAll({
        hotelId: form.hotelId || undefined,
      });
      setItems(response?.data?.items || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load inventory");
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
    if (form.hotelId) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [form.hotelId]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.hotelId || !form.name) {
      toast.error("Hotel and item name are required");
      return;
    }

    try {
      setSubmitting(true);
      await inventoryApi.create(form);
      toast.success("Inventory item created");
      setForm({ ...emptyForm, hotelId: form.hotelId });
      await loadItems();
    } catch (err) {
      toast.error(err?.message || "Failed to create inventory item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockAdjust = async (itemId, delta) => {
    try {
      await inventoryApi.adjust(itemId, { delta });
      toast.success("Stock updated");
      await loadItems();
    } catch (err) {
      toast.error(err?.message || "Failed to adjust stock");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-sm text-gray-500">
          Track hotel stock and reorder levels
        </p>
      </div>

      <div className="card">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Hotel</label>
            <select
              className="input"
              value={form.hotelId}
              onChange={(e) =>
                setForm({ ...emptyForm, hotelId: e.target.value })
              }
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
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="housekeeping">Housekeeping</option>
              <option value="food_beverage">Food & Beverage</option>
              <option value="maintenance">Maintenance</option>
              <option value="front_office">Front Office</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Item name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Toilet paper"
            />
          </div>

          <div>
            <label className="label">Unit</label>
            <input
              className="input"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="rolls"
            />
          </div>

          <div>
            <label className="label">Stock</label>
            <input
              type="number"
              className="input"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: Number(e.target.value) || 0 })
              }
            />
          </div>

          <div>
            <label className="label">Reorder level</label>
            <input
              type="number"
              className="input"
              value={form.reorderLevel}
              onChange={(e) =>
                setForm({ ...form, reorderLevel: Number(e.target.value) || 0 })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Supplier</label>
            <input
              className="input"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              placeholder="Supplier or vendor name"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea
              rows="2"
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional note about usage or preferred supplier"
            />
          </div>

          <button
            type="submit"
            className="btn-primary md:col-span-2"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Add Inventory Item"}
          </button>
        </form>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Reorder</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No inventory items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.unit}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {item.category?.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">{item.stock}</td>
                    <td className="px-4 py-3">{item.reorderLevel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          item.status === "low_stock"
                            ? "badge-warning"
                            : item.status === "out_of_stock"
                              ? "badge-danger"
                              : "badge-success"
                        }`}
                      >
                        {item.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-outline text-xs"
                          onClick={() => handleStockAdjust(item._id, 10)}
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          className="btn-primary text-xs"
                          onClick={() => handleStockAdjust(item._id, -10)}
                        >
                          -10
                        </button>
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
