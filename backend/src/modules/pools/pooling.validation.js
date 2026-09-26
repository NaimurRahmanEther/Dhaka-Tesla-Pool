const { z } = require("zod");

const addPassengerSchema = z.object({
  rideId: z.number().int().positive(),
});

module.exports = {
  addPassengerSchema,
};
