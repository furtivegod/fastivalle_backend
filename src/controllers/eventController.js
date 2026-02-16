/**
 * Event Controller
 * Single event detail for EventScreen
 */

const Event = require('../models/Event');
const EventSession = require('../models/EventSession');
const EventArtist = require('../models/EventArtist');
const Artist = require('../models/Artist');
const EventPartner = require('../models/EventPartner');
const Partner = require('../models/Partner');
const Post = require('../models/Post');
const EventFollower = require('../models/EventFollower');
const UserFavorite = require('../models/UserFavorite');
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
 * GET /api/events/:id
 * Returns full event detail for EventScreen
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const event = await Event.findById(id).lean();
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const eventId = event._id.toString();

    // Lineup: EventSession grouped by day, then by time
    const sessionsRaw = await EventSession.find({ eventId: event._id })
      .sort({ sortOrder: 1, startTime: 1 })
      .lean();

    const lineupByDay = {};
    sessionsRaw.forEach((s) => {
      const day = s.day || 'Day 1';
      if (!lineupByDay[day]) lineupByDay[day] = {};
      const t = s.startTime || '00:00';
      if (!lineupByDay[day][t]) lineupByDay[day][t] = [];
      lineupByDay[day][t].push({ stage: s.stage, artist: s.artistName });
    });

    const lineup = Object.entries(lineupByDay).map(([date, times]) => ({
      date,
      times: Object.entries(times)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, items]) => ({ time, items })),
    }));

    // Artists: EventArtist + Artist
    const eventArtistsRaw = await EventArtist.find({ eventId: event._id })
      .populate('artistId', 'name profileImage')
      .sort({ sortOrder: 1 })
      .lean();

    const artists = eventArtistsRaw
      .filter((ea) => ea.artistId)
      .map((ea, idx) => ({
        id: ea.artistId._id.toString(),
        name: ea.artistId.name,
        profileImage: ea.artistId.profileImage,
        imageColor: ['#5C5C5C', '#8B7355', '#4A6B8A', '#E87D2B', '#2D4739'][idx % 5],
      }));

    // Partners: EventPartner + Partner
    const eventPartnersRaw = await EventPartner.find({ eventId: event._id })
      .populate('partnerId', 'name logo websiteUrl')
      .sort({ sortOrder: 1 })
      .lean();

    const partners = eventPartnersRaw
      .filter((ep) => ep.partnerId)
      .map((ep) => ({
        id: ep.partnerId._id.toString(),
        name: ep.partnerId.name,
        logo: ep.partnerId.logo,
        websiteUrl: ep.partnerId.websiteUrl,
      }));

    // Posts for this event
    const postsRaw = await Post.find({ eventId: event._id })
      .populate('userId', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const posts = postsRaw.map((p) => ({
      id: p._id.toString(),
      name: p.userId?.name || 'User',
      timeAgo: timeAgo(p.createdAt),
      text: p.content,
      avatarColor: '#E87D2B',
      profileImage: p.userId?.profileImage,
      likes: p.likesCount || 0,
      comments: p.commentsCount || 0,
    }));

    // Followers for "interested" avatars
    const followersRaw = await EventFollower.find({ eventId: event._id })
      .populate('userId', 'name profileImage')
      .limit(4)
      .lean();

    const followerAvatars = followersRaw.map((f) => ({
      id: f.userId?._id?.toString(),
      name: f.userId?.name,
      profileImage: f.userId?.profileImage,
    }));

    // Liked (favorited)
    let liked = false;
    if (userId) {
      const fav = await UserFavorite.findOne({ userId, eventId: event._id });
      liked = !!fav;
    }

    const dateFormatted = formatEventDate(event.startDate, event.startTime);
    const dateDisplay = dateFormatted.split(',')[0]?.replace(/^([A-Z]{3})/, (m) => m.charAt(0) + m.slice(1).toLowerCase()) || '';
    const timeDisplay = dateFormatted.includes(',') ? dateFormatted.split(',')[1]?.trim() || event.startTime || '10:00 AM' : event.startTime || '10:00 AM';

    res.json({
      success: true,
      data: {
        id: eventId,
        title: event.title,
        subtitle: event.subtitle || '',
        description: event.description || '',
        date: dateFormatted,
        dateDisplay,
        timeDisplay,
        venue: event.venue || '',
        address: event.address || '',
        coverImage: event.coverImage,
        coverColor: event.coverColor || '#E87D2B',
        attendees: event.attendeesCount || 0,
        stage: event.venue || '',
        liked,
        lineup,
        artists,
        partners,
        posts,
        followerAvatars,
      },
    });
  } catch (error) {
    console.error('Event detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load event',
    });
  }
};

/**
 * GET /api/events/:id/ticket-types
 * Returns ticket types for GetTicketScreen (general + group)
 */
const getEventTicketTypes = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).select('title').lean();
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const types = await TicketType.find({ eventId: id })
      .sort({ sortOrder: 1, ticketType: 1 })
      .lean();

    const mapType = (t) => ({
      id: t._id.toString(),
      name: t.name,
      price: t.price,
      currency: t.currency || 'USD',
      description: t.description || 'Ticket includes full event entry.',
      ticketType: t.ticketType,
      soldOut: !!t.soldOut,
      maxPerUser: t.maxPerUser,
      minForGroup: t.minForGroup,
      maxForGroup: t.maxForGroup,
      dotColor: t.ticketType === 'standard' ? '#9E9E9E' : t.ticketType === 'fan' ? '#2196F3' : '#F44336',
    });

    const generalTickets = types
      .filter((t) => t.category === 'general')
      .map((t) => ({
        ...mapType(t),
        qtyKey: t.ticketType,
      }));

    const groupTickets = types
      .filter((t) => t.category === 'group')
      .map(mapType);

    res.json({
      success: true,
      data: {
        generalTickets,
        groupTickets,
      },
    });
  } catch (error) {
    console.error('Event ticket types error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load ticket types',
    });
  }
};

module.exports = {
  getEventById,
  getEventTicketTypes,
};
