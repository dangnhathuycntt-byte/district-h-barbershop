# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the brief ("lightweight static website, minimal dependencies"): Vite + vanilla TypeScript, static output, QR rendered client-side with `uqr`. No backend, database, CMS, analytics, or cookies. Deploy target: GitHub Pages (user confirmed; repo will be public), with a custom domain the user will supply.

## Users

Customers of District H Barbershop, on their own smartphones, sitting in or entering the shop. They arrive by scanning a printed A4 poster. Many may have no mobile data and are not yet on the shop Wi-Fi. Vietnamese-speaking; a few may be visitors.

## Product Purpose

Get a customer onto the shop Wi-Fi without asking staff (the Wi-Fi QR on the poster does this; the website does not carry Wi-Fi), then offer two optional next steps on the website: joining the shop's Zalo group and opening directions to the shop in Google Maps. Success: a customer is connected within seconds, and joining Zalo is clearly voluntary.

## Positioning

A single understated page and one printed poster that belong to one specific shop, not a generic link-in-bio. It is honest about what a web page can and cannot do (it cannot connect a phone to Wi-Fi by itself).

## Operating Context

- Scanning a QR works offline (camera decodes locally), but opening a web page needs internet. A Wi-Fi QR (`WIFI:` payload) is the only step that works with zero connectivity, so the poster leads with it.
- The shop uses an ordinary router (VNPT/Viettel/FPT/TP-Link/Tenda class), so a captive portal (page that auto-opens after joining Wi-Fi) is not available. It stays a documented future option.
- The poster is printed A4 and stuck up in the shop; the page is opened on phones.

## Capabilities and Constraints

- Business facts live in one config file. Wi-Fi SSID `District H barbershop 5g`, password printed on the poster (the brief requires it). The home page no longer shows Wi-Fi details or offers the Wi-Fi QR for download (user decision 2026-10-26); the QR is delivered to the owner as a file.
- Never claim the page connects a device to Wi-Fi; the page has no Wi-Fi controls at all.
- No analytics, tracking, cookie banner, backend, or third-party QR service (the password must not leave the device).
- Pages are `noindex`: they are QR landing pages, and the poster preview page still carries the Wi-Fi password.
- The final site URL is unknown until deploy; it must never be invented. The website QR is generated only once `siteUrl` is set.
- Open: the custom domain (user will provide).

## Brand Commitments

Name: District H Barbershop. The shop's own logo (circle with an H, serif DISTRICT H / BARBERSHOP, supplied by the owner) is the masthead on the page and the poster, set in the page ink color. Brief-pinned look: premium, masculine, minimalist editorial; warm off-white ground, near-black type, subtle bronze accent; correct Vietnamese typography.

## Evidence on Hand

Real data only: shop name, Wi-Fi SSID and password, Zalo group link `https://zalo.me/g/qblcao077`, Google Maps link `https://maps.app.goo.gl/z6VG47DSj9sHhTM7A?g_st=iz`. The owner's logo image (white on black, received in chat 2026-10-26, kept at `brand/logo-original.png`). No photos, address text, opening hours, prices, or testimonials were provided, and none may be invented.

## Product Principles

1. Be honest about web limits; never imply auto-connect.
2. The offline path comes first: the Wi-Fi QR on the poster must work with no internet.
3. Joining Zalo is an invitation, not a gate.
4. One config file, no infrastructure beyond static hosting.
5. Quiet, premium restraint over decoration.

## Accessibility & Inclusion

Mobile-first, keyboard-operable controls, adequate contrast, semantic HTML, Vietnamese text with correct diacritics, readable by people of all ages in a shop setting.

<!-- Assumptions inferred from the brief and a short Q&A, not an interview: user pool, offline condition, router class, deploy choice were confirmed by the user in chat on 2026-10-26. -->
