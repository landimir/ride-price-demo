/* Ride Price Portal — seed data & catalogs (demo data only) */
"use strict";

const RIDE_PRICE_DATA = {

  dealership: {
    name: "Ride Price Motors",
    advisor: "Ashley Collins",
    teamLead: "Jordan Reyes",
    address: "321 Northern Blvd, Long Island City, NY 11101",
    /* 555 is the reserved range for fiction; the number here before it was a
       real, assignable line and this is a fictional dealership (no-PII rule) */
    phone: "(718) 555-0188"
  },

  /* New York City tax + fee structure. Total 8.875% — the combined rate for
     all five boroughs, which is why the ZIP directory below is NYC-only:
     one table can only be correct for one jurisdiction. */
  taxes: [
    /* Labels follow the owner's reference lease summary (2026-08-20), which
       breaks the 8.875% out as "New York", "Queens County" and "Transit":
       the 4.5% is the NYC local rate shown by county convention — correct
       for every deal here because tax follows the dealership's locality
       (Long Island City, Queens) — and the 0.375% is the MCTD. */
    { label: "New York State Tax", rate: 0.04 },
    { label: "Queens County Tax", rate: 0.045 },
    { label: "Transit Tax", rate: 0.00375 }
  ],
  fees: [
    /* The New York fee set from the owner's reference lease summary
       (2026-08-20), replacing two Colorado-era leftovers. The four sum to
       $432.50 — the sample's own "Estimated Up-Front Registration & Fees",
       which is the cross-check. NY caps dealer documentation fees at $175;
       the tire tax is the state's $2.50-per-tire waste fee × 5. */
    { label: "Documentation Fee", amount: 175.00 },
    { label: "Inspection Fee", amount: 10.00 },
    { label: "Registration Fee", amount: 235.00 },
    { label: "Tire Tax", amount: 12.50 }
  ],

  financeTerms: [36, 48, 60, 72, 84],
  leaseTerms: [24, 36, 39, 48],
  milesOptions: [10000, 12000, 15000],

  /* residual % of MSRP by lease term */
  residuals: { 24: 0.68, 36: 0.64, 39: 0.61, 48: 0.54 },

  /* acquisition and disposition from the owner's reference lease summary
     (2026-08-20) — the captive-lender numbers its quote carries. The
     disposition fee is charged at lease END, so it never enters the payment
     math; it is disclosed on the desking screen's lease terms. */
  leaseFees: { acquisition: 595.00, securityDeposit: 0, disposition: 350.00 },

  /* credit tiers: agreed rate is presented at desking; qualified comes back from the "lender" */
  creditTiers: [
    { min: 740, label: "Excellent", agreedApr: 3.5, qualifiedApr: 2.49, leaseFactor: 0.00117 },
    { min: 700, label: "Very Good", agreedApr: 4.5, qualifiedApr: 3.49, leaseFactor: 0.00150 },
    { min: 660, label: "Good", agreedApr: 5.9, qualifiedApr: 4.99, leaseFactor: 0.00190 },
    { min: 600, label: "Fair", agreedApr: 8.9, qualifiedApr: 7.49, leaseFactor: 0.00260 },
    { min: 0,   label: "Building", agreedApr: 12.9, qualifiedApr: 10.99, leaseFactor: 0.00340 }
  ],

  lenders: ["CUDC Alliant C.U.", "Hyundai Motor Finance", "Ally Financial", "US Bank", "Chase Auto"],

  /* Demo ZIP directory — NYC codes covering the personas plus nearby
     neighborhoods, so typing a ZIP fills city/state. Not a real ZIP database.
     County rides along because the registration forms ask for it. */
  zipLookup: {
    "11106": { city: "Astoria", state: "NY", county: "Queens" },
    "11103": { city: "Astoria", state: "NY", county: "Queens" },
    "11101": { city: "Long Island City", state: "NY", county: "Queens" },
    "11361": { city: "Bayside", state: "NY", county: "Queens" },
    "11375": { city: "Forest Hills", state: "NY", county: "Queens" },
    "11215": { city: "Brooklyn", state: "NY", county: "Kings" },
    "11201": { city: "Brooklyn", state: "NY", county: "Kings" },
    "10001": { city: "New York", state: "NY", county: "New York" },
    "10461": { city: "Bronx", state: "NY", county: "Bronx" },
    "10301": { city: "Staten Island", state: "NY", county: "Richmond" }
  },

  accessories: [
    { id: "mats", name: "All-Season Floor Mats", price: 195 },
    { id: "tint", name: "Window Tint", price: 399 },
    { id: "charger", name: "Wireless Charger", price: 349 },
    { id: "ppf", name: "Clear Mask Paint Film", price: 899 },
    { id: "crossbars", name: "Roof Cross Bars", price: 289 },
    { id: "cargo", name: "Cargo Organizer", price: 149 },
    { id: "edge", name: "Door Edge Guards", price: 99 },
    { id: "locks", name: "Wheel Locks", price: 79 }
  ],

  /* F&I product catalog */
  products: [
    { id: "vsc10", name: "Vehicle Service Contract", detail: "10 yr / 120,000 mi / $100 ded.", price: 3404, monthlyHint: null, types: ["finance", "cash", "lease-limited"] },
    { id: "vsc7", name: "Vehicle Service Contract", detail: "7 yr / 100,000 mi / $100 ded.", price: 2750, types: ["finance", "cash"] },
    { id: "ppm8", name: "Pre-Paid Maintenance", detail: "8 yr / 96,000 mi", price: 2064, types: ["finance", "cash"] },
    { id: "ppm3", name: "Pre-Paid Maintenance", detail: "3 yr / 36,000 mi", price: 649, types: ["finance", "cash", "lease"] },
    { id: "gap", name: "GAP Coverage", detail: "Full loan term", price: 995, types: ["finance"] },
    { id: "multi", name: "Multi-Protect Bundle", detail: "7 yr — tire & wheel, dent, key, windshield", price: 2059, types: ["finance", "cash", "lease"] },
    { id: "appear", name: "Appearance Protection", detail: "5 yr — paint & interior", price: 1295, types: ["finance", "cash", "lease"] },
    { id: "lep", name: "Lease-End Protection", detail: "Waives up to $5,000 excess wear & tear", price: 1095, types: ["lease"] },
    { id: "wind", name: "Windshield Protection", detail: "3 yr", price: 495, types: ["lease-limited"] },
    { id: "roadhaz", name: "Road Hazard Protection", detail: "5 yr — tires & wheels", price: 899, types: ["finance", "cash", "lease"] },
    { id: "keyrep", name: "Key Replacement", detail: "3 yr — lost or damaged remotes", price: 399, types: ["finance", "cash", "lease"] },
    { id: "tlp", name: "Total Loss Protection", detail: "5 yr", price: 795, types: ["finance", "cash"] },
    { id: "recovery", name: "Theft Recovery System", detail: "3 yr", price: 699, types: ["finance", "cash"] }
  ],

  /* product presentation copy — the Preferred walkthrough page */
  presentations: {
    rate: { icon: "📊", label: "Rate", short: "Rate",
      headline: "A rate you actually qualified for.",
      body: "The rate on this menu comes from the lender's real approval of your credit application — not an estimate. We submitted to the lender you preferred and went to work to earn you a competitive rate.",
      benefits: ["Based on your actual lender approval", "Compared across lenders for competitiveness", "Locked to the structure you agreed to"] },
    term: { icon: "📅", label: "Term", short: "Term",
      headline: "A term that matches how you own.",
      body: "Your term is set to mirror how long you actually keep and drive your vehicles — so your coverage, payment, and equity all line up with real life instead of a generic contract.",
      benefits: ["Matched to your driving habits from discovery", "Shorter terms build equity faster", "Extended options available for payment relief"] },
    vsc10: { icon: "🛡️", label: "Vehicle Service Contract", short: "VSC",
      headline: "Coverage that outlasts the factory warranty.",
      body: "Your manufacturer's comprehensive coverage ends long before most owners are done with the vehicle. A service contract keeps the mechanical, electrical, and technology components covered after the factory walks away — with parts and labor at today's rates, not tomorrow's.",
      benefits: ["10 years / 120,000 miles of protection", "Covers parts and labor with a $100 deductible", "Rental and roadside benefits while in the shop", "Cancelable anytime for a prorated amount"] },
    vsc7: { icon: "🛡️", label: "Vehicle Service Contract", short: "VSC",
      headline: "Coverage that outlasts the factory warranty.",
      body: "Keeps the mechanical, electrical, and technology components covered after the factory coverage expires — parts and labor at today's rates.",
      benefits: ["7 years / 100,000 miles of protection", "$100 deductible per visit", "Rental and roadside benefits included"] },
    ppm8: { icon: "🔧", label: "Pre-Paid Maintenance", short: "Maintenance",
      headline: "Lock in today's maintenance prices.",
      body: "Every scheduled service for the life of the plan, prepaid at today's rates. How much was an oil change three years ago? Factory-trained technicians, OEM parts, and a documented service history that pays you back at trade-in.",
      benefits: ["8 years / 96,000 miles of scheduled service", "OEM parts and factory-trained technicians", "Inflation-proof — priced at today's rates", "Complete service records boost resale value"] },
    ppm3: { icon: "🔧", label: "Pre-Paid Maintenance", short: "Maintenance",
      headline: "Lock in today's maintenance prices.",
      body: "Every scheduled service in the plan, prepaid at today's rates with factory-trained technicians and OEM parts.",
      benefits: ["3 years / 36,000 miles of scheduled service", "OEM parts and multi-point inspections", "Service history documented for resale"] },
    gap: { icon: "🌉", label: "GAP Coverage", short: "GAP",
      headline: "Protection for the loan, not just the car.",
      body: "If the vehicle is ever totaled or stolen, insurance pays what the car is worth — not what you owe. GAP covers the difference so a total loss doesn't leave you making payments on a car you no longer have.",
      benefits: ["Covers the gap between payoff and insurance settlement", "Protects through the full loan term", "Deductible assistance included"] },
    multi: { icon: "📦", label: "Multi-Protect Bundle", short: "Bundle",
      headline: "One bundle. Four everyday protections.",
      body: "The four most common out-of-pocket repairs — tires and wheels, dents and dings, keys, and windshield chips — bundled into one plan for less than they cost separately.",
      benefits: ["Tire & wheel road hazard repair or replacement", "Paintless dent and ding removal", "Key and remote replacement", "Windshield chip repair"] },
    appear: { icon: "✨", label: "Appearance Protection", short: "Appearance",
      headline: "Keep it showroom-new.",
      body: "Modern paint is thinner and more environmentally fragile than ever, and interiors live hard lives. Appearance protection treats and covers the surfaces the factory warranty explicitly excludes.",
      benefits: ["5 years of exterior paint protection", "Interior stain and fade coverage", "Protects the resale value your trade depends on"] },
    lep: { icon: "🔑", label: "Lease-End Protection", short: "Lease-End",
      headline: "Turn the lease in with confidence.",
      body: "At lease turn-in, the leasing company bills for every scratch, stain, chip, and worn tire. Lease-end protection waives those charges so the car comes back like you drove it — no checkbook required.",
      benefits: ["Waives up to $5,000 in excess wear & tear", "Covers dents, scratches, chips, stains, and tire wear", "Missing parts covered up to $150"] },
    wind: { icon: "🪟", label: "Windshield Protection", short: "Windshield",
      headline: "Chips happen. Bills don't have to.",
      body: "Highway debris doesn't care how new your car is. Windshield protection repairs chips and cracks fast, before they spread into a full replacement.",
      benefits: ["3 years of coverage", "Repairs before cracks spread", "No deductible on covered repairs"] },
    roadhaz: { icon: "🛞", label: "Road Hazard Protection", short: "Road Hazard",
      headline: "The road doesn't care about your tires.",
      body: "Potholes, nails, and debris are the most common out-of-pocket surprise a new owner faces — and low-profile tires and alloy wheels make each incident more expensive than the last one you remember.",
      benefits: ["5 years of tire & wheel coverage", "Repair or replacement from road hazard damage", "Mounting, balancing, and taxes included"] },
    keyrep: { icon: "🗝️", label: "Key Replacement", short: "Key",
      headline: "Easy to misplace, yet costly to replace.",
      body: "Modern keys are as easy to lose as they ever were — but today's encrypted remotes and smart keys have made replacement dramatically more expensive. Key protection covers the cost of replacing your key and remote when they go missing.",
      benefits: ["Up to 84 months of coverage", "Up to $5,000 in total benefits", "Coverage for both key and remote", "Emergency roadside assistance included"] },
    tlp: { icon: "🚙", label: "Total Loss Protection", short: "Total Loss",
      headline: "If the worst happens, start fresh.",
      body: "A total loss shouldn't total your finances. Total loss protection provides a credit toward your replacement vehicle when insurance writes the car off — money that gets you back on the road here.",
      benefits: ["5 years of protection", "Replacement-vehicle credit on a covered total loss", "Works alongside your insurance settlement"] },
    recovery: { icon: "📡", label: "Theft Recovery", short: "Recovery",
      headline: "Stolen doesn't have to mean gone.",
      body: "A recovery system dramatically improves the odds your vehicle comes back — and pays a benefit if it doesn't. It also marks the vehicle as a harder target in the first place.",
      benefits: ["3 years of recovery service", "Benefit paid if the vehicle isn't recovered", "Theft deterrent registered to the VIN"] }
  },

  /* menu programs by deal type: product ids per column */
  programs: {
    finance: {
      preferred: { label: "Preferred", products: ["vsc10", "ppm8", "gap", "multi", "appear", "roadhaz", "keyrep"], termAdj: 0, aprAdj: 0 },
      standard:  { label: "Standard",  products: ["vsc7", "ppm3", "gap", "keyrep", "tlp"], termAdj: 0, aprAdj: 0 },
      budget:    { label: "Budget",    products: ["vsc10", "ppm8", "multi", "roadhaz"], termAdj: 12, aprAdj: 0.4 }
    },
    lease: {
      preferred: { label: "Full Service Lease", products: ["lep", "ppm3", "multi", "appear", "keyrep"] },
      standard:  { label: "Standard Lease",     products: ["lep", "ppm3"] },
      budget:    { label: "Limited Lease",      products: ["vsc10", "wind"] }
    },
    cash: {
      preferred: { label: "Preferred", products: ["vsc10", "ppm8", "multi", "appear", "roadhaz", "keyrep"] },
      standard:  { label: "Standard",  products: ["vsc7", "ppm3", "appear", "tlp"] }
    }
  },

  /* demo inventory (fictional stock; figures modeled on the binder examples) */
  /* colorCode / weight / seats / cyl / fuel are the registration-document
     specs the MV-82 recreation prints (2026-08-20): NY two-letter colour
     code (matches the training registrations), unladen weight, seating,
     cylinders, fuel G. Authored per vehicle rather than parsed from the
     engine string, so a Boxer cannot break a regex. All fictional-plausible,
     like every other spec in this catalog. */
  inventory: [
    { stock: "7H21313", colorCode: "BK", weight: 3890, seats: 5, cyl: 4, fuel: "G", vin: "5NMS4DAL4NH457995", year: 2022, make: "Hyundai", model: "Santa Fe", trim: "Limited", body: "SUV", type: "New",
      msrp: 42910, selling: 41431, includedOptions: 395, miles: 5, ext: "Twilight Black", int: "Gray", drive: "AWD", engine: "2.5L Turbo I4", mpg: "22/28",
      emoji: "🚙", hue: 250,
      blurb: "Panoramic sunroof, heated & ventilated leather, Highway Drive Assist, 360° camera." },
    { stock: "7H21477", colorCode: "GY", weight: 4284, seats: 7, cyl: 6, fuel: "G", vin: "KM8R5DHE6NU334821", year: 2022, make: "Hyundai", model: "Palisade", trim: "Limited", body: "SUV", type: "New",
      msrp: 49605, selling: 52105, includedOptions: 495, miles: 5, ext: "Moonlight Cloud", int: "Beige", drive: "AWD", engine: "3.8L V6", mpg: "19/24",
      emoji: "🚐", hue: 215,
      blurb: "7-passenger captain's chairs, dual sunroofs, Harman Kardon audio, tow package." },
    { stock: "7H21482", colorCode: "WH", weight: 3946, seats: 5, cyl: 4, fuel: "G", vin: "5NMS3DAJ2NH409112", year: 2022, make: "Hyundai", model: "Santa Fe", trim: "Calligraphy", body: "SUV", type: "New",
      msrp: 45765, selling: 45765, includedOptions: 0, miles: 12, ext: "Serenity White", int: "Black", drive: "AWD", engine: "2.5L Turbo I4", mpg: "21/28",
      emoji: "🚙", hue: 0,
      blurb: "Quilted Nappa leather, premium paint, 20\" alloys, remote smart park." },
    { stock: "B220997", colorCode: "RD", weight: 3417, seats: 5, cyl: 4, fuel: "G", vin: "WBA73AK07N7K56863", year: 2022, make: "BMW", model: "2 Series", trim: "228i xDrive Gran Coupe", body: "Sedan", type: "New",
      msrp: 47645, selling: 45035, includedOptions: 1995, miles: 8, ext: "Melbourne Red", int: "Black", drive: "AWD", engine: "2.0L Turbo I4", mpg: "23/33",
      emoji: "🚗", hue: 8,
      blurb: "M Performance package, live cockpit pro, ambient lighting, heated sport seats." },
    { stock: "B220331", colorCode: "BK", weight: 4696, seats: 5, cyl: 6, fuel: "G", vin: "WBA7U2C09NCG55107", year: 2022, make: "BMW", model: "7 Series", trim: "740i xDrive Sedan", body: "Sedan", type: "New",
      msrp: 97615, selling: 91460, includedOptions: 1972, miles: 10, ext: "Carbon Black", int: "Cognac", drive: "AWD", engine: "3.0L Turbo I6", mpg: "20/28",
      emoji: "🚘", hue: 230,
      blurb: "Executive lounge seating, laser headlights, gesture control, sky lounge roof." },
    { stock: "6S20300", colorCode: "GR", weight: 3937, seats: 5, cyl: 4, fuel: "G", vin: "4S4BTGUD6N3123889", year: 2022, make: "Subaru", model: "Outback", trim: "Touring XT", body: "Wagon", type: "New",
      msrp: 41995, selling: 40780, includedOptions: 350, miles: 6, ext: "Autumn Green", int: "Java Brown", drive: "AWD", engine: "2.4L Turbo Boxer", mpg: "23/30",
      emoji: "🚙", hue: 130,
      blurb: "EyeSight driver assist, Nappa leather, 11.6\" touchscreen, hands-free power gate." },
    { stock: "6S20922", colorCode: "BL", weight: 3449, seats: 5, cyl: 4, fuel: "G", vin: "JF2SKAXC4NH477215", year: 2022, make: "Subaru", model: "Forester", trim: "Premium", body: "SUV", type: "New",
      msrp: 31745, selling: 30990, includedOptions: 245, miles: 4, ext: "Horizon Blue", int: "Gray", drive: "AWD", engine: "2.5L Boxer", mpg: "26/33",
      emoji: "🚙", hue: 205,
      blurb: "Panoramic moonroof, X-Mode, heated seats, wireless CarPlay." },
    { stock: "U19834", colorCode: "GY", weight: 3591, seats: 5, cyl: 4, fuel: "G", vin: "5NMS3CAD3LH204577", year: 2020, make: "Hyundai", model: "Santa Fe", trim: "SEL 2.4", body: "SUV", type: "Used",
      msrp: 24990, selling: 23990, includedOptions: 0, miles: 31240, ext: "Machine Gray", int: "Black", drive: "AWD", engine: "2.4L I4", mpg: "21/27",
      emoji: "🚙", hue: 270,
      blurb: "One owner, clean history, new tires, remaining powertrain warranty." },
    { stock: "U20641", colorCode: "WH", weight: 3582, seats: 5, cyl: 4, fuel: "G", vin: "WBA5R7C55KAJ81226", year: 2019, make: "BMW", model: "3 Series", trim: "330i xDrive", body: "Sedan", type: "CPO",
      msrp: 31490, selling: 30490, includedOptions: 0, miles: 27882, ext: "Alpine White", int: "Oyster", drive: "AWD", engine: "2.0L Turbo I4", mpg: "25/34",
      emoji: "🚗", hue: 195,
      blurb: "Certified pre-owned — 1 yr unlimited-mile CPO coverage, premium package." },
    { stock: "U21077", colorCode: "RD", weight: 4432, seats: 7, cyl: 4, fuel: "G", vin: "4S4WMAPD1L3428441", year: 2020, make: "Subaru", model: "Ascent", trim: "Limited", body: "SUV", type: "CPO",
      msrp: 33985, selling: 32985, includedOptions: 0, miles: 35120, ext: "Crimson Red", int: "Slate", drive: "AWD", engine: "2.4L Turbo Boxer", mpg: "20/26",
      emoji: "🚐", hue: 350,
      blurb: "3-row certified SUV, tow package, heated leather, fresh service." },
    { stock: "7H22208", colorCode: "WH", weight: 4127, seats: 8, cyl: 6, fuel: "G", vin: "KM8SRDHF2NU391004", year: 2022, make: "Hyundai", model: "Palisade", trim: "SEL", body: "SUV", type: "New",
      msrp: 37635, selling: 43134, includedOptions: 0, miles: 24, ext: "Hyper White", int: "Black", drive: "FWD", engine: "3.8L V6", mpg: "19/26",
      emoji: "🚐", hue: 45,
      blurb: "8-passenger, blind-spot collision avoidance, hands-free liftgate." },
    { stock: "6S21440", colorCode: "SL", weight: 3652, seats: 5, cyl: 4, fuel: "G", vin: "4S4BTACC7N3211856", year: 2022, make: "Subaru", model: "Outback", trim: "Premium", body: "Wagon", type: "New",
      msrp: 30070, selling: 29490, includedOptions: 190, miles: 9, ext: "Ice Silver", int: "Gray", drive: "AWD", engine: "2.5L Boxer", mpg: "26/32",
      emoji: "🚙", hue: 170,
      blurb: "All-weather package, 11.6\" touchscreen, adaptive cruise." }
  ],

  discoveryQuestions: [
    { key: "week", title: "Describe a week in the life of your vehicle.", hint: "Commute, errands, road trips — paint the picture." },
    { key: "trips", title: "What trips do you take — near and far?", hint: "Weekend getaways? Mountains? Long highway drives?" },
    { key: "family", title: "Who rides with you?", hint: "Family, kids, carpool — how many seats do you really use?" },
    { key: "pets", title: "Any pets along for the ride?", hint: "Cargo space, seat protection, hair-friendly interiors." },
    { key: "activities", title: "What activities does your vehicle support?", hint: "Sports gear, camping, towing, home projects." },
    { key: "commute", title: "Tell me about your commute and parking.", hint: "Miles per year? Garage or street? Highway or city?" },
    { key: "drive", title: "How do you like a car to drive?", hint: "Sporty, comfortable, quiet, commanding view?" }
  ],

  testDriveTerms: [
    "I have a valid driver's license to operate a motor vehicle in this state and I presently have in effect liability and property damage insurance that meets or exceeds the minimum state requirements.",
    "I understand that this Test Drive Agreement must be in the vehicle at all times and that I must present it to a law enforcement officer upon request. I am authorized to drive the vehicle up to 20 miles and must return the vehicle to the dealership at the agreed time.",
    "I cannot remove the vehicle from this state or use the vehicle negligently or contrary to law. I must immediately report any damage, accident, theft, or vandalism involving the vehicle to the police, the dealership, and my insurance company.",
    "I have personally inspected the vehicle and found it free from any visible damage and/or defects, except as otherwise noted. I must pay for any loss or damage to the vehicle that occurs while the vehicle is in my possession or control.",
    "If I am in breach of this Agreement or fail to return the vehicle as required, I will be required to pay all expenses incurred by the dealership to have the vehicle returned.",
    "Additional authorized drivers are subject to all of the obligations and responsibilities as set forth in this Agreement."
  ],

  /* `code` is the permanent wire number the deal-jacket marker prints on a
     document the app generated. Never renumber one and never reuse a retired
     code — old paper in a filing cabinet would start meaning something else. */
  dealForms: [
    { id: "privacy", label: "Privacy Policy", group: "Delivery Forms", code: 1 },
    { id: "settings", label: "Personalized Setting Sheet", group: "Delivery Forms", code: 2 },
    { id: "accsheet", label: "Accessory Sell Sheet", group: "Delivery Forms", code: 3 },
    { id: "tqi", label: "TQI Checklist", group: "Delivery Forms", code: 4 },
    { id: "poa", label: "Power of Attorney Forms", group: "Motor Vehicle Forms", code: 5 },
    { id: "reg", label: "Registration & Title Application", group: "Motor Vehicle Forms", code: 6 },
    { id: "license", label: "Driver's License", group: "Motor Vehicle Forms", code: 7 },
    { id: "plates", label: "Transfer Plates Registration", group: "Motor Vehicle Forms", code: 8 },
    { id: "contracts", label: "Signed Contracts", group: "Financing Forms", code: 9 },
    { id: "creditmatch", label: "Signed Matching Credit App", group: "Financing Forms", code: 10 },
    { id: "fimenu", label: "F&I Menu Forms", group: "Financing Forms", code: 11 },
    { id: "riskdisc", label: "Risk-Based Disclosure", group: "Financing Forms", code: 12 },
    { id: "insurance", label: "Auto Insurance Card (Binder)", group: "Financing Forms", code: 13 },
    { id: "title", label: "Sign Title / Duplicate Title Form", group: "Trade-In Forms", code: 14 },
    { id: "lienrel", label: "Lien Release Letter", group: "Trade-In Forms", code: 15 },
    { id: "appraisal", label: "Appraisal Sheet", group: "Trade-In Forms", code: 16 },
    /* added 2026-08-16 with the jacket redesign — codes are permanent wire
       numbers, so new entries always take the next unused number */
    { id: "paystub", label: "Proof of Income (Paystub)", group: "Financing Forms", code: 17 },
    { id: "odometer", label: "Odometer Disclosure Statement", group: "Trade-In Forms", code: 18 },
    { id: "gapwaiver", label: "GAP Waiver / Addendum", group: "Financing Forms", code: 19 }
  ],

  /* the three documents a client sends through the text-request link (owner's
     prototype, matched element-for-element 2026-08-18). Keyed by the dealForms
     id. The scripted verification beats live here: missingPage fires while the
     page count is under minPages, firstIssue fires once on the first complete
     attempt (dates are computed at run time from the +days offsets). `checks`
     are the prototype's per-document review criteria, kept as reference data
     even though the current flow verifies instantly. */
  clientDocs: {
    insurance: {
      icon: "🛡", short: "Insurance Card", plainReason: "Needed for delivery",
      /* one plain line under the row title: what to bring, not why */
      sub: "Current binder or card",
      requirement: "Must show the vehicle by VIN or description, your name, the policy number, effective dates covering today, and comprehensive plus collision coverage. If the card runs to two pages, add both.",
      minPages: 1,
      multiNote: "May be multi-page. If your insurance card or binder has a second page, add both before you finish.",
      firstIssue: { title: "Expires within 45 days", days: 45, description: "Requires policy renewal or a binder showing active coverage beyond the temporary registration window." },
      checks: ["Vehicle matches or VIN matches", "Customer name and policy number are visible", "Effective dates include today", "Comprehensive and collision coverage are shown", "All pages are present if the card spans two pages"],
      sortDetail: "Active coverage",
      verifiedSummary: "VIN, customer name, and policy dates align with the active deal."
    },
    license: {
      icon: "🪪", short: "License", plainReason: "Needed for registration",
      /* one plain line under the row title: what to bring, not why */
      sub: "Front and back",
      requirement: "Front and back, unexpired, name matching the credit application. Not a photo of a photo, not a screenshot, not a temporary paper permit unless you also add the expired card.",
      minPages: 2,
      multiNote: "Two sides required. Capture the front and back — you can add the second side from the review screen.",
      missingPage: { title: "Back of Driver's License is missing", description: "Please capture both the front and back before submitting again." },
      checks: ["Front image is present and readable", "Back image is present and readable", "License is unexpired", "Name matches the credit application", "Image is an original capture, not a screenshot/photo of a photo"],
      sortDetail: "License unexpired",
      verifiedSummary: "Front and back are readable, the license is unexpired, and the customer name matches the credit application."
    },
    paystub: {
      icon: "📄", short: "Paystub", plainReason: "Bank requirement",
      /* one plain line under the row title: what to bring, not why */
      sub: "Two recent paystubs",
      requirement: "Your two most recent consecutive stubs, each showing employer name, pay period dates, and year-to-date gross. If you're self-employed, add “Other income type” instead.",
      minPages: 2,
      multiNote: "Two paystubs required. Add your two most recent consecutive stubs.",
      altIncome: true,
      missingPage: { title: "Second paystub is missing", description: "Please upload your two most recent consecutive paystubs." },
      checks: ["Two consecutive paystubs are present", "Employer name is visible", "Pay period dates are visible", "Year-to-date gross is visible", "Customer name matches the application"],
      sortDetail: "Two consecutive stubs",
      verifiedSummary: "Two consecutive paystubs were detected and the employer, pay dates, YTD gross, and customer name are readable."
    }
  },

  /* The demo deal opens part-way through, the way a real jacket is found
     mid-deal (owner, 2026-08-18). Only documents this deal has genuinely
     produced are listed — the drive is done, the trade is appraised — and
     each is recorded honestly as taken in by hand, never as a machine
     check. Empty this array to have the demo start with nothing collected. */
  seedJacket: [
    { id: "testdrive", note: "signed before the drive" },
    { id: "form-appraisal", note: "" },
    { id: "form-odometer", note: "" },
    { id: "form-plates", note: "plates come off the trade" }
  ],

  /* the documents the portal itself prints — the only ones it can ever
     recognise coming back, because it is the one that marked them */
  printedDocs: [
    { id: "cover", label: "Deal Cover Sheet", group: "Deal Packet", code: 41 },
    { id: "agreement", label: "Base Payment Agreement", group: "Deal Packet", code: 42 },
    { id: "repayment", label: "Repayment Options", group: "Deal Packet", code: 43 },
    { id: "testdrive", label: "Test Drive Agreement", group: "Deal Packet", code: 44 },
    { id: "delivery", label: "Delivery Checklist", group: "Deal Packet", code: 45 },
    { id: "rebates", label: "Applied Rebates", group: "Deal Packet", code: 46 },
    { id: "quote", label: "Saved Quote", group: "Deal Packet", code: 47 }
  ],

  seedCustomers: [
    { id: "c-demo1", first: "John", last: "Smith", middle: "", email: "jsmithtest@testing.com", phone: "(718) 555-0134",
      address: "31-14 Broadway", city: "Astoria", state: "NY", zip: "11106", creditScore: 740, createdAt: "2026-07-10T16:00:00Z" },
    /* Cheri carries the licence from prop 2 — a customer scanned on an earlier
       visit. She is what the manual licence-number search and a confident
       LICENSE MATCH have to find; John deliberately has neither licence nor
       date of birth, so a prop-1 scan still exercises the weaker name match
       and its side-by-side comparison. */
    { id: "c-demo2", first: "Cheri", last: "Bridwell", middle: "", email: "cbridwell@testing.com", phone: "(347) 555-1212",
      dob: "1990-11-02", license: { number: "T-0000102", state: "NY", expires: "2028-11-02" },
      address: "88 Garfield Pl", city: "Brooklyn", state: "NY", zip: "11215", creditScore: 705, createdAt: "2026-07-08T19:30:00Z" }
  ],

  /* license-scan prop personas — ALL FICTIONAL, printed as training props.
     prop 1 & 2 mirror the seed customers so a fresh demo shows "existing
     customer found"; 3–5 demo "new customer created". The barcode on each
     printed prop back encodes only the prop number — the scanner can never
     read anything else. */
  licenseProps: [
    { prop: 1, first: "John", middle: "A", last: "Smith", dob: "1987-03-14",
      license: { number: "T-0000101", state: "NY", expires: "2029-03-14" },
      address: "31-14 Broadway", city: "Astoria", state: "NY", zip: "11106",
      issued: "2025-03-14", cls: "D", sex: "M", eyes: "BRO", hgt: "5'-11\"" },
    { prop: 2, first: "Cheri", middle: "L", last: "Bridwell", dob: "1990-11-02",
      license: { number: "T-0000102", state: "NY", expires: "2028-11-02" },
      address: "88 Garfield Pl", city: "Brooklyn", state: "NY", zip: "11215",
      issued: "2024-11-02", cls: "D", sex: "F", eyes: "GRN", hgt: "5'-06\"" },
    { prop: 3, first: "Marcus", middle: "", last: "Alvarez", dob: "1995-06-21",
      license: { number: "T-0000103", state: "NY", expires: "2030-06-21" },
      address: "4102 Bell Blvd", city: "Bayside", state: "NY", zip: "11361",
      issued: "2025-06-21", cls: "D", sex: "M", eyes: "BRO", hgt: "5'-09\"" },
    { prop: 4, first: "Dana", middle: "K", last: "Whitfield", dob: "1983-09-08",
      license: { number: "T-0000104", state: "NY", expires: "2029-09-08" },
      address: "210 Clinton St", city: "Brooklyn", state: "NY", zip: "11201",
      issued: "2024-09-08", cls: "D", sex: "F", eyes: "BLU", hgt: "5'-04\"" },
    { prop: 5, first: "Priya", middle: "", last: "Natarajan", dob: "1999-01-27",
      license: { number: "T-0000105", state: "NY", expires: "2031-01-27" },
      address: "77 Bay St", city: "Staten Island", state: "NY", zip: "10301",
      issued: "2026-01-27", cls: "D", sex: "F", eyes: "BRO", hgt: "5'-05\"" }
  ],

  /* Printable training registrations — the trade-in counterpart to the prop
     licences, laid out like a New York State registration document so the
     rehearsal looks like the real conversation.

     The LAYOUT is taken from the owner's sample registrations (2026-08-19;
     the second, higher-fidelity sample set the portrait template); none of
     their DATA is. `prop` points at the licenceProp of the same number, so a
     trainee handed prop 1's licence and prop 1's registration is holding one
     consistent person — one registration per licence persona, all five.
     Vehicles are trade-ins, deliberately older than anything in `inventory` —
     a registration is something the customer brings in, not something the
     dealership issues.

     Everything here is fictional and self-evidently so: plates all start TSP
     (training sample prop), document numbers all start TS, VINs spell it out,
     office codes start TRN — and the printed card carries a SAMPLE overprint
     plus the standing TRAINING SAMPLE / NOT A GOVERNMENT DOCUMENT marks. */
  registrationProps: [
    { prop: 1, cls: "PAS", plateType: "G", plate: "TSP1001",
      year: 2016, make: "Toyota", body: "SUBN", color: "BK",
      vin: "4T1TRAININGSAMP01", transferable: "TRANSFERABLE",
      weight: "003820", fuel: "G", cyl: "4", docNo: "TS100001",
      office: "TRN OGTS01",
      issued: "2025-04-18", expires: "2027-04-18",
      region: "NYMA", annualChg: "32.50", amtPaid: "146.75" },
    { prop: 2, cls: "PAS", plateType: "G", plate: "TSP1002",
      year: 2014, make: "Honda", body: "4DSD", color: "GY",
      vin: "1HGTRAININGSAMP02", transferable: "TRANSFERABLE",
      weight: "003115", fuel: "G", cyl: "4", docNo: "TS100002",
      office: "TRN OGTS02",
      issued: "2025-09-02", expires: "2027-09-02",
      region: "NYMA", annualChg: "26.25", amtPaid: "118.50" },
    { prop: 3, cls: "PAS", plateType: "G", plate: "TSP1003",
      year: 2018, make: "Ford", body: "PICK", color: "WH",
      vin: "1FTTRAININGSAMP03", transferable: "NONTRANSFERABLE",
      weight: "005140", fuel: "G", cyl: "6", docNo: "TS100003",
      office: "TRN OGTS03",
      issued: "2026-01-11", expires: "2028-01-11",
      region: "NYMA", annualChg: "44.00", amtPaid: "198.25" },
    { prop: 4, cls: "PAS", plateType: "G", plate: "TSP1004",
      year: 2015, make: "Nissan", body: "4DSD", color: "RD",
      vin: "1N4TRAININGSAMP04", transferable: "TRANSFERABLE",
      weight: "003210", fuel: "G", cyl: "4", docNo: "TS100004",
      office: "TRN OGTS04",
      issued: "2025-06-27", expires: "2027-06-27",
      region: "NYMA", annualChg: "28.75", amtPaid: "131.00" },
    { prop: 5, cls: "PAS", plateType: "G", plate: "TSP1005",
      year: 2017, make: "Subaru", body: "SUBN", color: "BL",
      vin: "JF2TRAININGSAMP05", transferable: "TRANSFERABLE",
      weight: "003420", fuel: "G", cyl: "4", docNo: "TS100005",
      office: "TRN OGTS05",
      issued: "2026-03-05", expires: "2028-03-05",
      region: "NYMA", annualChg: "30.00", amtPaid: "152.25" }
  ]
};
