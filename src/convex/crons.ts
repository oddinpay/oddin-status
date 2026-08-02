import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "clear_old_schedules",
  { hourUTC: 0, minuteUTC: 0 },
  internal.schedules.cleanup,
);

crons.daily(
  "clear_old_incidents",
  { hourUTC: 0, minuteUTC: 0 },
  internal.incidents.cleanup,
);

export default crons;
