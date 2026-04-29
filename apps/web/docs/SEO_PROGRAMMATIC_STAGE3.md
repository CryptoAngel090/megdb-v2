# Stage 3 — Programmatic SEO

After hub pages, MegDB builds a programmatic layer based on intent intersections.

## Generate

- genre + year
- genre + country
- genre + rating
- genre + mood
- genre + franchise
- actor + genre
- director + genre

## Do Not Generate

- pages with insufficient data volume
- templates with near-identical page output
- intersections without measurable search demand
- URLs that do not provide unique user value

## Quality Gate

Every programmatic page candidate must pass:

1. **Card sufficiency**: enough items to avoid thin content.
2. **Unique copy**: unique editorial/context text, not boilerplate-only.
3. **Intent validity**: real user intent supported by demand signals.
4. **Neighbor differentiation**: content must differ from adjacent pages.
5. **Duplicate safety**: must not collide with existing canonical pages.

## Indexation Rule

If a page is weak:

- do not generate it, or
- mark it as `noindex`, or
- keep it for internal navigation only.

## Threshold Calibration (Non-Magic Numbers)

`minIntentScore` and `maxNeighborContentSimilarity` are calibration-driven, not one-time constants.

- Review cadence: every 28 days (or earlier after large template/content changes).
- Data inputs: Google Search Console, Bing Webmaster, indexation logs, content similarity reports.
- Minimum sample: at least 40 evaluated pages across templates (strong + weak cohorts).
- Core metrics:
  - indexation rate
  - impressions trend
  - CTR
  - share of thin/duplicate outcomes

If metrics regress, recalibrate thresholds and re-run the policy verifier before rollout.

## Policy Source Of Truth

Operational policy and machine checks are defined in:

- `scripts/seo-programmatic-policy.json`
- `scripts/verify-seo-programmatic-policy.mjs`
