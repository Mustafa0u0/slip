-- Slip: invoices for people who send a handful a month.
--
-- There are no user accounts. An invoice is reached by one of two random
-- tokens: a public one, safe to email to a client, and a private one that also
-- allows editing. That is the whole authorisation model, and it is written
-- down here rather than assumed, because "the URL is the credential" is a
-- decision with consequences — see the note in lib/tokens.ts.

CREATE TABLE IF NOT EXISTS invoices (
  id              BIGSERIAL PRIMARY KEY,

  public_token    TEXT NOT NULL UNIQUE,
  manage_token    TEXT NOT NULL UNIQUE,

  number          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'sent', 'paid')),

  issuer_name     TEXT NOT NULL,
  issuer_email    TEXT,
  issuer_details  TEXT,

  client_name     TEXT NOT NULL,
  client_email    TEXT,
  client_details  TEXT,

  currency        TEXT NOT NULL DEFAULT 'MYR',

  -- Basis points, so 6% SST is 600. A tax rate held as a float is a rounding
  -- error waiting to be discovered by an accountant.
  tax_rate_bp     INTEGER NOT NULL DEFAULT 0 CHECK (tax_rate_bp BETWEEN 0 AND 10000),

  issued_on       DATE NOT NULL DEFAULT CURRENT_DATE,
  due_on          DATE,

  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at         TIMESTAMPTZ,

  CONSTRAINT due_after_issue CHECK (due_on IS NULL OR due_on >= issued_on)
);

CREATE TABLE IF NOT EXISTS line_items (
  id           BIGSERIAL PRIMARY KEY,
  invoice_id   BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  position     INTEGER NOT NULL,
  description  TEXT NOT NULL,

  -- Thousandths, so 1.5 hours is 1500. Quantities are frequently fractional
  -- and floats do not add up predictably.
  quantity_milli  INTEGER NOT NULL CHECK (quantity_milli > 0),

  -- Minor units: cents, sen. Never a float. Money that cannot be represented
  -- exactly is money that will eventually be wrong.
  unit_price_minor BIGINT NOT NULL CHECK (unit_price_minor >= 0),

  UNIQUE (invoice_id, position)
);

CREATE INDEX IF NOT EXISTS line_items_invoice_idx ON line_items (invoice_id, position);
