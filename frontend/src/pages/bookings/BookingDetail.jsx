// frontend/src/pages/bookings/BookingDetail.jsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiArrowLeft, FiLogIn, FiLogOut, FiXCircle } from "react-icons/fi";
import { bookingApi } from "../../api/bookingApi";

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => bookingApi.get(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["booking", id] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["rooms"] });
  };

  const checkIn = useMutation({
    mutationFn: () => bookingApi.checkIn(id, {}),
    onSuccess: () => {
      toast.success("Checked in");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const checkOut = useMutation({
    mutationFn: () => bookingApi.checkOut(id),
    onSuccess: () => {
      toast.success("Checked out");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: () => bookingApi.cancel(id, { reason: "Cancelled by staff" }),
    onSuccess: () => {
      toast.success("Booking cancelled");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading)
    return <div className="text-center py-16 text-gray-400">Loading...</div>;
  const b = data?.data;
  if (!b)
    return (
      <div className="text-center py-16 text-gray-400">Booking not found</div>
    );

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <FiArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">
            {b.bookingNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">
            {b.status.replace(/_/g, " ")}
          </p>
        </div>
        <div className="flex gap-2">
          {["pending", "confirmed"].includes(b.status) && (
            <button
              onClick={() => checkIn.mutate()}
              disabled={checkIn.isPending}
              className="btn-success"
            >
              <FiLogIn className="w-4 h-4" /> Check In
            </button>
          )}
          {b.status === "checked_in" && (
            <button
              onClick={() => checkOut.mutate()}
              disabled={checkOut.isPending}
              className="btn-primary"
            >
              <FiLogOut className="w-4 h-4" /> Check Out
            </button>
          )}
          {["pending", "confirmed"].includes(b.status) && (
            <button
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
              className="btn-danger"
            >
              <FiXCircle className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h2 className="font-semibold mb-3">Guest</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">
                  {b.guestId?.firstName} {b.guestId?.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{b.guestId?.email || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{b.guestId?.phone || "—"}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold mb-3">Stay</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Check-in</p>
                <p className="font-medium">
                  {new Date(b.checkIn).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Check-out</p>
                <p className="font-medium">
                  {new Date(b.checkOut).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Nights</p>
                <p className="font-medium">{b.nights}</p>
              </div>
              <div>
                <p className="text-gray-500">Guests</p>
                <p className="font-medium">
                  {b.totalGuests?.adults} adults, {b.totalGuests?.children || 0}{" "}
                  children
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">Pricing</h2>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Room</span>
              <span>${b.pricing?.roomCharges?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Taxes</span>
              <span>${b.pricing?.taxes?.toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${b.pricing?.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Paid</span>
              <span>${b.pricing?.paidAmount?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Balance</span>
              <span>${b.pricing?.balanceAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
