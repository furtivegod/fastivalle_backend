/**
 * Schedule Controller
 * Aggregates data for the Schedule screen: events by month, sessions, favorites
 */

const Event = require('../models/Event');
const EventSession = require('../models/EventSession');
const UserFavorite = require('../models/UserFavorite');
const UserLineup = require('../models/UserLineup');
const LineupItem = require('../models/LineupItem');

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
 * GET /api/schedule
 * Returns all schedule data: events grouped by month, favorited IDs, event sessions
 */
const getScheduleData = async (req, res) => {
  try {
    const userId = req.user?._id;

    // 1. All published events, sorted by startDate
    const eventsRaw = await Event.find({ status: 'published' })
      .sort({ startDate: 1 })
      .lean();

    // 2. User's favorited event IDs
    let favoritedEventIds = [];
    if (userId) {
      const favs = await UserFavorite.find({ userId }).select('eventId').lean();
      favoritedEventIds = favs.map((f) => f.eventId.toString());
    }

    // 3. All event sessions
    const sessionsRaw = await EventSession.find()
      .sort({ eventId: 1, sortOrder: 1 })
      .lean();

    // 4. User's lineup session IDs (for "added" state in schedule modal)
    let userLineupSessionIds = new Set();
    if (userId) {
      const lineups = await UserLineup.find({ userId }).select('_id').lean();
      const lineupIds = lineups.map((l) => l._id);
      const lineupItems = await LineupItem.find({ lineupId: { $in: lineupIds } })
        .populate('eventSessionId', 'eventId')
        .lean();
      lineupItems.forEach((li) => {
        if (li.eventSessionId?.eventId) {
          userLineupSessionIds.add(li.eventSessionId._id.toString());
        }
      });
    }

    // Group sessions by eventId
    const sessionsByEventId = {};
    sessionsRaw.forEach((s) => {
      const eid = s.eventId.toString();
      if (!sessionsByEventId[eid]) sessionsByEventId[eid] = [];
      sessionsByEventId[eid].push({
        id: s._id.toString(),
        stage: s.stage,
        artist: s.artistName,
        startTime: s.startTime,
        day: s.day,
        added: userLineupSessionIds.has(s._id.toString()),
      });
    });

    // Group events by month
    const eventsByMonth = {};
    let firstFeaturedAssigned = false;

    eventsRaw.forEach((e) => {
      const d = new Date(e.startDate);
      const monthKey = MONTHS[d.getMonth()];
      if (!eventsByMonth[monthKey]) eventsByMonth[monthKey] = [];

      const eventId = e._id.toString();
      const hasLineup = (sessionsByEventId[eventId] || []).length > 0;
      const actionText = e.isTopLevel && hasLineup ? 'Curate My LineUp' : 'View Schedule';
      const featured = !firstFeaturedAssigned && hasLineup;
      if (featured) firstFeaturedAssigned = true;

      eventsByMonth[monthKey].push({
        id: eventId,
        date: formatEventDate(e.startDate, e.startTime),
        title: e.title?.length > 25 ? `${e.title.substring(0, 22)}...` : e.title,
        actionText,
        imageColor: e.coverColor || '#E87D2B',
        featured,
        liked: favoritedEventIds.includes(eventId),
        subtitle: e.subtitle || '',
        stage: e.venue || '',
        attendees: e.attendeesCount || 0,
        coverImage: e.coverImage,
      });
    });

    // Recommended event for "Get Tickets" (first event with future date or most recent)
    const now = new Date();
    const upcoming = eventsRaw.filter((e) => new Date(e.startDate) >= now);
    const recommendedEvent = upcoming[0] || eventsRaw[eventsRaw.length - 1];
    const recommendedPayload = recommendedEvent
      ? {
          id: recommendedEvent._id.toString(),
          date: formatEventDate(recommendedEvent.startDate, recommendedEvent.startTime),
          attendees: recommendedEvent.attendeesCount || 0,
          title: recommendedEvent.title,
          subtitle: recommendedEvent.subtitle || '',
          stage: recommendedEvent.venue || '',
          coverImage: recommendedEvent.coverImage,
          coverColor: recommendedEvent.coverColor,
        }
      : null;

    res.json({
      success: true,
      data: {
        eventsByMonth,
        favoritedEventIds,
        eventSessions: sessionsByEventId,
        recommendedEvent: recommendedPayload,
      },
    });
  } catch (error) {
    console.error('Schedule data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load schedule data',
    });
  }
};

module.exports = {
  getScheduleData,
};
