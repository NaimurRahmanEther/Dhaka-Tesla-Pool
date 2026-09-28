const { z } = require("zod");

const createRouteSchema = z.object({
  currentLocationId: z.number().int().positive().optional(),
  destinationLocationId: z.number().int().positive(),
});

module.exports = {
  createRouteSchema,
};
