import dayjs from "dayjs";

export const formatDate = (d, fmt = "MMM D, YYYY") =>
  d ? dayjs(d).format(fmt) : "—";
export const formatDateTime = (d) =>
  d ? dayjs(d).format("MMM D, YYYY HH:mm") : "—";
export const formatCurrency = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    n || 0,
  );
export const formatNumber = (n) =>
  new Intl.NumberFormat("en-US").format(n || 0);
export const statusLabel = (s) => s?.replace(/_/g, " ") || "";
