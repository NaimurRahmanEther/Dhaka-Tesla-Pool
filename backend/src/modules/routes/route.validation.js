const { z } = require("zod");

const createRouteSchema = z.object({
  destinationLocationId: z.number().int().positive(),
});

module.exports = {
  createRouteSchema,
};
