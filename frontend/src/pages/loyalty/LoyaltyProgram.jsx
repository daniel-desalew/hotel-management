import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiAward, FiStar } from "react-icons/fi";
import { hotelApi } from "../../api/hotelApi";
import { loyaltyApi } from "../../api/loyaltyApi";

const EMPTY_FORM = {
  hotelId: "",
  guestName: "",
  guestEmail: "",
  phone: "",
  totalPoints: "0",
  status: "active",
  notes: "",
};

export default function LoyaltyProgram() {
  const [hotels, setHotels] = useState([]);
  const [members, setMembers] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [redeemForm, setRedeemForm] = useState({
    memberId: "",
    rewardType: "food_voucher",
    redeemedPoints: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const loadHotels = async () => {
    try {
      const res = await hotelApi.getAll({ limit: 100 });
      setHotels(res?.data?.hotels || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMembers = async (hotelId) => {
    setLoading(true);
    try {
      const params = hotelId ? { hotelId } : {};
      const res = await loyaltyApi.getAll(params);
      setMembers(res?.data?.members || []);
      if (!redeemForm.memberId && (res?.data?.members || []).length > 0) {
        setRedeemForm((prev) => ({
          ...prev,
          memberId: res.data.members[0]._id,
        }));
      }
    } catch (error) {
      toast.error(error?.message || "Failed to load loyalty members");
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptions = async (hotelId) => {
    try {
      const params = hotelId ? { hotelId } : {};
      const res = await loyaltyApi.getRedemptions(params);
      setRedemptions(res?.data?.redemptions || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadHotels();
    fetchMembers();
    fetchRedemptions();
  }, []);

  useEffect(() => {
    if (form.hotelId) {
      fetchMembers(form.hotelId);
      fetchRedemptions(form.hotelId);
    }
  }, [form.hotelId]);

  const selectedHotel = useMemo(
    () => hotels.find((hotel) => hotel._id === form.hotelId),
    [hotels, form.hotelId],
  );

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.hotelId || !form.guestName || !form.guestEmail) {
      toast.error("Hotel, guest name, and email are required");
      return;
    }

    setSaving(true);
    try {
      await loyaltyApi.create({
        ...form,
        hotelId: form.hotelId,
        totalPoints: Number(form.totalPoints || 0),
      });
      toast.success("Loyalty member saved");
      setForm({ ...EMPTY_FORM, hotelId: form.hotelId });
      fetchMembers(form.hotelId);
    } catch (error) {
      toast.error(error?.message || "Failed to save loyalty member");
    } finally {
      setSaving(false);
    }
  };

  const onRedeem = async (event) => {
    event.preventDefault();

    if (!form.hotelId || !redeemForm.memberId) {
      toast.error("Select a hotel and member before redeeming points");
      return;
    }

    setRedeeming(true);
    try {
      await loyaltyApi.createRedemption({
        memberId: redeemForm.memberId,
        hotelId: form.hotelId,
        rewardType: redeemForm.rewardType,
        redeemedPoints: Number(redeemForm.redeemedPoints || 0),
        note: redeemForm.note,
      });
      toast.success("Points redeemed");
      setRedeemForm({
        memberId: redeemForm.memberId,
        rewardType: "food_voucher",
        redeemedPoints: "",
        note: "",
      });
      fetchMembers(form.hotelId);
      fetchRedemptions(form.hotelId);
    } catch (error) {
      toast.error(error?.message || "Failed to redeem points");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Loyalty Program</h1>
        <p className="text-sm text-gray-500">
          Track guest rewards and member tiers
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
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="label">Guest Name</label>
            <input
              className="input"
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
              placeholder="Alice Johnson"
            />
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="1234567890"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.guestEmail}
              onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
              placeholder="guest@example.com"
            />
          </div>

          <div>
            <label className="label">Total Points</label>
            <input
              type="number"
              className="input"
              value={form.totalPoints}
              onChange={(e) =>
                setForm({ ...form, totalPoints: e.target.value })
              }
              placeholder="0"
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <input
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="VIP preference"
            />
          </div>

          <button
            type="submit"
            className="btn-primary md:col-span-2"
            disabled={saving}
          >
            {saving ? "Saving..." : "Add Member"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Redeem points</h2>
        <form onSubmit={onRedeem} className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Member</label>
            <select
              className="input"
              value={redeemForm.memberId}
              onChange={(e) =>
                setRedeemForm({ ...redeemForm, memberId: e.target.value })
              }
            >
              <option value="">Choose member</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.guestName} ({member.pointsBalance} pts)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Reward type</label>
            <select
              className="input"
              value={redeemForm.rewardType}
              onChange={(e) =>
                setRedeemForm({ ...redeemForm, rewardType: e.target.value })
              }
            >
              <option value="food_voucher">Food voucher</option>
              <option value="spa">Spa</option>
              <option value="room_upgrade">Room upgrade</option>
              <option value="discount">Discount</option>
              <option value="cashback">Cashback</option>
            </select>
          </div>

          <div>
            <label className="label">Points to redeem</label>
            <input
              type="number"
              className="input"
              value={redeemForm.redeemedPoints}
              onChange={(e) =>
                setRedeemForm({ ...redeemForm, redeemedPoints: e.target.value })
              }
              placeholder="250"
            />
          </div>

          <div className="md:col-span-3">
            <label className="label">Note</label>
            <input
              className="input"
              value={redeemForm.note}
              onChange={(e) =>
                setRedeemForm({ ...redeemForm, note: e.target.value })
              }
              placeholder="Complimentary snack credit"
            />
          </div>

          <button
            type="submit"
            className="btn-primary md:col-span-3"
            disabled={redeeming}
          >
            {redeeming ? "Processing..." : "Redeem points"}
          </button>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Member Rewards</h2>
            <p className="text-xs text-gray-500">
              {selectedHotel ? selectedHotel.name : "All hotels"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiAward /> {members.length} members
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Guest</th>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-left">Points</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No loyalty members yet
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="font-medium">{member.guestName}</div>
                      <div className="text-xs text-gray-500">
                        {member.guestEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 capitalize">
                        <FiStar /> {member.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">{member.pointsBalance}</td>
                    <td className="px-4 py-3 capitalize">{member.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold">Recent redemptions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Guest</th>
                <th className="px-4 py-3 text-left">Reward</th>
                <th className="px-4 py-3 text-left">Points</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No redemptions yet
                  </td>
                </tr>
              ) : (
                redemptions.map((redemption) => (
                  <tr key={redemption._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{redemption.guestName}</td>
                    <td className="px-4 py-3 capitalize">
                      {redemption.rewardType}
                    </td>
                    <td className="px-4 py-3">{redemption.redeemedPoints}</td>
                    <td className="px-4 py-3 capitalize">
                      {redemption.status}
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
