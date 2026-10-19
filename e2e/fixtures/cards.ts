export interface RewardEarnRuleFixture {
  category: string;
  points_per_unit: number;
  spend_unit_bdt: number;
  text: string;
}

export interface CashbackRuleFixture {
  category: string;
  percent: number;
  cap_text: string | null;
  text: string;
}

interface RewardFixture {
  programName: string;
  earnRules: RewardEarnRuleFixture[];
  cashbackRules: CashbackRuleFixture[];
  /** Decimal string only when the bank states a redemption value; null otherwise. */
  pointValue: string | null;
  expiry: string;
}

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
  reward_program_name: string;
  reward_earn_rules: RewardEarnRuleFixture[];
  cashback_rules: CashbackRuleFixture[];
  reward_point_value_bdt: string | null;
  points_expiry_text: string;
  reward_source_url: string;
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

/**
 * Structured reward archetypes per synthetic card: two points cards with a
 * bank-stated value, one cashback card with a printed monthly cap, and one
 * flat points card. All four carry a signal so the calculator ranks them.
 */
const rewardsFor = (id: number): RewardFixture => {
  switch (id) {
    case 2:
      return {
        programName: 'Synthetic Travel Points',
        earnRules: [
          {
            category: 'travel',
            points_per_unit: 2,
            spend_unit_bdt: 100,
            text: 'Earn 2 points for every BDT 100 spent on travel.',
          },
          {
            category: 'all',
            points_per_unit: 1,
            spend_unit_bdt: 100,
            text: 'Earn 1 point for every BDT 100 spent elsewhere.',
          },
        ],
        cashbackRules: [],
        pointValue: '0.5000',
        expiry: 'Points expire after 24 months.',
      };
    case 3:
      return {
        programName: '',
        earnRules: [],
        cashbackRules: [
          {
            category: 'dining',
            percent: 5,
            cap_text: 'up to BDT 300 monthly',
            text: '5% cashback on dining, up to BDT 300 monthly.',
          },
        ],
        pointValue: null,
        expiry: '',
      };
    default:
      return {
        programName: 'Synthetic Points',
        earnRules: [
          {
            category: 'all',
            points_per_unit: 1,
            spend_unit_bdt: 50,
            text: 'Earn 1 point for every BDT 50 spent.',
          },
        ],
        cashbackRules: [],
        pointValue: '1.0000',
        expiry: '',
      };
  }
};

const card = (id: number, name: string, annualFee: number): CreditCardApiFixture => {
  const reward = rewardsFor(id);
  return {
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
    reward_program_name: reward.programName,
    reward_earn_rules: reward.earnRules,
    cashback_rules: reward.cashbackRules,
    reward_point_value_bdt: reward.pointValue,
    points_expiry_text: reward.expiry,
    reward_source_url: `https://synthetic-${id}.test/reward-terms`,
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
  };
};

export const cards = [
  card(1, 'Synthetic Visa Classic', 0),
  card(2, 'Synthetic Visa Travel', 500),
  card(3, 'Synthetic Visa Signature', 2000),
  card(4, 'Synthetic Mastercard Outside Range', 2500),
];

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
