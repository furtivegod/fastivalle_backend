# Migrations & Seed Data

## Seed Mock Data

Populates the database with mock data for development and testing.

### Prerequisites

- `MONGODB_URI` set in `.env`
- MongoDB running and accessible

### Commands

```bash
# Seed data (adds to existing data)
npm run seed

# Clear all seed data and re-seed from scratch
npm run seed:clear
```

### Options (when running directly)

```bash
node migrations/001_seed_mock_data.js [options]
```

- `--clear` - Delete all seed data before inserting
- `--skip-users` - Skip seeding users (use existing users)

### Demo Credentials

After seeding:
- **Email:** demo@fastivalle.com
- **Password:** Password123!

### Data Created

- **Users:** 7 demo users
- **Events:** 8 events (festivals, concerts, worship)
- **Artists:** 11 artists with event links
- **Event Sessions:** 7 lineup items
- **Partners:** 8 partners
- **Ticket Types:** Per event (standard, fan, vip × general/group)
- **Orders & Tickets:** 2 sample orders for demo user
- **User Favorites:** My Events entries
- **User Lineups:** Sample curated lineup
- **Event Followers:** Sample followers
- **Products:** 8 merch items
- **Workshops:** 4 workshops with enrollments
- **Connections:** Friend connections
- **Posts:** 2 sample posts
