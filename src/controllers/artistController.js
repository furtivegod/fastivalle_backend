/**
 * Artist Controller
 * Artist list and detail
 */

const Artist = require('../models/Artist');
const Event = require('../models/Event');
const EventArtist = require('../models/EventArtist');

const IMAGE_COLORS = ['#5C5C5C', '#8B7355', '#8B6914', '#6B5B7A', '#2D4739', '#4A6B8A', '#E87D2B'];
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
 * GET /api/artists
 * Returns all artists, optional ?search= for name filter
 */
const getArtists = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search && typeof search === 'string' && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const artistsRaw = await Artist.find(filter)
      .sort({ name: 1 })
      .lean();

    const artists = artistsRaw.map((a, idx) => ({
      id: a._id.toString(),
      name: a.name,
      profileImage: a.profileImage,
      imageColor: IMAGE_COLORS[idx % IMAGE_COLORS.length],
    }));

    res.json({
      success: true,
      data: artists,
    });
  } catch (error) {
    console.error('Artists list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load artists',
    });
  }
};

/**
 * GET /api/artists/:id
 * Returns artist detail with upcoming events and next appearance
 */
const getArtistById = async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await Artist.findById(id).lean();
    if (!artist) {
      return res.status(404).json({ success: false, error: 'Artist not found' });
    }

    // Events where this artist performs (via EventArtist)
    const eventLinks = await EventArtist.find({ artistId: artist._id })
      .select('eventId')
      .lean();
    const eventIds = [...new Set(eventLinks.map((l) => l.eventId.toString()))];

    const now = new Date();
    const eventsRaw = await Event.find({
      _id: { $in: eventIds },
      status: 'published',
      startDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .lean();

    // If no upcoming, include past for "next appearance"
    let eventsForNext = eventsRaw;
    if (eventsForNext.length === 0) {
      eventsForNext = await Event.find({
        _id: { $in: eventIds },
        status: 'published',
      })
        .sort({ startDate: -1 })
        .limit(5)
        .lean();
    }

    const formatEv = (e) => ({
      id: e._id.toString(),
      date: formatEventDate(e.startDate, e.startTime),
      attendees: e.attendeesCount || 0,
      title: e.title,
      subtitle: e.subtitle || '',
      stage: e.venue || '',
      coverImage: e.coverImage,
      coverColor: e.coverColor,
    });

    const upcomingEvents = eventsRaw.map(formatEv);
    const nextAppearance = eventsForNext.map(formatEv).map((e) => ({
      ...e,
      dateTime: e.date,
    }));

    res.json({
      success: true,
      data: {
        id: artist._id.toString(),
        name: artist.name,
        bio: artist.bio,
        profileImage: artist.profileImage,
        albumCover: artist.albumCover,
        albumTitle: artist.albumTitle,
        albumYear: artist.albumYear,
        streamingUrl: artist.streamingUrl,
        instagramUrl: artist.instagramUrl,
        facebookUrl: artist.facebookUrl,
        youtubeUrl: artist.youtubeUrl,
        spotifyUrl: artist.spotifyUrl,
        upcomingEvents,
        nextAppearance,
      },
    });
  } catch (error) {
    console.error('Artist detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load artist',
    });
  }
};

module.exports = {
  getArtists,
  getArtistById,
};
