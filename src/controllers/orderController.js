/**
 * Order Controller
 * Create and fetch orders
 */

const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const TicketType = require('../models/TicketType');

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function formatEventDate(date, startTime) {
  if (!date) return '';
  const d = new Date(date);
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  if (startTime) {
    return `${month} ${day}, ${startTime}`;
  }
  const hours = d.getHours();
  const mins = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = mins < 10 ? `0${mins}` : mins;
  return `${month} ${day}, ${h}:${m}${ampm}`;
}

function generateOrderNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return `${id}-r${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * POST /api/orders
 * Create order (auth required)
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const { eventId, items, totalAmount, currency = 'USD', paymentMethod = 'apple_pay' } = req.body;

    if (!eventId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'eventId and items required' });
    }

    const event = await Event.findById(eventId).lean();
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    let orderNumber = generateOrderNumber();
    let exists = await Order.findOne({ orderNumber });
    while (exists) {
      orderNumber = generateOrderNumber();
      exists = await Order.findOne({ orderNumber });
    }

    const order = await Order.create({
      userId,
      eventId,
      orderNumber,
      totalAmount: totalAmount || 0,
      currency,
      status: 'completed',
      paymentMethod,
      purchasedAt: new Date(),
    });

    let totalCreated = 0;
    for (const item of items) {
      const { ticketTypeId, quantity, unitPrice, category = 'general', ticketTypeName } = item;
      if (!ticketTypeId || !quantity || quantity < 1) continue;

      const ticketType = await TicketType.findById(ticketTypeId).lean();
      if (!ticketType || ticketType.eventId.toString() !== eventId) continue;

      const orderItem = await OrderItem.create({
        orderId: order._id,
        ticketTypeId,
        quantity,
        unitPrice: unitPrice || ticketType.price,
        category,
        ticketTypeName: ticketTypeName || (ticketType.ticketType || '').toUpperCase(),
      });

      for (let i = 0; i < quantity; i++) {
        await Ticket.create({
          orderItemId: orderItem._id,
          ticketNumber: `TKT-${orderNumber}-${totalCreated + 1}`,
          status: 'valid',
          assignedToUserId: i === 0 ? userId : null,
          qrCode: `QR-${orderNumber}-${totalCreated + 1}`,
        });
        totalCreated++;
      }
    }

    const orderPop = await Order.findById(order._id)
      .populate('eventId', 'title subtitle startDate startTime venue coverImage coverColor')
      .lean();

    const eventData = orderPop.eventId;
    const orderPayload = {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      currency: order.currency,
      status: order.status,
      event: eventData
        ? {
            id: eventData._id.toString(),
            title: eventData.title,
            date: formatEventDate(eventData.startDate, eventData.startTime),
            subtitle: eventData.subtitle || '',
            stage: eventData.venue || '',
            coverImage: eventData.coverImage,
            coverColor: eventData.coverColor,
          }
        : null,
      category: items[0]?.category === 'group' ? 'Group' : 'General',
      ticketType: (items[0]?.ticketTypeName || 'STANDARD').toUpperCase(),
      quantity: totalCreated,
    };

    res.status(201).json({
      success: true,
      data: orderPayload,
    });
  } catch (error) {
    console.error('Order create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
    });
  }
};

/**
 * GET /api/orders/:id
 * Get order detail (auth required)
 */
const getOrderById = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('eventId', 'title subtitle startDate startTime venue coverImage coverColor')
      .lean();

    if (!order || order.userId.toString() !== userId.toString()) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const orderItems = await OrderItem.find({ orderId: order._id })
      .populate('ticketTypeId', 'name ticketType')
      .lean();

    const tickets = await Ticket.find({
      orderItemId: { $in: orderItems.map((oi) => oi._id) },
    }).lean();

    const eventData = order.eventId;
    const orderPayload = {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      currency: order.currency,
      status: order.status,
      event: eventData
        ? {
            id: eventData._id.toString(),
            title: eventData.title,
            date: formatEventDate(eventData.startDate, eventData.startTime),
            subtitle: eventData.subtitle || '',
            stage: eventData.venue || '',
            coverImage: eventData.coverImage,
            coverColor: eventData.coverColor,
          }
        : null,
      category: orderItems[0]?.category === 'group' ? 'Group' : 'General',
      ticketType: (orderItems[0]?.ticketTypeName || orderItems[0]?.ticketTypeId?.ticketType || 'STANDARD').toUpperCase(),
      quantity: tickets.length,
      tickets: tickets.map((t) => ({
        id: t._id.toString(),
        ticketNumber: t.ticketNumber,
        status: t.status,
        qrCode: t.qrCode,
      })),
    };

    res.json({
      success: true,
      data: orderPayload,
    });
  } catch (error) {
    console.error('Order detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load order',
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
};
