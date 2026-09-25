const { z } = require("zod");

const createVehicleSchema = z.object({
  model: z.string().min(2, "Vehicle model required"),
  capacity: z.number().int().positive(),
  currentLocationId: z.number().int().positive(),
});

const updateVehicleSchema = z.object({
  model: z.string().min(2).optional(),
  capacity: z.number().int().positive().optional(),
  currentLocationId: z.number().int().positive().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["ONLINE", "OFFLINE"]),
});

module.exports = {
  createVehicleSchema,
  updateVehicleSchema,
  updateStatusSchema,
};
