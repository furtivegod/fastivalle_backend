/**
 * Ticket Controller
 * User's tickets (My Tickets screen)
 */

const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const UserFavorite = require('../models/UserFavorite');

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

/**
 * GET /api/tickets
 * Returns user's tickets and recommended events. Auth required.
 */
const getMyTickets = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const orders = await Order.find({ userId, status: 'completed' })
      .populate('eventId', 'title subtitle startDate startTime venue coverImage coverColor attendeesCount')
      .sort({ purchasedAt: -1 })
      .lean();

    const ticketGroups = [];

    for (const order of orders) {
      const event = order.eventId;
      if (!event) continue;

      const orderItems = await OrderItem.find({ orderId: order._id }).lean();
      const orderItemIds = orderItems.map((oi) => oi._id);

      const tickets = await Ticket.find({ orderItemId: { $in: orderItemIds } })
        .lean();

      const validCount = tickets.filter((t) => t.status === 'valid').length;
      const totalCount = tickets.length;

      ticketGroups.push({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        event: {
          id: event._id.toString(),
          title: event.title,
          date: formatEventDate(event.startDate, event.startTime),
          dateRange: event.endDate
            ? `${MONTHS[new Date(event.startDate).getMonth()]} ${new Date(event.startDate).getDate()}-${new Date(event.endDate).getDate()}`
            : formatEventDate(event.startDate, event.startTime).split(',')[0],
          subtitle: event.subtitle || '',
          stage: event.venue || '',
          attendees: event.attendeesCount || 0,
          coverImage: event.coverImage,
          coverColor: event.coverColor || '#E87D2B',
        },
        ticketCount: totalCount,
        validCount,
        tickets: tickets.map((t) => ({
          id: t._id.toString(),
          ticketNumber: t.ticketNumber,
          status: t.status,
          qrCode: t.qrCode,
        })),
      });
    }

    // Recommended events when user has no/some tickets
    const favoritedEventIds = [];
    const favs = await UserFavorite.find({ userId }).select('eventId').lean();
    favoritedEventIds.push(...favs.map((f) => f.eventId.toString()));

    const now = new Date();
    const upcomingRaw = await Event.find({ status: 'published', startDate: { $gte: now } })
      .sort({ startDate: 1 })
      .limit(3)
      .lean();
    const featuredFestival = upcomingRaw[0] || (await Event.findOne({ status: 'published', isTopLevel: true }).lean());

    const popularRaw = await Event.find({ status: 'published' })
      .sort({ attendeesCount: -1, startDate: 1 })
      .limit(5)
      .lean();

    const recommendedFestival = featuredFestival
      ? {
          id: featuredFestival._id.toString(),
          date: featuredFestival.endDate
            ? `${MONTHS[new Date(featuredFestival.startDate).getMonth()]} ${new Date(featuredFestival.startDate).getDate()}-${new Date(featuredFestival.endDate).getDate()}`
            : formatEventDate(featuredFestival.startDate, featuredFestival.startTime).split(',')[0],
          attendees: featuredFestival.attendeesCount || 0,
          title: featuredFestival.title?.length > 25 ? `${featuredFestival.title.substring(0, 22)}...` : featuredFestival.title,
          subtitle: featuredFestival.subtitle || '',
          stage: featuredFestival.venue || '',
          coverImage: featuredFestival.coverImage,
          coverColor: featuredFestival.coverColor,
        }
      : null;

    const popularEvents = popularRaw.map((e) => ({
      id: e._id.toString(),
      date: formatEventDate(e.startDate, e.startTime),
      title: e.title?.length > 25 ? `${e.title.substring(0, 22)}...` : e.title,
      liked: favoritedEventIds.includes(e._id.toString()),
      coverImage: e.coverImage,
      coverColor: e.coverColor,
    }));

    res.json({
      success: true,
      data: {
        ticketGroups,
        recommendedFestival: recommendedFestival,
        popularEvents,
      },
    });
  } catch (error) {
    console.error('Tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load tickets',
    });
  }
};

module.exports = {
  getMyTickets,
};
