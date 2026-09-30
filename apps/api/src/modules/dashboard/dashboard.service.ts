import { addDays, type DashboardDto } from '@kontora/contracts';
import { dayRange, today } from '../../lib/time.js';
import { Client } from '../../models/client.model.js';
import { Visit } from '../../models/visit.model.js';
import { dailySeries, lastDays } from '../stats/stats.service.js';
import { toVisitDto, visitPopulate } from '../visits/visits.mapper.js';

const UPCOMING_DAYS = 7;
const UPCOMING_LIMIT = 8;

export async function getDashboard(): Promise<DashboardDto> {
  const day = today();
  const { start, end } = dayRange(day, day);
  const pending = { issuedAt: null };
  const range14 = lastDays(14, day);

  const [todayVisits, upcoming, pickupsToday, overdue, inProgress, clients, last14Days] = await Promise.all([
    Visit.find({ date: { $gte: start, $lt: end } }).sort({ date: 1 }).populate(visitPopulate).lean(),
    Visit.find({ ...pending, pickupDate: { $gte: day, $lte: addDays(day, UPCOMING_DAYS) } })
      .sort({ pickupDate: 1, date: 1 })
      .limit(UPCOMING_LIMIT)
      .populate(visitPopulate)
      .lean(),
    Visit.countDocuments({ ...pending, pickupDate: day }),
    Visit.countDocuments({ ...pending, pickupDate: { $lt: day } }),
    Visit.countDocuments(pending),
    Client.estimatedDocumentCount(),
    dailySeries(range14.from, range14.to),
  ]);

  return {
    today: day,
    counts: { todayVisits: todayVisits.length, pickupsToday, overdue, clients, inProgress },
    todayVisits: todayVisits.map((v) => toVisitDto(v, day)),
    upcomingPickups: upcoming.map((v) => toVisitDto(v, day)),
    last14Days,
  };
}
