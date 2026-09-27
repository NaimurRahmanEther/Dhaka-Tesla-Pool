const { z } = require("zod");

const acceptRideSchema = z.object({
  changeRoute: z.boolean().default(false),
}).default({ changeRoute: false });

module.exports = { acceptRideSchema };
