# Conversion funnel dashboard (task 10.2)

Config-as-code and offline tooling for the funnel **Visit → Search → Filter → Select → Compare → Share**, built on the allowlisted events in `src/lib/analytics.ts` (task 10.1).

## Status

- **No PostHog project was accessed.** The funnel, cohorts and dashboard are files in this repo. Nothing has been created in PostHog, and the Slack report has not been posted.
- **The app does not send events yet.** `analytics.setProvider` is never called in `src/`, so `analytics.track` is a no-op. Until a provider is wired (PostHog SDK, consent, project key), no data reaches PostHog and the dashboard will be empty. Wiring it is a separate decision.
- **`cohorts.json` uses this repo's own filter notation.** It is not a PostHog API payload. Translate each cohort in PostHog and record its id in `cohort_ids`.

## Files

| Path                                           | What it is                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| `analytics/posthog/funnel.json`                | The funnel: six steps, mapped to allowlisted events, 7-day window.         |
| `analytics/posthog/cohorts.json`               | Segment cohorts: device, UTM source, new vs returning.                     |
| `analytics/posthog/dashboard.json`             | Dashboard tiles: overall funnel, breakdowns, weekly trend.                 |
| `analytics/posthog/fixtures/sample-events.csv` | 41 events and 1 bad row for 13 users. Used by the tests.                   |
| `src/utils/funnel.ts`                          | Pure funnel maths: parsing, validation, step counts, drop-off, text table. |
| `src/utils/funnelSlack.ts`                     | Slack Block Kit payload and the webhook POST.                              |
| `scripts/funnel-report.mjs`                    | Terminal or JSON report from an events export.                             |
| `scripts/funnel-slack-report.mjs`              | Weekly Slack payload. Dry run by default.                                  |

## Funnel steps

| Step    | Event           | Fired from                                                             | Counts as a step when |
| ------- | --------------- | ---------------------------------------------------------------------- | --------------------- |
| Visit   | `page_view`     | `App.tsx` (every route change)                                         | always                |
| Search  | `search`        | `HomePage` search submit                                               | always                |
| Filter  | `filter_apply`  | `HomePage` filter change                                               | `filterCount > 0`     |
| Select  | `card_select`   | `HomePage`, `ComparisonPage`, `CardDetailPage`, `RewardCalculatorPage` | always                |
| Compare | `compare_start` | `ComparisonPage` on load with ids                                      | always                |
| Share   | `compare_share` | `ComparisonPage`, `RecommendationQuiz`                                 | always                |

No step needed a new event, so the allowlist is unchanged.

### Measurement caveats

These are known limits of the events as they are tracked today. They are not fixed here.

- **Filter.** A search submit also fires `filter_apply` with `filterCount: 0`. The Filter step only counts `filterCount > 0`.
- **Select.** `card_select` also fires on removal, and the event can't tell add from remove. Removals inflate Select.
- **Search.** Empty searches count as a Search.
- **Compare and Share.** Users who open a shared `/compare?ids=` link reach Compare without Select, so an ordered funnel drops them at Select. `compare_share` also fires for quiz result links.
- **Visit.** `page_view` fires on every route, not only the home page.
- **Ordered funnel.** Steps must happen in order. A user who filters without searching drops at Search. Change `funnel.json` if that is not the intent.

## Setup in PostHog (once a provider is wired)

1. **Funnel.** Create a funnel insight with the six steps from `funnel.json`, in order. Set the conversion window to `conversionWindowDays` (7). Keep the funnel id `visit-to-share`.
2. **Cohorts.** Create each cohort in `cohorts.json` in PostHog. Put the PostHog cohort ids in `cohort_ids`.
3. **Dashboard.** Create a dashboard from `dashboard.json`, using the funnel insight and cohorts above. The breakdowns need these properties on the events:
   - `$device_type`: captured by the PostHog SDK, not by `analytics.ts`. The provider must send it.
   - `utmSource`: sent on `page_view` by `analytics.ts`. The breakdown uses the Visit value.
   - Device and new vs returning do not come from the allowlist. They come from PostHog's built-in properties and cohorts.

## Local report

Run on any export (CSV or JSON):

```bash
node scripts/funnel-report.mjs analytics/posthog/fixtures/sample-events.csv
node scripts/funnel-report.mjs analytics/posthog/fixtures/sample-events.csv --breakdown utmSource
node scripts/funnel-report.mjs analytics/posthog/fixtures/sample-events.csv --json
```

The export needs the columns `event`, `distinct_id`, `timestamp` and `properties` (a JSON object, as a string in CSV). JSON exports may be an array or `{ "results": [...] }`. Rows with a missing event, user or timestamp are counted as skipped.

Fixture result (checked in `src/utils/funnel.test.ts`): 11 users enter, and the counts by step are 11, 7, 5, 5, 4, 3. Overall conversion is 27.3%.

## Weekly Slack report

1. **Export.** In PostHog, export the funnel's events for the last 7 days, with the columns above. Save the file under `analytics/posthog/exports/`. That folder is git-ignored because exports hold user identifiers. The export is manual. Nothing here calls the PostHog API.
2. **Dry run (default).** Prints the Slack payload and posts nothing, even when `SLACK_WEBHOOK_URL` is set:
   ```bash
   node scripts/funnel-slack-report.mjs analytics/posthog/exports/week.csv
   ```
3. **Post.** A message is sent only when **both** `SLACK_WEBHOOK_URL` is set **and** `--send` is passed:
   ```bash
   SLACK_WEBHOOK_URL=... FUNNEL_DASHBOARD_URL=... \
     node scripts/funnel-slack-report.mjs analytics/posthog/exports/week.csv --send
   ```
4. **Schedule.** Nothing is scheduled in this repo. A cron entry on a host that has the webhook in its secret store would look like this (it is not committed):
   ```cron
   0 9 * * 1  cd /path/to/repo && node scripts/funnel-slack-report.mjs exports/week.csv --send
   ```
   Keep the webhook URL out of the repo and out of logs. It is a credential.

Only `https://` webhooks are accepted.

## Tests

```bash
CI=true npm test -- --watchAll=false --maxWorkers=3
```

- `funnel.test.ts`: parsing, validation, the fixture counts, and the ordering, window, entry-event and `(not set)` rules.
- `funnelSlack.test.ts`: payload content, Slack escaping, the 10-segment cap, and the POST with a mock fetch. No network.
- `funnelConfig.test.ts`: every funnel step is an allowlisted event that `src/` tracks, every filter property is sent by that call, and dashboard and cohort references resolve.
- `funnelCli.test.ts`: runs both scripts. It only uses dry run, so it never posts.

## Privacy

- Only allowlisted events and properties are sent (`src/lib/analytics.ts`). No free text.
- Exports contain PostHog distinct ids. Keep them in `analytics/posthog/exports/` and out of Slack. The Slack message holds counts and segment labels only.
