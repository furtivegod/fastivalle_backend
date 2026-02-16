/**
 * Lineup Controller
 * User's saved lineups (My Schedule)
 */

const UserLineup = require('../models/UserLineup');
const LineupItem = require('../models/LineupItem');
const Event = require('../models/Event');
const EventSession = require('../models/EventSession');

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
 * GET /api/lineup
 * Returns all of user's lineups (event + lineup slots). Auth required.
 */
const getMyLineups = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const lineupsRaw = await UserLineup.find({ userId })
      .populate('eventId', 'title startDate startTime coverImage coverColor')
      .sort({ createdAt: -1 })
      .lean();

    const result = [];

    for (const ul of lineupsRaw) {
      const event = ul.eventId;
      if (!event) continue;

      const lineupItems = await LineupItem.find({ lineupId: ul._id })
        .populate('eventSessionId')
        .lean();

      const sessions = lineupItems
        .filter((li) => li.eventSessionId)
        .map((li) => li.eventSessionId);

      // Group by startTime
      const byTime = {};
      sessions.forEach((s) => {
        const t = s.startTime || '00:00';
        if (!byTime[t]) byTime[t] = [];
        byTime[t].push({ stage: s.stage, artist: s.artistName, added: true });
      });

      const slots = Object.entries(byTime)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, items]) => ({ time, items }));

      result.push({
        event: {
          id: event._id.toString(),
          title: event.title,
          date: formatEventDate(event.startDate, event.startTime),
          coverImage: event.coverImage,
          coverColor: event.coverColor,
        },
        slots,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Lineup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load lineup',
    });
  }
};

module.exports = {
  getMyLineups,
};
