import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { hotelApi } from "../../api/hotelApi";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  name: "",
  code: "",
  category: "3_star",
  type: "hotel",
  description: "",
  currency: "USD",
  timezone: "UTC",
  taxRate: 10,
  address: {
    street: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
  },
  contact: {
    phone: "",
    email: "",
    website: "",
  },
  policies: {
    checkInTime: "14:00",
    checkOutTime: "11:00",
    cancellationPolicy: "Flexible",
    petPolicy: "Allowed with fee",
    childPolicy: "Children stay free when sharing with parents",
  },
  settings: {
    autoAssignRooms: false,
    requireDeposit: false,
    depositPercentage: 20,
    overbookingAllowed: false,
  },
};

const normalizeForm = (hotel = {}) => ({
  ...emptyForm,
  ...hotel,
  address: { ...emptyForm.address, ...(hotel.address || {}) },
  contact: { ...emptyForm.contact, ...(hotel.contact || {}) },
  policies: { ...emptyForm.policies, ...(hotel.policies || {}) },
  settings: { ...emptyForm.settings, ...(hotel.settings || {}) },
});

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hotelId = user?.hotelId;

  useEffect(() => {
    const loadHotel = async () => {
      if (!hotelId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await hotelApi.getOne(hotelId);
        setForm(normalizeForm(response?.data || response || {}));
      } catch (error) {
        toast.error(error?.message || "Failed to load hotel settings");
      } finally {
        setLoading(false);
      }
    };

    loadHotel();
  }, [hotelId]);

  const updateField = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hotelId) {
      toast.error("No hotel is assigned to this account.");
      return;
    }

    if (
      !form.name ||
      !form.code ||
      !form.address.city ||
      !form.address.country
    ) {
      toast.error("Hotel name, code, city, and country are required.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        address: { ...form.address },
        contact: { ...form.contact },
        policies: { ...form.policies },
        settings: { ...form.settings },
      };

      const response = await hotelApi.update(hotelId, payload);
      setForm(normalizeForm(response?.data || payload));
      toast.success("Hotel settings updated");
    } catch (error) {
      toast.error(error?.message || "Unable to save hotel settings");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="card">Please sign in to manage settings.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-500">Hotel and account preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Account</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium mt-1">
                {user?.firstName || ""} {user?.lastName || ""}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Role</p>
              <p className="font-medium mt-1 capitalize">{user?.role}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">Email</p>
              <p className="font-medium mt-1">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Hotel overview</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Hotel</p>
              <p className="font-medium mt-1">{form.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-gray-500">Code</p>
              <p className="font-medium mt-1">{form.code || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">Location</p>
              <p className="font-medium mt-1">
                {form.address.city || "Unknown"}, {form.address.country || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {loading ? (
          <div className="text-sm text-gray-500">Loading hotel settings...</div>
        ) : !hotelId ? (
          <div className="text-sm text-gray-500">
            This account is not linked to a hotel yet.
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Hotel name</span>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Hotel code</span>
                <input
                  className="input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Category</span>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="1_star">1 Star</option>
                  <option value="2_star">2 Star</option>
                  <option value="3_star">3 Star</option>
                  <option value="4_star">4 Star</option>
                  <option value="5_star">5 Star</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Type</span>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="hotel">Hotel</option>
                  <option value="resort">Resort</option>
                  <option value="motel">Motel</option>
                  <option value="hostel">Hostel</option>
                  <option value="villa">Villa</option>
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  className="input min-h-[110px]"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-4">Address</h3>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium">Street</span>
                  <input
                    className="input"
                    value={form.address.street}
                    onChange={(e) =>
                      updateField("address", "street", e.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">City</span>
                  <input
                    className="input"
                    value={form.address.city}
                    onChange={(e) =>
                      updateField("address", "city", e.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">State</span>
                  <input
                    className="input"
                    value={form.address.state}
                    onChange={(e) =>
                      updateField("address", "state", e.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Country</span>
                  <input
                    className="input"
                    value={form.address.country}
                    onChange={(e) =>
                      updateField("address", "country", e.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">ZIP code</span>
                  <input
                    className="input"
                    value={form.address.zipCode}
                    onChange={(e) =>
                      updateField("address", "zipCode", e.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-4">Contact & policies</h3>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium">Phone</span>
                  <input
                    className="input"
                    value={form.contact.phone}
                    onChange={(e) =>
                      updateField("contact", "phone", e.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Email</span>
                  <input
                    type="email"
                    className="input"
                    value={form.contact.email}
                    onChange={(e) =>
                      updateField("contact", "email", e.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Website</span>
                  <input
                    className="input"
                    value={form.contact.website}
                    onChange={(e) =>
                      updateField("contact", "website", e.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Currency</span>
                  <input
                    className="input"
                    value={form.currency}
                    onChange={(e) =>
                      setForm({ ...form, currency: e.target.value })
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Timezone</span>
                  <input
                    className="input"
                    value={form.timezone}
                    onChange={(e) =>
                      setForm({ ...form, timezone: e.target.value })
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Tax rate (%)</span>
                  <input
                    type="number"
                    className="input"
                    value={form.taxRate}
                    onChange={(e) =>
                      setForm({ ...form, taxRate: Number(e.target.value) || 0 })
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Check-in</span>
                  <input
                    className="input"
                    value={form.policies.checkInTime}
                    onChange={(e) =>
                      updateField("policies", "checkInTime", e.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Check-out</span>
                  <input
                    className="input"
                    value={form.policies.checkOutTime}
                    onChange={(e) =>
                      updateField("policies", "checkOutTime", e.target.value)
                    }
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium">
                    Cancellation policy
                  </span>
                  <input
                    className="input"
                    value={form.policies.cancellationPolicy}
                    onChange={(e) =>
                      updateField(
                        "policies",
                        "cancellationPolicy",
                        e.target.value,
                      )
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Pet policy</span>
                  <input
                    className="input"
                    value={form.policies.petPolicy}
                    onChange={(e) =>
                      updateField("policies", "petPolicy", e.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Child policy</span>
                  <input
                    className="input"
                    value={form.policies.childPolicy}
                    onChange={(e) =>
                      updateField("policies", "childPolicy", e.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-4">Operations</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.settings.autoAssignRooms)}
                    onChange={(e) =>
                      updateField(
                        "settings",
                        "autoAssignRooms",
                        e.target.checked,
                      )
                    }
                  />
                  <span className="text-sm">Auto assign rooms</span>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.settings.requireDeposit)}
                    onChange={(e) =>
                      updateField(
                        "settings",
                        "requireDeposit",
                        e.target.checked,
                      )
                    }
                  />
                  <span className="text-sm">Require deposit</span>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Deposit %</span>
                  <input
                    type="number"
                    className="input"
                    value={form.settings.depositPercentage}
                    onChange={(e) =>
                      updateField(
                        "settings",
                        "depositPercentage",
                        Number(e.target.value) || 0,
                      )
                    }
                  />
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.settings.overbookingAllowed)}
                    onChange={(e) =>
                      updateField(
                        "settings",
                        "overbookingAllowed",
                        e.target.checked,
                      )
                    }
                  />
                  <span className="text-sm">Allow overbooking</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
