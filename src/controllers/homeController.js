/**
 * Home Controller
 * Aggregates data for the Home screen
 */

const Event = require('../models/Event');
const Product = require('../models/Product');
const Post = require('../models/Post');
const UserFavorite = require('../models/UserFavorite');
const User = require('../models/User');

/**
 * Format date for display: "AUG 15, 10:00AM"
 */
function formatEventDate(date, startTime) {
  if (!date) return '';
  const d = new Date(date);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[d.getMonth()];
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
 * Time ago string
 */
function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}

/**
 * GET /api/home
 * Returns all data needed for the Home screen
 */
const getHomeData = async (req, res) => {
  try {
    const userId = req.user?._id;
    const now = new Date();

    // 1. Upcoming events (next 30 days, published, limit 10)
    const upcomingEventsRaw = await Event.find({
      status: 'published',
      startDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    // 2. Popular events (by attendees or recent, limit 5)
    const popularEventsRaw = await Event.find({ status: 'published' })
      .sort({ attendeesCount: -1, startDate: 1 })
      .limit(5)
      .lean();

    // 3. Products (merch) - limit 6
    const productsRaw = await Product.find({ inStock: true })
      .sort({ sortOrder: 1 })
      .limit(6)
      .lean();

    // 4. Posts (highlights) - with user and event populated
    const postsRaw = await Post.find()
      .populate('userId', 'name profileImage')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 5. User's favorited event IDs (for liked state)
    let favoritedEventIds = [];
    if (userId) {
      const favs = await UserFavorite.find({ userId }).select('eventId').lean();
      favoritedEventIds = favs.map((f) => f.eventId.toString());
    }

    // Transform upcoming events
    const upcomingEvents = upcomingEventsRaw.map((e) => ({
      id: e._id.toString(),
      date: formatEventDate(e.startDate, e.startTime),
      attendees: e.attendeesCount || 0,
      title: e.title?.length > 25 ? `${e.title.substring(0, 22)}...` : e.title,
      subtitle: e.subtitle || '',
      stage: e.venue || '',
      coverColor: e.coverColor,
      coverImage: e.coverImage,
    }));

    // Transform popular events
    const popularEvents = popularEventsRaw.map((e) => ({
      id: e._id.toString(),
      date: formatEventDate(e.startDate, e.startTime),
      title: e.title?.length > 25 ? `${e.title.substring(0, 22)}...` : e.title,
      liked: favoritedEventIds.includes(e._id.toString()),
      imageColor: e.coverColor || '#E87D2B',
      coverImage: e.coverImage,
    }));

    // Transform products
    const merchItems = productsRaw.map((p) => ({
      id: p._id.toString(),
      tag: p.tag || '',
      tagColor: p.tagColor || '#E87D2B',
      title: p.name?.length > 28 ? `${p.name.substring(0, 25)}...` : p.name,
      price: `${p.price} ${p.currency || 'USD'}`,
      liked: false, // No user-product favorite in schema yet
      image: p.image,
    }));

    // Transform posts (highlights)
    const highlights = postsRaw.map((p) => ({
      id: p._id.toString(),
      name: p.userId?.name || 'User',
      timeAgo: timeAgo(p.createdAt),
      eventName: p.eventId?.title || 'Event',
      caption: p.content,
      likes: p.likesCount || 0,
      comments: p.commentsCount || 0,
      liked: false,
      mediaCount: p.mediaUrls?.length || 1,
      profileImage: p.userId?.profileImage,
    }));

    res.json({
      success: true,
      data: {
        upcomingEvents,
        popularEvents,
        merchItems,
        highlights,
        favoritedEventIds,
      },
    });
  } catch (error) {
    console.error('Home data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load home data',
    });
  }
};

/**
 * GET /api/home (public - no auth required)
 * For unauthenticated users, still return home data (without favorited state)
 */
const getHomeDataPublic = async (req, res) => {
  req.user = null;
  return getHomeData(req, res);
};

module.exports = {
  getHomeData,
  getHomeDataPublic,
};
