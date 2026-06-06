# Pretty Salon domain map

This folder prepares the gradual modularization of `/pretty-escritorio`.

Current phase: shared domain pieces, Supabase access, and the main stateful orchestration are extracted. The page still owns the visual JSX while section components are pending.

## Proposed structure

- `types.ts`: domain records, Supabase row/insert shapes, form states, section ids, breakdown shapes, and service catalog shape.
- `constants.ts`: static navigation items, categories, payment method lists, Supabase select strings, and service catalog values.
- `utils.ts`: pure helpers for dates, money formatting, normalization, legacy parsing, insert mapping, payment allocation, totals, breakdowns, and status labels.
- `services/prettySalonService.ts`: Supabase access layer for transactions, cash transfers, expense payments, and loan movements.
- `hooks/usePrettySalon.ts`: main stateful orchestration for auth session, data loading, legacy migration, forms, CRUD handlers, navigation state, and derived reports.
- `components/dashboard/`: metrics, daily trend, payment method balances, and dashboard panels.
- `components/transactions/`: income/expense forms, transaction tables, collection flows.
- `components/expenses/`: expense payment dialog, pending expense allocation, settlement views.
- `components/loans/`: loan movement form, loan balances, borrower views.
- `components/reports/`: monthly report tables and summaries.
- `components/team/`: future team/member access UI if needed.
- `components/shared/`: local shared cards, section titles, breakdown lists, dialogs, and table primitives specific to Pretty Salon.

## Future extraction order

1. Extract repeated display components.
2. Split forms and tables by section.
3. Move additional report selectors out of the main hook only if the hook becomes hard to maintain.
4. Only then make `app/pretty-escritorio/page.tsx` a thin route.
