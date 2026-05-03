import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.daily("clear_old_schedules", { hourUTC: 0, minuteUTC: 0 }, api.schedules.cleanup);

export default crons;

// import { cronJobs } from "convex/server";
// import { api } from "./_generated/api";

// const crons = cronJobs();

// crons.interval(
//     "clear_old_schedules_every_minute",
//     { minutes: 1 },
//     api.schedules.cleanup
// );

// export default crons;