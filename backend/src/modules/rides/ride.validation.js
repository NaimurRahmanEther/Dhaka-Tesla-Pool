const { z } = require("zod");

const createRideSchema = z.object({
  pickupLocationId: z.number().int().positive(),
  destinationLocationId: z.number().int().positive(),
  seatsRequested: z.number().int().positive(),
});

module.exports = {
  createRideSchema,
};
