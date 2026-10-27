// backend/src/controllers/invoiceController.js
import Invoice from "../models/Invoice.js";
import Booking from "../models/Booking.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { generateInvoiceNumber } from "../utils/helpers.js";

// ─────────────────────────────────────────────────────────────
// @desc   List all invoices (with filters + pagination)
// @route  GET /api/v1/invoices
// @access Private
// ─────────────────────────────────────────────────────────────
export const getAllInvoices = async (req, res, next) => {
  try {
    const { hotelId, bookingId, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = hotelId;
    if (bookingId) filter.bookingId = bookingId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate("bookingId", "bookingNumber checkIn checkOut")
        .populate("guestId", "firstName lastName email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invoice.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          invoices,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit) || 1),
          },
        },
        "Invoices fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Generate invoice from a booking
// @route  POST /api/v1/invoices/generate/:bookingId
// @access Private
// ─────────────────────────────────────────────────────────────
export const generateFromBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) {
      throw new ApiError(400, "Booking ID is required");
    }

    const booking = await Booking.findById(bookingId)
      .populate("guestId", "firstName lastName email phone")
      .populate("hotelId", "name code currency taxRate")
      .populate("rooms.roomTypeId", "name code basePrice");

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    // If invoice already exists, return it
    const existingInvoice = await Invoice.findOne({ bookingId: booking._id });
    if (existingInvoice) {
      const populated = await Invoice.findById(existingInvoice._id)
        .populate("bookingId", "bookingNumber checkIn checkOut")
        .populate("guestId", "firstName lastName email phone");
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            populated,
            "Invoice already exists for this booking",
          ),
        );
    }

    // Compute amounts
    const subtotal = Number(booking.pricing?.roomCharges || 0);
    const taxAmount = Number(booking.pricing?.taxes || 0);
    const discount = Number(booking.pricing?.discount || 0);
    const totalAmount = Number(
      booking.pricing?.totalAmount || subtotal + taxAmount - discount,
    );
    const paidAmount = Number(booking.pricing?.paidAmount || 0);
    const balanceAmount = Math.max(totalAmount - paidAmount, 0);

    // Build line items from rooms
    const items = (booking.rooms || []).map((r) => {
      const roomName = r.roomTypeId?.name || "Room";
      const rate = Number(r.ratePerNight || r.roomTypeId?.basePrice || 0);
      const nights = Number(booking.nights || 1);
      return {
        description: `${roomName} accommodation — ${nights} night${nights > 1 ? "s" : ""}`,
        quantity: nights,
        unitPrice: rate,
        tax: 0,
        amount: rate * nights,
      };
    });

    // Fallback if no rooms
    if (items.length === 0) {
      const nights = Number(booking.nights || 1);
      items.push({
        description: `${nights} night${nights > 1 ? "s" : ""} stay`,
        quantity: nights,
        unitPrice: Number((subtotal / nights).toFixed(2)),
        tax: taxAmount,
        amount: subtotal,
      });
    }

    // Determine status
    let status = "issued";
    if (balanceAmount <= 0.01) status = "paid";
    else if (paidAmount > 0) status = "partially_paid";

    // Create invoice
    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(Date.now() % 100000),
      bookingId: booking._id,
      hotelId: booking.hotelId?._id || booking.hotelId,
      guestId: booking.guestId?._id || booking.guestId,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items,
      subtotal,
      taxAmount,
      discount,
      totalAmount,
      paidAmount,
      balanceAmount,
      currency: booking.hotelId?.currency || "USD",
      status,
      notes: `Auto-generated invoice for booking ${booking.bookingNumber}`,
      createdBy: req.user?._id,
    });

    const populated = await Invoice.findById(invoice._id)
      .populate("bookingId", "bookingNumber checkIn checkOut")
      .populate("guestId", "firstName lastName email phone");

    res.status(201).json(new ApiResponse(201, populated, "Invoice generated"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Create invoice (manual, requires bookingId in body)
// @route  POST /api/v1/invoices
// @access Private
// ─────────────────────────────────────────────────────────────
export const createInvoice = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      throw new ApiError(400, "Booking ID is required");
    }

    const booking = await Booking.findById(bookingId)
      .populate("guestId", "firstName lastName email phone")
      .populate("hotelId", "name code currency taxRate");

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    const existingInvoice = await Invoice.findOne({ bookingId: booking._id });
    if (existingInvoice) {
      return res
        .status(200)
        .json(new ApiResponse(200, existingInvoice, "Invoice already exists"));
    }

    const subtotal = Number(booking.pricing?.roomCharges || 0);
    const taxAmount = Number(booking.pricing?.taxes || 0);
    const discount = Number(booking.pricing?.discount || 0);
    const totalAmount = Number(
      booking.pricing?.totalAmount || subtotal + taxAmount - discount,
    );
    const paidAmount = Number(booking.pricing?.paidAmount || 0);
    const balanceAmount = Math.max(totalAmount - paidAmount, 0);

    const roomName =
      booking.rooms?.[0]?.roomTypeId?.name ||
      `${booking.nights || 0} night stay`;

    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(Date.now() % 100000),
      bookingId: booking._id,
      hotelId: booking.hotelId._id,
      guestId: booking.guestId._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: [
        {
          description: `${roomName} accommodation`,
          quantity: booking.nights || 1,
          unitPrice: Number(
            (totalAmount / Math.max(booking.nights || 1, 1)).toFixed(2),
          ),
          tax: taxAmount,
          amount: totalAmount,
        },
      ],
      subtotal,
      taxAmount,
      discount,
      totalAmount,
      paidAmount,
      balanceAmount,
      currency: booking.hotelId.currency || "USD",
      status: balanceAmount > 0 ? "issued" : "paid",
      notes: `Invoice for booking ${booking.bookingNumber}`,
      createdBy: req.user?._id,
    });

    res.status(201).json(new ApiResponse(201, invoice, "Invoice generated"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Get single invoice
// @route  GET /api/v1/invoices/:id
// @access Private
// ─────────────────────────────────────────────────────────────
export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("bookingId", "bookingNumber checkIn checkOut nights")
      .populate("guestId", "firstName lastName email phone address")
      .populate("hotelId", "name code address contact");

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    res.status(200).json(new ApiResponse(200, invoice, "Invoice fetched"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Update invoice
// @route  PATCH /api/v1/invoices/:id
// @access Private
// ─────────────────────────────────────────────────────────────
export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("bookingId", "bookingNumber")
      .populate("guestId", "firstName lastName email");

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    res.status(200).json(new ApiResponse(200, invoice, "Invoice updated"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Delete invoice
// @route  DELETE /api/v1/invoices/:id
// @access Private
// ─────────────────────────────────────────────────────────────
export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }
    res.status(200).json(new ApiResponse(200, null, "Invoice deleted"));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc   Send invoice by email (placeholder)
// @route  POST /api/v1/invoices/:id/send
// @access Private
// ─────────────────────────────────────────────────────────────
export const sendInvoiceEmail = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      "guestId",
      "firstName lastName email",
    );
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    // TODO: Integrate with real emailService
    // await sendEmail({
    //   to: invoice.guestId?.email,
    //   subject: `Invoice ${invoice.invoiceNumber}`,
    //   html: renderInvoiceTemplate(invoice),
    // });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { sentTo: invoice.guestId?.email || "guest@example.com" },
          "Invoice sent by email",
        ),
      );
  } catch (error) {
    next(error);
  }
};
