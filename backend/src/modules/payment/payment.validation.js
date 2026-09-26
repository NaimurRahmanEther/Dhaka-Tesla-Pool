const { z } = require("zod");

const createPaymentSchema = z.object({
  method: z.enum(["CASH", "TESLA_WALLET"]).default("CASH"),
});

module.exports = {
  createPaymentSchema,
};
