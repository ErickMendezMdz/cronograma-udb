# Pretty Salon domain map

This folder prepares the gradual modularization of `/pretty-escritorio`.

Current phase: only low-risk shared pieces are extracted. The page remains the source of the React state, Supabase calls, layout, and behavior until later phases.

## Proposed structure

- `types.ts`: domain records, Supabase row/insert shapes, form states, section ids, breakdown shapes, and service catalog shape.
- `constants.ts`: static navigation items, categories, payment method lists, Supabase select strings, and service catalog values.
- `utils.ts`: pure helpers for dates, money formatting, normalization, legacy parsing, insert mapping, payment allocation, totals, breakdowns, and status labels.
- `services/`: future Supabase access layer for transactions, cash transfers, expense payments, loan movements, and team access.
- `hooks/`: future stateful orchestration such as `usePrettySalon`, filtered reports, forms, and data loading.
- `components/dashboard/`: metrics, daily trend, payment method balances, and dashboard panels.
- `components/transactions/`: income/expense forms, transaction tables, collection flows.
- `components/expenses/`: expense payment dialog, pending expense allocation, settlement views.
- `components/loans/`: loan movement form, loan balances, borrower views.
- `components/reports/`: monthly report tables and summaries.
- `components/team/`: future team/member access UI if needed.
- `components/shared/`: local shared cards, section titles, breakdown lists, dialogs, and table primitives specific to Pretty Salon.

## Future extraction order

1. Move Supabase calls into services without changing queries.
2. Move pure derived calculations into hooks or selectors.
3. Extract repeated display components.
4. Split forms and tables by section.
5. Only then make `app/pretty-escritorio/page.tsx` a thin route.
