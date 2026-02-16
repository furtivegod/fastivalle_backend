/**
 * Seed Mock Data Migration
 *
 * Populates the database with mock data for development and testing.
 * Run: node migrations/001_seed_mock_data.js
 *
 * Options:
 *   --clear    Clear all seed data before inserting (drops and recreates collections)
 *   --skip-users  Skip seeding users (keeps existing users)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

// Models
const User = require('../src/models/User');
const Event = require('../src/models/Event');
const EventSession = require('../src/models/EventSession');
const Artist = require('../src/models/Artist');
const EventArtist = require('../src/models/EventArtist');
const Partner = require('../src/models/Partner');
const EventPartner = require('../src/models/EventPartner');
const TicketType = require('../src/models/TicketType');
const Order = require('../src/models/Order');
const OrderItem = require('../src/models/OrderItem');
const Ticket = require('../src/models/Ticket');
const UserFavorite = require('../src/models/UserFavorite');
const UserLineup = require('../src/models/UserLineup');
const LineupItem = require('../src/models/LineupItem');
const EventFollower = require('../src/models/EventFollower');
const Product = require('../src/models/Product');
const Workshop = require('../src/models/Workshop');
const WorkshopEnrollment = require('../src/models/WorkshopEnrollment');
const Connection = require('../src/models/Connection');
const Post = require('../src/models/Post');

const args = process.argv.slice(2);
const CLEAR_FIRST = args.includes('--clear');
const SKIP_USERS = args.includes('--skip-users');

const MODELS_TO_CLEAR = [
  Post, WorkshopEnrollment, Workshop, Connection, Product,
  LineupItem, UserLineup, EventFollower, UserFavorite,
  Ticket, OrderItem, Order, TicketType, EventPartner,
  Partner, EventArtist, EventSession, Artist, Event,
];
if (!SKIP_USERS) MODELS_TO_CLEAR.push(User);

async function clearCollections() {
  if (!CLEAR_FIRST) return;
  console.log('Clearing existing seed data...');
  // Clear in reverse order of dependencies to avoid FK issues (MongoDB has no FK but helps with refs)
  for (const Model of MODELS_TO_CLEAR) {
    try {
      const name = Model.collection.name;
      await Model.deleteMany({});
      console.log(`  Cleared: ${name}`);
    } catch (e) {
      if (e.codeName !== 'NamespaceNotFound') console.warn(`  Skip ${Model.modelName}:`, e.message);
    }
  }
}

async function seed() {
  await connectDB();

  await clearCollections();

  let users = [];
  let events = [];
  let artists = [];
  let partners = [];
  let ticketTypes = [];
  let products = [];
  let workshops = [];

  // ─── 1. Users ─────────────────────────────────────────────────────────────
  if (!SKIP_USERS) {
    console.log('Seeding users...');
    const hashedPassword = await require('bcryptjs').hash('Password123!', 12);
    users = await User.insertMany([
      {
        email: 'demo@fastivalle.com',
        password: hashedPassword,
        name: 'Demo User',
        authProvider: 'local',
        isVerified: true,
      },
      {
        email: 'ashley@example.com',
        password: hashedPassword,
        name: 'Ashley Lubin',
        authProvider: 'local',
        isVerified: true,
      },
      {
        email: 'avery@example.com',
        password: hashedPassword,
        name: 'Avery Collins',
        authProvider: 'local',
        isVerified: true,
      },
      {
        email: 'alex@example.com',
        password: hashedPassword,
        name: 'Alex Johnson',
        authProvider: 'local',
        isVerified: true,
      },
      {
        email: 'sarah@example.com',
        password: hashedPassword,
        name: 'Sarah Miller',
        authProvider: 'local',
        isVerified: true,
      },
      {
        email: 'mike@example.com',
        password: hashedPassword,
        name: 'Mike Chen',
        authProvider: 'local',
        isVerified: true,
      },
      {
        email: 'jacob@example.com',
        password: hashedPassword,
        name: 'Jacob Jones',
        authProvider: 'local',
        isVerified: true,
      },
    ]);
    console.log(`  Created ${users.length} users`);
  } else {
    users = await User.find().limit(7).lean();
    if (users.length === 0) {
      console.warn('No users found. Run without --skip-users to seed users.');
      process.exit(1);
    }
    users = users.map((u) => ({ _id: u._id, ...u }));
  }

  const user1 = users[0];
  const user2 = users[1];
  const user3 = users[2];
  const user4 = users[3];
  const user5 = users[4];
  const user6 = users[5];
  const user7 = users[6];

  // ─── 2. Events ────────────────────────────────────────────────────────────
  console.log('Seeding events...');
  const eventData = [
    {
      title: 'kingdom community meetup',
      subtitle: 'WORSHIP',
      description: 'Join us for an uplifting worship experience. Connect with your community and grow in faith.',
      startDate: new Date('2025-08-15T10:00:00'),
      endDate: new Date('2025-08-15T12:00:00'),
      startTime: '10:00 AM',
      venue: 'MAIN STAGE',
      address: '1234 Sunset Blvd, Los Angeles, CA 90028',
      coverColor: '#E87D2B',
      isTopLevel: false,
      attendeesCount: 54,
      status: 'published',
    },
    {
      title: 'praise & worship',
      subtitle: 'WORSHIP',
      description: 'An evening of praise and worship.',
      startDate: new Date('2025-08-16T14:00:00'),
      startTime: '2:00 PM',
      venue: 'MAIN STAGE',
      address: '1234 Sunset Blvd, Los Angeles, CA 90028',
      coverColor: '#D4A84B',
      isTopLevel: false,
      attendeesCount: 32,
      status: 'published',
    },
    {
      title: 'fastivalle',
      subtitle: 'FESTIVAL',
      description: 'The main Fastivalle festival experience.',
      startDate: new Date('2025-03-05T00:00:00'),
      endDate: new Date('2025-03-07T23:59:59'),
      venue: 'CAMPTOWN',
      address: '1234 Sunset Blvd, Los Angeles, CA 90028',
      coverColor: '#E8A84B',
      isTopLevel: true,
      attendeesCount: 500,
      status: 'published',
    },
    {
      title: 'evening of hope',
      subtitle: 'CONCERT',
      description: 'An evening of hope and inspiration.',
      startDate: new Date('2025-08-15T18:00:00'),
      startTime: '6:00 PM',
      venue: 'MAIN STAGE',
      address: '1234 Sunset Blvd, Los Angeles, CA 90028',
      coverColor: '#D4A84B',
      attendeesCount: 83,
      status: 'published',
    },
    {
      title: 'fasting focus weekend',
      subtitle: 'WORKSHOP',
      description: 'A weekend of fasting and spiritual focus.',
      startDate: new Date('2025-08-16T20:00:00'),
      startTime: '8:00 PM',
      venue: 'GARDEN',
      address: '1234 Sunset Blvd, Los Angeles, CA 90028',
      coverColor: '#2D4739',
      attendeesCount: 152,
      status: 'published',
    },
    {
      title: 'youth revival',
      subtitle: 'CONCERT',
      description: 'Youth revival night.',
      startDate: new Date('2025-08-13T00:00:00'),
      venue: 'MAIN STAGE',
      address: '1234 Sunset Blvd, Los Angeles, CA 90028',
      coverColor: '#E87D2B',
      attendeesCount: 120,
      status: 'published',
    },
    {
      title: 'christian music festival',
      subtitle: 'FESTIVAL',
      description: 'Multi-day Christian music festival.',
      startDate: new Date('2025-08-15T10:00:00'),
      endDate: new Date('2025-08-20T22:00:00'),
      venue: 'CAMPTOWN',
      address: '1234 Sunset Blvd, Los Angeles, CA 90028',
      coverColor: '#2D4739',
      isTopLevel: true,
      attendeesCount: 1000,
      status: 'published',
    },
    {
      title: 'kingdom community...',
      subtitle: 'FESTIVAL',
      description: 'Festival experience.',
      startDate: new Date('2025-08-15T00:00:00'),
      endDate: new Date('2025-08-17T23:59:59'),
      venue: '1234 SUNSET BLVD, LOS ANGELES',
      address: '1234 Sunset Blvd, Los Angeles, CA 90028',
      coverColor: '#E87D2B',
      isTopLevel: true,
      attendeesCount: 54,
      status: 'published',
    },
  ];

  events = await Event.insertMany(eventData);
  console.log(`  Created ${events.length} events`);

  const [ev1, ev2, ev3, ev4, ev5, ev6, ev7, ev8] = events;

  // ─── 3. Artists ───────────────────────────────────────────────────────────
  console.log('Seeding artists...');
  artists = await Artist.insertMany([
    { name: 'Mike Howard', bio: 'Worship leader and songwriter.' },
    { name: 'Annette Smith', bio: 'Gospel artist and speaker.' },
    { name: 'Andrew Jones', bio: 'Contemporary Christian musician.' },
    { name: 'Andrew Williamson', bio: 'Andrew Williamson is a worship leader and songwriter focused on Scripture-centered worship and honest, prayerful moments. He serves his local church, writes songs for congregational singing, and carries a heart for spiritual renewal.', albumTitle: 'Heaven in the Room', albumYear: '2025', streamingUrl: 'https://open.spotify.com' },
    { name: 'Adam Brown', bio: 'Singer and worship leader.' },
    { name: 'Sarah Miller', bio: 'Christian artist.' },
    { name: 'David King', bio: 'Worship leader.' },
    { name: 'Tauren Wells', bio: 'Artist and worship leader.' },
    { name: 'Rocky & the Queen', bio: 'Folk worship duo.' },
    { name: 'Heart & Soul', bio: 'CCM band.' },
    { name: 'Worship Collective', bio: 'Community worship group.' },
  ]);
  console.log(`  Created ${artists.length} artists`);

  const [art1, art2, art3, art4, art5, art6, art7, art8, art9, art10, art11] = artists;

  // ─── 4. Event Artists ─────────────────────────────────────────────────────
  await EventArtist.insertMany([
    { eventId: ev1._id, artistId: art1._id, sortOrder: 1 },
    { eventId: ev1._id, artistId: art2._id, sortOrder: 2 },
    { eventId: ev1._id, artistId: art4._id, sortOrder: 3 },
    { eventId: ev2._id, artistId: art3._id, sortOrder: 1 },
    { eventId: ev3._id, artistId: art4._id, sortOrder: 1 },
    { eventId: ev4._id, artistId: art5._id, sortOrder: 1 },
    { eventId: ev5._id, artistId: art6._id, sortOrder: 1 },
    { eventId: ev6._id, artistId: art4._id, sortOrder: 1 },
    { eventId: ev7._id, artistId: art8._id, sortOrder: 1 },
    { eventId: ev7._id, artistId: art9._id, sortOrder: 2 },
    { eventId: ev7._id, artistId: art10._id, sortOrder: 3 },
  ]);
  console.log('  Created event-artist links');

  // ─── 5. Event Sessions (Lineup) ───────────────────────────────────────────
  console.log('Seeding event sessions...');
  const sessionData = [
    { eventId: ev7._id, stage: 'R&B MAINSTAGE', artistName: 'tauren wells', artistId: art8._id, startTime: '10:00', day: 'Aug 15', sortOrder: 1 },
    { eventId: ev7._id, stage: 'FOLK ORANGE', artistName: 'rocky & the queen', artistId: art9._id, startTime: '10:00', day: 'Aug 15', sortOrder: 2 },
    { eventId: ev7._id, stage: 'MARKET GARDEN', artistName: 'pop up', startTime: '11:00', day: 'Aug 15', sortOrder: 3 },
    { eventId: ev7._id, stage: 'MAIN STAGE', artistName: 'worship collective', artistId: art11._id, startTime: '10:00', day: 'Aug 16', sortOrder: 4 },
    { eventId: ev3._id, stage: 'R&B MAINSTAGE', artistName: 'tauren wells', artistId: art8._id, startTime: '10:00', day: 'MAR 5', sortOrder: 1 },
    { eventId: ev3._id, stage: 'CCM GARDEN', artistName: 'heart & soul', artistId: art10._id, startTime: '11:00', day: 'MAR 5', sortOrder: 2 },
    { eventId: ev3._id, stage: 'FOLK ORANGE', artistName: 'rocky & the queen', artistId: art9._id, startTime: '12:00', day: 'MAR 5', sortOrder: 3 },
  ];
  const eventSessions = await EventSession.insertMany(sessionData);
  console.log(`  Created ${eventSessions.length} event sessions`);

  // ─── 6. Partners ──────────────────────────────────────────────────────────
  console.log('Seeding partners...');
  partners = await Partner.insertMany([
    { name: 'GMA', sortOrder: 1 },
    { name: 'Spotify', sortOrder: 2 },
    { name: 'World Vision', sortOrder: 3 },
    { name: 'Canon', sortOrder: 4 },
    { name: 'Dole', sortOrder: 5 },
    { name: 'Amazon', sortOrder: 6 },
    { name: 'Dell', sortOrder: 7 },
    { name: 'Accenture', sortOrder: 8 },
  ]);
  console.log(`  Created ${partners.length} partners`);

  await EventPartner.insertMany(
    partners.slice(0, 6).map((p, i) => ({ eventId: ev7._id, partnerId: p._id, sortOrder: i + 1 }))
  );
  console.log('  Created event-partner links');

  // ─── 7. Ticket Types ──────────────────────────────────────────────────────
  console.log('Seeding ticket types...');
  const ticketTypeData = [];
  for (const ev of events) {
    ticketTypeData.push(
      { eventId: ev._id, name: 'standard ticket', price: 20, description: 'Full event entry, a bottle of water, and a notebook.', category: 'general', ticketType: 'standard', maxPerUser: 5 },
      { eventId: ev._id, name: 'fan ticket', price: 25, description: 'Full event entry, a bottle of water, and a raincover.', category: 'general', ticketType: 'fan', maxPerUser: 5 },
      { eventId: ev._id, name: 'vip ticket', price: 45, description: 'Full event entry, VIP access.', category: 'general', ticketType: 'vip', maxPerUser: 5, soldOut: ev._id.toString() === ev7._id.toString() }
    );
    ticketTypeData.push(
      { eventId: ev._id, name: 'standard ticket', price: 20, description: 'Ticket includes full event entry.', category: 'group', ticketType: 'standard', minForGroup: 5, maxForGroup: 25 },
      { eventId: ev._id, name: 'fan ticket', price: 25, description: 'Ticket includes full event entry.', category: 'group', ticketType: 'fan', minForGroup: 5, maxForGroup: 25 },
      { eventId: ev._id, name: 'vip ticket', price: 30, description: 'Ticket includes full event entry.', category: 'group', ticketType: 'vip', minForGroup: 5, maxForGroup: 25 }
    );
  }
  ticketTypes = await TicketType.insertMany(ticketTypeData);
  console.log(`  Created ${ticketTypes.length} ticket types`);

  // ─── 8. Orders, OrderItems, Tickets ───────────────────────────────────────
  if (users.length > 0 && user1 && user2) {
    console.log('Seeding orders and tickets...');
    const ttGeneralEv1 = ticketTypes.find((t) => t.eventId.toString() === ev1._id.toString() && t.category === 'general' && t.ticketType === 'standard');
    const ttGroupEv7 = ticketTypes.find((t) => t.eventId.toString() === ev7._id.toString() && t.category === 'group' && t.ticketType === 'standard');

    const order1 = await Order.create({
      userId: user1._id,
      eventId: ev7._id,
      orderNumber: '123AXQ-r4556',
      totalAmount: 100,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'apple_pay',
      purchasedAt: new Date(),
    });

    const oi1 = await OrderItem.create({
      orderId: order1._id,
      ticketTypeId: ttGroupEv7._id,
      quantity: 5,
      unitPrice: 20,
      category: 'group',
      ticketTypeName: 'STANDARD',
    });

    for (let i = 0; i < 5; i++) {
      await Ticket.create({
        orderItemId: oi1._id,
        ticketNumber: `TKT-${order1.orderNumber}-${i + 1}`,
        status: i < 2 ? 'valid' : 'used',
        assignedToUserId: i === 0 ? user1._id : (i === 1 && user2) ? user2._id : null,
        qrCode: `QR-${order1.orderNumber}-${i + 1}`,
      });
    }

    const order2 = await Order.create({
      userId: user1._id,
      eventId: ev1._id,
      orderNumber: '456BXY-r7890',
      totalAmount: 20,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'apple_pay',
      purchasedAt: new Date(),
    });

    const oi2 = await OrderItem.create({
      orderId: order2._id,
      ticketTypeId: ttGeneralEv1._id,
      quantity: 1,
      unitPrice: 20,
      category: 'general',
      ticketTypeName: 'STANDARD',
    });

    await Ticket.create({
      orderItemId: oi2._id,
      ticketNumber: `TKT-${order2.orderNumber}-1`,
      status: 'valid',
      assignedToUserId: user1._id,
      qrCode: `QR-${order2.orderNumber}-1`,
    });

    console.log('  Created orders and tickets');
  }

  // ─── 9. User Favorites (My Events) ────────────────────────────────────────
  if (users.length > 0 && user1) {
    console.log('Seeding user favorites...');
    const favs = [
      { userId: user1._id, eventId: ev1._id },
      { userId: user1._id, eventId: ev3._id },
      { userId: user1._id, eventId: ev4._id },
    ];
    if (user2) {
      favs.push({ userId: user2._id, eventId: ev1._id }, { userId: user2._id, eventId: ev5._id });
    }
    await UserFavorite.insertMany(favs);
    console.log('  Created user favorites');
  }

  // ─── 10. User Lineups & Lineup Items ──────────────────────────────────────
  if (users.length > 0 && user1 && eventSessions.length > 0) {
    console.log('Seeding user lineups...');
    const lineup = await UserLineup.create({ userId: user1._id, eventId: ev7._id });
    await LineupItem.insertMany([
      { lineupId: lineup._id, eventSessionId: eventSessions[0]._id },
      { lineupId: lineup._id, eventSessionId: eventSessions[1]._id },
      { lineupId: lineup._id, eventSessionId: eventSessions[2]._id },
    ]);
    console.log('  Created user lineups');
  }

  // ─── 11. Event Followers ──────────────────────────────────────────────────
  if (users.length > 0 && user1) {
    console.log('Seeding event followers...');
    const followers = users.slice(0, 4).map((u) => ({ userId: u._id, eventId: ev7._id }));
    await EventFollower.insertMany(followers);
    console.log('  Created event followers');
  }

  // ─── 12. Products (Merch) ─────────────────────────────────────────────────
  console.log('Seeding products...');
  products = await Product.insertMany([
    { name: 'wave of worship fastivalle t-shirt', price: 29, category: 'Apparel', tag: 'NEW IN', tagColor: '#E87D2B', inStock: true, sortOrder: 1 },
    { name: 'black cotton t-shirt', price: 35, category: 'Apparel', tag: 'LIMITED', tagColor: '#D4A84B', inStock: true, sortOrder: 2 },
    { name: 'Fastivalle T-Shirt', price: 29.99, category: 'Apparel', inStock: true, sortOrder: 3 },
    { name: 'Festival Hoodie', price: 49.99, category: 'Apparel', inStock: true, sortOrder: 4 },
    { name: 'Logo Cap', price: 19.99, category: 'Accessories', inStock: false, sortOrder: 5 },
    { name: 'Festival Poster', price: 14.99, category: 'Accessories', inStock: true, sortOrder: 6 },
    { name: 'Water Bottle', price: 12.99, category: 'Accessories', inStock: true, sortOrder: 7 },
    { name: 'Tote Bag', price: 15.99, category: 'Accessories', inStock: true, sortOrder: 8 },
  ]);
  console.log(`  Created ${products.length} products`);

  // ─── 13. Workshops ────────────────────────────────────────────────────────
  console.log('Seeding workshops...');
  workshops = await Workshop.insertMany([
    { title: 'Music Production Basics', instructor: 'DJ Mixmaster', startTime: '2:00 PM', endTime: '4:00 PM', location: 'Workshop Tent', level: 'Beginner', capacity: 30, enrolledCount: 15 },
    { title: 'Songwriting Workshop', instructor: 'Singer Songwriter', startTime: '10:00 AM', endTime: '12:00 PM', location: 'Acoustic Stage', level: 'Intermediate', capacity: 20, enrolledCount: 18 },
    { title: 'Live Performance Tips', instructor: 'Headliner Band', startTime: '3:00 PM', endTime: '5:00 PM', location: 'Main Stage', level: 'All Levels', capacity: 50, enrolledCount: 32 },
    { title: 'DJ Mixing Techniques', instructor: 'DJ Nightlife', startTime: '6:00 PM', endTime: '8:00 PM', location: 'DJ Stage', level: 'Advanced', capacity: 25, enrolledCount: 25 },
  ]);
  console.log(`  Created ${workshops.length} workshops`);

  if (users.length > 0 && user1) {
    await WorkshopEnrollment.insertMany([
      { userId: user1._id, workshopId: workshops[0]._id },
      { userId: user1._id, workshopId: workshops[2]._id },
    ]);
    console.log('  Created workshop enrollments');
  }

  // ─── 14. Connections (Friends) ────────────────────────────────────────────
  if (users.length >= 2 && user1 && user2) {
    console.log('Seeding connections...');
    const conns = [
      { userId: user1._id, friendId: user2._id, status: 'accepted' },
      { userId: user2._id, friendId: user1._id, status: 'accepted' },
    ];
    if (user3) conns.push({ userId: user1._id, friendId: user3._id, status: 'accepted' }, { userId: user3._id, friendId: user1._id, status: 'accepted' });
    if (user4) conns.push({ userId: user1._id, friendId: user4._id, status: 'accepted' });
    await Connection.insertMany(conns);
    console.log('  Created connections');
  }

  // ─── 15. Posts ────────────────────────────────────────────────────────────
  if (users.length >= 2 && user2) {
    console.log('Seeding posts...');
    const posts = [{ userId: user2._id, eventId: ev5._id, content: 'So much peace, so much love – grateful to be part of this moment.', likesCount: 124, commentsCount: 8 }];
    if (user3) posts.push({ userId: user3._id, eventId: ev1._id, content: 'So thankful to worship together. My soul feels lighter.', likesCount: 16, commentsCount: 4 });
    await Post.insertMany(posts);
    console.log('  Created posts');
  }

  console.log('\n✅ Seed completed successfully!');
  console.log('\nDemo login: demo@fastivalle.com / Password123!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
