# Pretty Salon domain map

This folder prepares the gradual modularization of `/pretty-escritorio`.

Current phase: shared domain pieces, Supabase access, the main stateful orchestration, presentational dashboard/report/list components, controlled form components, and presentational dialogs are extracted. The page still owns larger visual sections while deeper component splits are pending.

## Proposed structure

- `types.ts`: domain records, Supabase row/insert shapes, form states, section ids, breakdown shapes, and service catalog shape.
- `constants.ts`: static navigation items, categories, payment method lists, Supabase select strings, and service catalog values.
- `utils.ts`: pure helpers for dates, money formatting, normalization, legacy parsing, insert mapping, payment allocation, totals, breakdowns, and status labels.
- `services/prettySalonService.ts`: Supabase access layer for transactions, cash transfers, expense payments, and loan movements.
- `hooks/usePrettySalon.ts`: main stateful orchestration for auth session, data loading, legacy migration, forms, CRUD handlers, navigation state, and derived reports.
- `components/dialogs/`: controlled presentational dialogs for collecting pending income and registering expense payments.
- `components/forms/`: controlled presentational forms for income, expenses, transfers, and loan movements.
- `components/dashboard/`: small presentational dashboard pieces such as metric cards, balance cards, section tabs, quick actions, and the dashboard header.
- `components/transactions/`: presentational transaction lists/items, plus future income/expense forms and collection flows.
- `components/expenses/`: presentational expense payment tables, plus future expense payment dialogs and settlement views.
- `components/loans/`: presentational loan movement lists, plus future loan forms and borrower views.
- `components/reports/`: presentational daily trend, category breakdowns, payment method breakdowns, monthly report tables, and report summaries.
- `components/team/`: future team/member access UI if needed.
- `components/shared/`: local shared empty states, read-only tables, cards, section titles, dialogs, and table primitives specific to Pretty Salon.

## Future extraction order

1. Continue extracting repeated display components that are prop-only and low risk.
2. Split forms and tables by section.
3. Move additional report selectors out of the main hook only if the hook becomes hard to maintain.
4. Only then make `app/pretty-escritorio/page.tsx` a thin route.
