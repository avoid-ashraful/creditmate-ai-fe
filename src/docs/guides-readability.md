# Guide readability

English scores use the Flesch-Kincaid Grade Level formula over each guide's title, description, section headings and copy, steps, and FAQ text. The small deterministic syllable heuristic and assertion live in `src/content/readability.ts` and `src/content/guides-readability.test.ts`. The score is a practical editorial estimate, not a measure of factual accuracy.

| English guide                           | FK grade | Words | Sentences |
| --------------------------------------- | -------: | ----: | --------: |
| How to choose your first credit card    |     2.76 |   859 |        86 |
| Understanding annual fee waivers        |     2.35 |   762 |        85 |
| Maximizing lounge access benefits       |     2.85 |   652 |        65 |
| Credit card vs debit card in Bangladesh |     2.82 |   662 |        63 |
| Create an account and sign in           |     4.74 |   419 |        44 |
| Save and share a comparison             |     5.29 |   272 |        29 |
| Organize cards with collections         |     4.60 |   308 |        32 |
| Email alerts for card changes           |     3.96 |   269 |        32 |
| Write and read community reviews        |     5.36 |   287 |        37 |
| Advanced search filters                 |     5.66 |   389 |        33 |
| Switch dark mode and language           |     5.86 |   258 |        25 |
| How CreditMate handles your data        |     7.95 |   475 |        47 |

The Jest editorial test also checks that Bengali guide sentences contain no more than 40 whitespace-separated words and consults the reviewed Bengali glossary labels in `src/locales/bn/glossary.json`.
