# Times Square Takeover — Operations Runbook

This runbook governs the physical `takeover` ($2,999) and `vip` ($9,999) packages. It is an operational checklist, not legal advice. Always check the current NYC, Times Square Alliance, media-owner and vendor requirements for the exact date and setup.

## Non-negotiable lifecycle

```text
paid -> ops_review -> scheduled -> live -> proof_ready
                    \-> failed
```

A paid physical package must remain `ops_review` until operations clearance is complete. Payment reserves the workflow; it does not guarantee a particular screen, date, location, performer or permit outcome.

## Package scope

| Tier | Price | On-site people | Capture | Live | Content |
| --- | ---: | ---: | --- | --- | --- |
| Times Square Takeover | $2,999 | 2 brand ambassadors | mobile production | launch-moment link | edited launch video, screenshot, BTS, press kit |
| VIP Takeover | $9,999 | 5 brand ambassadors | professional videographer | up to 60-minute production window | premium film, screenshot, BTS, press kit, PR distribution workflow |

"Brand ambassadors" may be the customer's own team or contracted talent. Do not promise specific actors before written confirmation.

## Operations clearance checklist

A Zapier/manual operations flow should confirm all applicable items before POSTing `scheduled` back to the app:

1. **Media inventory** — screen/media owner, creative spec, exact playout window and provider reference confirmed.
2. **Customer creative** — logo/artwork received, brand-safe, rights confirmed and media-owner approval complete.
3. **Location classification** — confirm whether activity is simple filming, a plaza/event activation, park/Duffy Square activity, or another category.
4. **MOME review** — determine whether a film permit, Optional Permit/Letter in Lieu, or no MOME permit is appropriate for the exact equipment and footprint.
5. **Times Square Alliance / SAPO / Parks review** — check separately if the activation uses a Broadway Pedestrian Plaza, Father Duffy Square, exclusive space, temporary infrastructure or other event elements.
6. **Insurance** — obtain the coverage/certificates required by the applicable permit, venue, media owner, staffing vendor and production vendor. Do not assume one policy satisfies every party.
7. **Talent** — people confirmed, rates confirmed, call times confirmed, likeness/release agreements signed, work-status/vendor requirements satisfied.
8. **Branding/wardrobe** — apparel or hand-held branding produced and delivered; backup option available if rush production fails.
9. **Production** — camera operator, stabilization/audio, batteries/power, connectivity and backup capture plan confirmed.
10. **Live delivery** — streaming destination, privacy mode, test link, fallback recording and customer access verified.
11. **Run of show** — arrival buffer, screen window, camera position, crowd/pedestrian plan, cue, celebration line and exit plan documented.
12. **Weather / disruption** — rain, extreme weather, security restrictions, street closures, screen outage and talent no-show fallback documented.

Only after the applicable checklist is complete should Zapier call:

```json
{
  "ringId": "RING_ID",
  "status": "scheduled",
  "providerRef": "MEDIA_PROVIDER_REFERENCE",
  "permitRef": "OPTIONAL_IF_APPLICABLE",
  "insuranceRef": "OPTIONAL_IF_APPLICABLE",
  "talentReleaseRef": "RELEASE_BUNDLE_REFERENCE"
}
```

with:

```text
Authorization: Bearer $FULFILLMENT_CALLBACK_SECRET
```

## NYC planning rules to verify each time

Current official guidance distinguishes between simple filming and activities requiring permits:

- NYC MOME says a film permit is generally not required when using only hand-held camera/tripod/hand-held equipment, without exclusive use of City property, production-parking privileges, prop weapons/vehicles, stunts or police uniforms.
- If a MOME film permit is required for a Times Square shoot, MOME currently asks applicants to submit the request 7 business days before the shoot date.
- A required MOME film permit currently requires commercial general liability insurance of at least $1,000,000 per occurrence, subject to project-specific requirements.
- The Times Square Alliance states that Broadway Pedestrian Plaza activations are permitted through SAPO and Father Duffy Square through NYC Parks, coordinated with the Alliance. Exact costs and supplementary permits depend on the event.

Official references:

- https://www.nyc.gov/site/mome/permits/when-permit-required.page
- https://www.nyc.gov/site/mome/permits/smoother-application-process.page
- https://www.nyc.gov/site/mome/permits/insurance.page
- https://www.timessquarenyc.org/business-community/planning-an-event

Do not advertise "no permit required" based only on crew size. Classify the actual footprint first.

## Zapier branching

The billboard webhook payload contains `operations` and `requiresOperationsClearance`.

Recommended Zap path for `paid-times-square-takeover`:

1. Create operations record / task.
2. Notify the operations owner.
3. Reserve or request media inventory.
4. Collect creative and customer preferences.
5. Run the clearance checklist above.
6. Book talent and production vendors.
7. Issue releases and collect references.
8. Confirm media + people + location + production together.
9. POST `scheduled` callback.
10. On verified media playout, POST `live` callback.
11. Produce requested assets.
12. POST `proof_ready` with all available asset URLs.

Example proof callback:

```json
{
  "ringId": "RING_ID",
  "status": "proof_ready",
  "proofUrl": "https://.../proof.jpg",
  "videoUrl": "https://.../launch-film.mp4",
  "liveStreamUrl": "https://.../launch",
  "behindScenesUrl": "https://.../bts",
  "pressKitUrl": "https://.../press-kit",
  "prDistributionUrl": "https://.../distribution-report"
}
```

Only VIP should normally require `prDistributionUrl`. A missing optional asset must not be replaced with fabricated proof.

## Margin discipline

Do not use a fixed $300-$500 fulfillment-cost assumption. Track actual costs per job:

- DOOH inventory/media-owner fees
- talent fees and agency/platform fees
- rush apparel/signage/printing and courier
- videographer/editor/streaming costs
- insurance
- permit/event/location fees where applicable
- travel/local transport
- PR distribution vendor cost
- refunds/rebooks/weather contingency

The app should sell a defined customer outcome. Operations should protect the gross margin by approving the actual vendor stack before locking a date.

## Talent release minimums

Use a properly reviewed release/engagement agreement covering at minimum:

- compensation and hours
- permitted use of name/likeness/voice
- commercial/social/press use and editing rights
- geographic/media scope and duration
- wardrobe/brand instructions
- conduct and safety expectations
- cancellation/no-show terms
- contractor/employment classification handled by the vendor as applicable

Do not use an informal one-line release as the permanent production standard for a $2,999-$9,999 commercial service.
