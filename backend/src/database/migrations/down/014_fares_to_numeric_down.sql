-- Narrow the fare columns back to whole Taka.
--
-- Rounding is required, not incidental: existing rows now hold fractions such as
-- 39.38, which INTEGER cannot represent. Half-up rounding sends .5 to the
-- higher Taka. This is lossy and is the reverse of migration 014, which widened
-- these columns precisely to stop throwing that fraction away.
ALTER TABLE rides
    ALTER COLUMN fare TYPE INTEGER USING ROUND(fare);

ALTER TABLE payments
    ALTER COLUMN amount TYPE INTEGER USING ROUND(amount);
