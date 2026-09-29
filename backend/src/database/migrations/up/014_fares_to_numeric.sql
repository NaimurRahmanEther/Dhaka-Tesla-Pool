-- Fares are no longer whole Taka.
--
-- A shared trip's cost is split proportionally between riders, so the exact
-- share is rarely a whole number: three riders over an 8 km trip get
-- 105.00 / 39.38 / 65.63. Truncating that to 39 and 66 loses the distinction
-- between a rider's true share and a rounded approximation of it, so the
-- columns widen to NUMERIC.
--
-- NUMERIC rather than FLOAT: money must not be stored in binary floating
-- point, where 39.38 has no exact representation. NUMERIC is exact decimal.
-- Scale 2 because BDT has 100 poisha, so 2 decimal places is the smallest
-- amount that can actually exist.
--
-- Existing INTEGER values widen losslessly - 210 becomes 210.00.
ALTER TABLE rides
    ALTER COLUMN fare TYPE NUMERIC(10, 2);

ALTER TABLE payments
    ALTER COLUMN amount TYPE NUMERIC(10, 2);
