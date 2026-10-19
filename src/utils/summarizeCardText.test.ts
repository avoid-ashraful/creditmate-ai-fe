import { summarizeCardText } from './summarizeCardText';

// Verbatim verified API fields captured from /api/v1/credit-cards/?page_size=100.
const examples: [string, boolean, string][] = [
  [
    'Complimentary Priority Pass; cardholders (primary & supplementary) max 8 free visits with total 8 guests per year to international lounges; USD 35 per visit beyond complimentary. Also access to selected DBBL branch VIP lounges.',
    true,
    'Complimentary Priority Pass: Up to 8 free visits/year',
  ],
  [
    'Balaka VIP Lounge (HSIA Dhaka) - total 12 free accesses with 12 guests per year (primary + supplementary); access to a number of DBBL VIP banking lounges/VIP zones at selected branches (unlimited, 5 guests/month); airport Meet & Greet (12 per year, primary+supplementary) and Pick & Drop (max 6 per card per year, principal cardholder). Check with the bank: Balaka access needs confirmation; published terms differ on whether Priority Pass visits are limited or unlimited.',
    true,
    'Balaka VIP Lounge (HSIA Dhaka): 12 free visits/year',
  ],
  [
    '2 complimentary visits per year including companion; USD 35 per visit per person after 2 visits (LoungeKey)',
    true,
    '2 free visits/year',
  ],
  [
    '4 complimentary visits per year including companions; USD 35 per visit per person after 4 visits (LoungeKey)',
    true,
    '4 free visits/year',
  ],
  [
    'Balaka Executive Lounge (HSIA Dhaka): unlimited visits for cardholder plus any 3 companions per visit',
    true,
    'Balaka Executive Lounge (HSIA Dhaka): unlimited visits for cardholder plus any…',
  ],
  [
    'For local currency: DBBL ATM/CRM: Free; Other bank ATM/CRM: BDT 100.00 or 3% (whichever is higher). For foreign country: 3% of the withdrawn amount (Cash Advance Limit: 50% of credit limit)',
    false,
    'For local currency: DBBL ATM/CRM: Free…',
  ],
  [
    'All overseas transactions converted using VISA/Mastercard/Diners Club exchange rates. A foreign currency factor of 3% will be applied in case of overseas transactions when the transaction currency is non USD.',
    false,
    'All overseas transactions converted using VISA/Mastercard/Diners Club exchange…',
  ],
  [
    'Cash Advance Fee (off-us): 3% or TK. 200 whichever is higher',
    false,
    'Cash Advance Fee (off-us): 3% or TK. 200 whichever is higher',
  ],
  [
    'No. of Free Supplementary Card(s): 2; Annual Fee- Supplementary Card: TK. 1,500 from 3rd onwards',
    false,
    'No. of Free Supplementary Card(s): 2…',
  ],
  [
    'Supplementary Card Fee: For Visa Signature, Mastercard World, UnionPay Diamond, Visa Platinum & Mastercard Titanium Cards: supplementary card for all family members may be issued at a fee of 50% of Primary Card',
    false,
    'Supplementary Card Fee: For Visa Signature…',
  ],
];

describe('summarizeCardText', () => {
  it.each(examples)('summarizes verified terms: %s', (raw, lounge, expected) => {
    expect(summarizeCardText(raw, lounge)).toBe(expected);
    expect(summarizeCardText(raw, lounge).length).toBeLessThanOrEqual(80);
  });

  it.each(['', 'Unknown', 'Not listed', '6 visits', '3%', 'BDT 1,500'])(
    'preserves short text %s',
    text => {
      expect(summarizeCardText(text)).toBe(text);
    }
  );

  it('does not invent a period or mistake guests and paid visits for free visits', () => {
    expect(summarizeCardText('6 complimentary international lounge visits', true)).toBe(
      '6 free visits'
    );
    expect(
      summarizeCardText('Access for 2 guests; USD 35 per visit after 8 visits per year', true)
    ).toBe('Access for 2 guests; USD 35 per visit after 8 visits per year');
  });

  it('handles Bengali clauses and normalizes whitespace without changing the source', () => {
    expect(summarizeCardText('লাউঞ্জ সুবিধা আছে। বিস্তারিত ব্যাংকে জানুন')).toBe(
      'লাউঞ্জ সুবিধা আছে। বিস্তারিত ব্যাংকে জানুন'
    );
    expect(summarizeCardText('  Free   access ')).toBe('Free access');
  });
});
