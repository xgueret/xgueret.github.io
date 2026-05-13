# Product

## Register

brand

## Users

Three audiences, in order of weight:

1. **Tech recruiters and hiring managers** (FR primary, EN secondary) landing on the site from LinkedIn, GitHub, or a CV link. Skim the home, look for proof of DevOps competence, decide in under 60 seconds whether to read further or contact Xavier.
2. **DevOps peers and self-taught learners** arriving from search engines on a specific technical article (Kubernetes, Ansible, Terraform, Python, Linux). They read one article and may bookmark, share, or follow.
3. **Potential collaborators and freelance clients** evaluating Xavier's profile before reaching out. They want to gauge tone, reliability, and whether he is approachable.

Context of use: desktop in working hours (recruiters), mobile during commute or evening browsing (learners), often after clicking a single link — they did not come to explore, they came to confirm something.

## Product Purpose

Xavier's public face on the web. The site exists to:

- Make it obvious within one fold that Xavier is a credible DevOps engineer (Kubernetes, Ansible, Terraform, Python, automation).
- Carry his personal voice — direct, honest, warm, with a real Guadeloupe accent in the copy — so visitors meet the person, not a template.
- Surface a current, well-curated body of articles and projects that act as proof-of-work.
- Provide a frictionless contact path for opportunities (availability pill, contact page).

Success looks like: a recruiter reads the hero, scans the latest article titles, and either contacts Xavier or saves the page. A peer reads the article they came for, then notices "who wrote this" and explores further.

## Brand Personality

**Direct. Honest. Warm.**

- **Direct**: no buzzword inflation, no "passionate about leveraging synergies." Plain technical sentences. Concrete certifications (CKA, CKAD, Terraform) over vague claims.
- **Honest**: admits the learning curve, the curiosity, the in-progress mastery. Quotes other people instead of pretending the line is his own.
- **Warm**: an oral, spoken voice. Caribbean rhythm in the copy ("au rythme des Alizés", "esprit zen", "chill", "flow"). A real human writes here, not a portfolio template.

The voice is **already there in the copy**. The visual register currently lags behind it — that mismatch is the central design problem of the site.

## Anti-references

**1. The generic developer portfolio.** Centered hero, big "Hi, I'm John, Full-Stack Developer", Inter or Plus Jakarta Sans, three identical icon+title+text cards below ("Skills", "Projects", "Contact"), GitHub-green accents. The default GitHub-Pages-shaped portfolio that every junior dev ships in 2026. If a visitor cannot tell which person it belongs to with the name removed, it has failed.

**2. SaaS corporate.** Navy (#1e293b) + slate neutrals + Facebook-blue accent (#3b5998) + "Trusted by" rails + identical 16rem-padded sections + a tasteful inline-flex CTA. Reads as "a B2B onboarding flow with the brand swapped out." This is uncomfortably close to what the current visual is.

**3. Editorial-magazine / Klim italic** (second-order trap). Display serif + italic Fraunces/Recoleta headline + monospaced metadata + three ruled columns. The aesthetic lane that "every brand not wanting to look like SaaS" has converged on by 2026. Avoid as the reflex escape from anti-reference 2.

**4. Hacker terminal / acid neon.** Black background, green monospace glow, ASCII diagrams everywhere, "$ whoami" hero. Technical costume, not technical credibility.

## Design Principles

1. **The visual must match the voice that already lives in the copy.** The hero text is conversational and Caribbean-flavored; the visual cannot be corporate-navy. Voice-visual coherence is the single most important principle for this site.

2. **Own the Guadeloupe angle.** Geographic identity is a differentiator, not a footnote. Light, color, climate, rhythm — these are licit material for the visual, not decoration to be sprinkled.

3. **No DevOps clichés.** No Kubernetes-wheel hero illustration, no Docker whale, no terminal screenshots used as decoration, no green-on-black, no "infrastructure as code" set in monospace. The credibility lives in the article titles, not the iconography.

4. **Content first.** Reading is the primary task. Typography, line length, vertical rhythm, contrast — these matter more than animation, gradients, or hero ornaments. The most aggressive visual move on any page should still serve the act of reading what is below it.

5. **Show, don't tell.** Recent articles, real certifications (CKA, CKAD), actual project links. Skip the "Skills" section with progress bars. Skip the "Years of experience" counter. Proof of work over claims.

## Accessibility & Inclusion

- **WCAG 2.1 AA** as the floor for contrast, focus, semantics, alt text, keyboard navigation.
- **Reduced motion** must be respected globally (already wired in `global.css` via `prefers-reduced-motion: reduce`). The site should be fully understandable with zero animation.
- **Keyboard-first**: every interactive element reachable and visible on focus. The skip-to-content link is already in place; new components must preserve that contract.
- **Language switching** must remain explicit and reachable; the audience genuinely splits FR / EN.
- **Dark mode** must remain a first-class theme, not a degraded copy of the light theme — both palettes need to be designed, not derived.
