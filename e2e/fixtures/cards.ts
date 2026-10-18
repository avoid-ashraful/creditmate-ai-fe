export interface CreditCardApiFixture {
  id: number;
  bank_id: number;
  bank_name: string;
  name: string;
  annual_fee: string | null;
  interest_rate_apr: string | null;
  lounge_access_international: string | null;
  lounge_access_domestic: string | null;
  cash_advance_fee: string;
  late_payment_fee: string;
  annual_fee_waiver_policy: Record<string, unknown> | null;
  reward_points_policy: string;
  additional_features: string[];
  is_active: boolean;
  source_url: string;
  apply_url: string;
  verification_status: string;
  verified_at: string;
  modified: string;
  images: Array<{ small: string; full: string }>;
}

const image = (id: number, index: number) => `/mock-assets/cards/${id}-${index}.svg`;

const card = (id: number, name: string, annualFee: number): CreditCardApiFixture => ({
  id,
  bank_id: id,
  bank_name: `Synthetic Bank ${id}`,
  name,
  annual_fee: annualFee.toFixed(2),
  interest_rate_apr: (18 + id).toFixed(2),
  lounge_access_international: `${id} visits`,
  lounge_access_domestic: `${id * 2} visits`,
  cash_advance_fee: `Synthetic cash fee ${id}`,
  late_payment_fee: `Synthetic late fee ${id}`,
  annual_fee_waiver_policy: {
    conditions: `Synthetic waiver condition ${id}`,
  },
  reward_points_policy: `Synthetic reward policy ${id}; Earn 1 point for every BDT 50 spent.`,
  additional_features: [`Synthetic feature ${id}.1`, `Synthetic feature ${id}.2`],
  is_active: true,
  source_url: `https://synthetic-${id}.test/schedule-of-charges.pdf`,
  apply_url: `https://synthetic-${id}.test/apply`,
  verification_status: 'verified',
  verified_at: '2026-10-18T00:00:00Z',
  modified: '2025-01-15T10:00:00Z',
  images: [
    { small: image(id, 1), full: image(id, 1) },
    { small: image(id, 2), full: image(id, 2) },
    { small: image(id, 3), full: image(id, 3) },
  ],
});

export const cards = [
  card(1, 'Synthetic Visa Classic', 0),
  card(2, 'Synthetic Visa Travel', 500),
  card(3, 'Synthetic Visa Signature', 2000),
  card(4, 'Synthetic Mastercard Outside Range', 2500),
];

/** QA #10: cards without an apply URL get a fee-schedule link, never an apply CTA. */
export const feeScheduleOnlyCard: CreditCardApiFixture = {
  ...card(9, 'Synthetic Fee Schedule Only', 0),
  apply_url: '',
};

export const banks = [1, 2, 3, 4].map(id => ({
  id,
  name: `Synthetic Bank ${id}`,
  logo: `/mock-assets/banks/${id}.svg`,
  website: `https://synthetic-${id}.test`,
  is_active: true,
  credit_card_count: 1,
  created: '2025-01-01T00:00:00Z',
  modified: '2025-01-01T00:00:00Z',
}));
