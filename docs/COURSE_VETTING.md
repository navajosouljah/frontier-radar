# Course vetting

A course appears on Frontier Radar only when every check below passes. `scripts/vetting.mjs`
enforces what a script can see; the run does the reading. Popularity never qualifies a course.

1. **A real, named provider** with its own https website (`provider`, `provider_url`).
2. **A working course page** (`url`, https) that the run opened within 14 days of the list's date
   (`page_checked`). A list dated in the future is refused.
3. **The price is shown** on that page (`price.amount`, `price.display`). "Contact us" pricing fails.
   A free course is `amount: 0` with `display: "Free"`; a 0 with any other label fails.
4. **Independent reviews**: at least 5, with a score, on a site the provider does not run
   (`reviews.score`, `reviews.count`, `reviews.site`, `reviews.url`). "Does not run" is judged by the
   registrable domain, so `reviews.academy.example.com` is still the provider.
5. **No income or guaranteed-results promises** anywhere on the course page ("guaranteed", "income",
   "earn $5k a month", "make money", "six figures", "quit your job", "financial freedom" and the like).
   The run reads the page and sets `claims_checked: true` only when none appear. The same words in
   our own text also fail. A legitimate finance course that trips the word "income" stays out until
   JJ rules; the checker fails safe.
6. **Which AI it teaches** (`ai`), one of the five.

An AI with no course that passes shows "No vetted courses yet". Never pad the list.
