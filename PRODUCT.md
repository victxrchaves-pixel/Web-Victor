# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS, no framework and no build step (the user's explicit choice).
Self-hosted fonts and locally stored imagery, so the page makes no third-party
requests. Deploy target not yet decided; it must keep working from a plain
`index.html`.

## Users

Two audiences reaching the same single page, most of them from one link (a
portfolio link in a bio, a CV, a DM) and many on a phone:

- Studios, art directors and recruiters assessing whether the work is good.
- Prospective clients deciding whether to brief a project.

Both are on the page briefly and want the work first, contact second.

## Product Purpose

The personal portfolio landing of Victor Chaves Cerrejón, a creative designer
based in Barcelona. It exists to show the work, establish that the work is
strong, and open a conversation — hire or commission. Success is a visit that
ends in an email.

## Positioning

Stated in his own words on the page: "A creative guy in the digital world.
Someone who gives it their all or not at all" — "I craft brands, products and
experiences that hit hard and connect deeper." A generalist who covers strategy,
identity, interface, motion and build rather than a single-discipline
specialist.

## Operating Context

Usually the first and only contact with the work, viewed in one short session,
frequently on mobile. The page is the portfolio: there are no case-study pages
behind it yet, so the project rows currently lead to the contact section.

## Capabilities and Constraints

- One page: hero, featured work, services, imagery band, contact, footer.
- No backend. Contact runs through `mailto:` links; a form service can be added
  later without changing the layout.
- Four projects are shown: BareFolio, IDLE CBD Oil, Kinvo and Nuvra.
- Content is in English.
- Undecided: domain, hosting, case-study pages, real social profile URLs
  (the chips currently point at the bare platform URLs).

## Brand Commitments

The Figma file `ItsVictorChaves` (node 291:488) is the binding visual authority:
near-black `#111` ground, Geist and Geist Mono, full-bleed photography, glass
nav pill, hairline-ruled lists, outlined display type. Name: Victor Chaves
Cerrejón. Email: itsvictxrchaves@gmail.com. Based in Barcelona.

## Evidence on Hand

Real project imagery for the four named projects, exported from the Figma file
and stored in `assets/img/`. No testimonials, client names, metrics, awards or
years of experience have been provided — none may be invented.

## Product Principles

1. The work leads; the interface stays out of its way.
2. Nothing invented. Only facts the design or its owner supply.
3. Legible on a phone, in one short session.
4. Editable by its owner: content lives in plain HTML, clearly labelled.
5. Self-contained. No external requests that can break the page.

## Accessibility & Inclusion

No specific requirement was stated. The build holds itself to: WCAG AA contrast
(verified on the hero and nav), full keyboard operation with visible focus,
alt text on every image, `prefers-reduced-motion` honoured, and all content
visible when JavaScript does not run.
