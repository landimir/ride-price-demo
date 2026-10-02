/* Ride Price Portal — deal math (finance, lease, cash, one-pay) */
"use strict";

const RIDE_PRICE_CALC = (function () {

  /* money to the cent, a half cent away from zero: the New York way (the
     owner, 2026-09-26: "Go with New York style", KA-006). The amount in cents
     is read to 15 significant digits first, so 1201.545, which a double holds
     as 1201.5449999999998, still rounds up to 1201.55. */
  const round2 = (n) => { const s = n < 0 ? -1 : 1; return s * Math.round(Number((Math.abs(n) * 100).toPrecision(15))) / 100; };

  function creditTier(score) {
    return RIDE_PRICE_DATA.creditTiers.find(t => score >= t.min) || RIDE_PRICE_DATA.creditTiers[RIDE_PRICE_DATA.creditTiers.length - 1];
  }

  function accessoriesTotal(ids) {
    return (ids || []).reduce((sum, id) => {
      const a = RIDE_PRICE_DATA.accessories.find(x => x.id === id);
      return sum + (a ? a.price : 0);
    }, 0);
  }

  function productById(id) { return RIDE_PRICE_DATA.products.find(p => p.id === id); }
  function productsTotal(ids) {
    return (ids || []).reduce((s, id) => s + (productById(id) ? productById(id).price : 0), 0);
  }

  const totalTaxRate = () => RIDE_PRICE_DATA.taxes.reduce((s, t) => s + t.rate, 0);

  /* Tax rates display at their true precision — two decimals normally, three
     when the rate needs it. NYC's MCTD rate is 0.375% and the combined rate is
     8.875%; a flat toFixed(2) rounded those to 0.38% and 8.88% on screen while
     the math used the real figure. Never widen this to fixed 3 decimals — it
     would print every ordinary rate as "4.000%". */
  const taxPct = (rate) => {
    const three = (rate * 100).toFixed(3);
    return three.endsWith("0") ? (rate * 100).toFixed(2) : three;
  };
  const totalFees = () => RIDE_PRICE_DATA.fees.reduce((s, f) => s + f.amount, 0);
  /* the documentation fee by name, because New York taxes it and the other
     three fees are not part of the taxable base */
  const docFee = () => {
    const f = RIDE_PRICE_DATA.fees.find(x => x.label === "Documentation Fee");
    return f ? f.amount : 0;
  };

  /* taxable base: your price + accessories + the documentation fee − trade
     allowance (when the tax credit applies). New York taxes the dealer
     documentation fee as part of the vehicle's price — the owner's chrome
     rule §19b and the v034 seed both state the base and its derivation, and
     every screen showing tax has to print it: $41,431.00 + $594.00 + $175.00
     − $15,500.00 = $26,700.00, which is $2,369.62 at 8.875%. The other three
     fees (inspection, registration and plates, tire tax) are government
     charges and stay out of the base. */
  function taxableBase(deal, vehicle, opts) {
    const o = opts || {};
    const price = vehicle.selling + vehicle.includedOptions + accessoriesTotal(deal.desk.accessories) + (o.productsTotal || 0);
    const tradeCredit = (deal.trade.applyTaxCredit && deal.trade.value > 0) ? deal.trade.value : 0;
    return Math.max(0, price + docFee() - tradeCredit);
  }

  /* New York's way (the owner, 2026-09-26, KA-006): the tax is the combined
     rate on the whole taxable base, rounded to the cent once, a half cent up.
     $26,700.00 at 8.875% is $2,369.625, so $2,369.63; the kit's box has
     $2,369.62, a half cent rounded down, which is for its next revision. The
     parts show to the cent and always add up to that total: each is its exact
     share rounded down, and the cents left over go to the parts with the
     largest remainders — Transit's $100.125 takes the one cent here. */
  function taxBreakdown(base) {
    const taxes = RIDE_PRICE_DATA.taxes;
    const total = round2(base * totalTaxRate());
    const exact = taxes.map(t => Number((base * t.rate * 100).toPrecision(15)));
    const cents = exact.map(x => Math.floor(x));
    let left = Math.round(total * 100) - cents.reduce((s, x) => s + x, 0);
    exact.map((x, i) => [x - cents[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1])
      .forEach(([, i]) => { if (left > 0) { cents[i] += 1; left -= 1; } });
    const rows = taxes.map((t, i) => ({ label: `${t.label} @ ${taxPct(t.rate)}%`, amount: cents[i] / 100 }));
    return { rows, total };
  }

  function amortize(principal, apr, months) {
    if (principal <= 0) return 0;
    const r = apr / 100 / 12;
    if (r === 0) return principal / months;
    return principal * r / (1 - Math.pow(1 + r, -months));
  }

  /* money beyond what the deal can use (the owner's answer C of 2026-09-28, Desking's DK-026 to DK-028, MR-10).
     `room` is what the deal can still take once the trade and the rebate are applied. Below $0, they come to more
     than the whole deal, and the rest is John's money, a check the dealership cuts: owedToCustomer. The cash Ashley
     types (the cash down, or a lease's due at signing) can take the deal to $0 and no further: mostCash is the most
     it can take, and cashBeyond what was typed over it, which the desk refuses on the screen. Each was floored away
     without a word before: $60,000 down priced at $0.00 a month, and a $52,000 trade on a cash deal left $10,042.50
     owed to John shown nowhere */
  function beyond(room, cash) {
    const most = Math.max(0, room);
    return { owedToCustomer: round2(Math.max(0, -room)), mostCash: round2(most), cashBeyond: round2(Math.max(0, cash - most)) };
  }

  /* ---------- FINANCE ---------- */
  function finance(deal, vehicle, opts) {
    const o = Object.assign({ apr: deal.desk.apr, term: deal.desk.term, products: [] }, opts || {});
    const acc = accessoriesTotal(deal.desk.accessories);
    const prodTotal = productsTotal(o.products);
    const yourPrice = vehicle.selling + vehicle.includedOptions + acc;
    const taxes = taxBreakdown(taxableBase(deal, vehicle, { productsTotal: prodTotal }));
    const fees = totalFees();
    const netTrade = (deal.trade.value || 0) - (deal.trade.payoff || 0);
    const amountFinanced = round2(yourPrice + prodTotal + taxes.total + fees - (deal.trade.rebates || 0) - netTrade - (deal.desk.downPayment || 0));
    const payment = round2(amortize(Math.max(0, amountFinanced), o.apr, o.term));
    return Object.assign({
      dealType: "finance", yourPrice: round2(yourPrice), accessories: acc, productsTotal: prodTotal,
      taxes, fees, netTrade: round2(netTrade), amountFinanced: Math.max(0, amountFinanced),
      payment, apr: o.apr, term: o.term, downPayment: deal.desk.downPayment || 0
    }, beyond(round2(yourPrice + prodTotal + taxes.total + fees - (deal.trade.rebates || 0) - netTrade), deal.desk.downPayment || 0));
  }

  /* ---------- LEASE ---------- */
  function lease(deal, vehicle, opts) {
    const o = Object.assign({ term: deal.desk.leaseTerm, miles: deal.desk.milesPerYear, factor: deal.desk.leaseFactor, products: [], dueAtSigning: deal.desk.dueAtSigning }, opts || {});
    /* Object.assign lets an explicit `factor: undefined` clobber the desk's
       own — a credit approval that carries an APR but no lease factor then
       priced every lease at $NaN. A missing factor falls back to the desk. */
    if (!isFinite(o.factor)) o.factor = deal.desk.leaseFactor;
    const acc = accessoriesTotal(deal.desk.accessories);
    const prodTotal = productsTotal(o.products);
    const yourPrice = vehicle.selling + vehicle.includedOptions + acc;
    const residualPct = RIDE_PRICE_DATA.residuals[o.term] || 0.6;
    /* mileage adjustment: baseline 12k; ±2% residual per 2,500 miles step */
    const mileAdj = (12000 - o.miles) / 2500 * 0.02;
    const residual = round2(vehicle.msrp * (residualPct + mileAdj));
    const netTrade = (deal.trade.value || 0) - (deal.trade.payoff || 0);
    const capCostReduction = Math.max(0, (o.dueAtSigning || 0)) + Math.max(0, netTrade) + (deal.trade.rebates || 0);
    /* a trade owed more than it is worth is the customer's to pay: the shortfall is added to the capitalized
       cost, as trade equity reduces it. Taking only the equity dropped it, so a lease cost the same whatever
       the trade still owed (MR-07, Desking's DK-020) */
    const negativeEquity = Math.max(0, -netTrade);
    const grossCap = yourPrice + prodTotal + RIDE_PRICE_DATA.leaseFees.acquisition + totalFees() + negativeEquity;
    const adjCap0 = Math.max(residual, grossCap - capCostReduction);
    const taxRate = totalTaxRate();
    /* New York collects a lease's sales tax at signing, on all of its payments and the money down, the cash and the
       rebate (Tax Law § 1111(i); the owner's answer A of 2026-09-28, Desking's DK-054). A trade is not taxed: its
       equity lowers the payments, and New York leaves a trade taken for resale out of a lease's receipts (Sales and
       Use Tax Regulations § 527.15(c)(5); TSB-A-96(19)S). Each payment was taxed instead, $29.70 a month on John's
       lease, and the tax on the money down was worked out and never charged. The payment is the base payment; the
       tax is the combined rate on its base, rounded once, as a purchase's is (KA-006).

       Paid or rolled in (the other half of answer A): the tax is assessed at signing either way, and John pays it
       then, or it goes into the lease's capitalized cost and the payments repay it. Rolled in, the payments that
       repay it are receipts from the lease too, so they are taxed as well: "the additional amounts included in the
       lease payments to repay the lessor for the tax paid" (Sales and Use Tax Regulations § 527.15(c)(4), Example 5).
       So the tax is 8.875% of its own base: it is priced into the cost again until it no longer moves, to the cent.
       Each round is about a tenth of the last, and the tax only climbs, so it settles on the least tax that is the
       rate on its own base; 60 rounds is a guard, never reached. John's goes $1,202.30, $1,313.49, $1,323.77,
       $1,324.73, $1,324.83: $372.99 a month, on a base of $14,927.64. The tax goes in after the money down and the
       residual floor, so the room below, the most due at signing and the money owed back are the same either way.
       Only a lease rolls it in: a one-pay is paid in full at signing, and rolling the tax in would only tax the
       tax and charge rent on it (onePay() says so, and so does every other caller that does not ask) */
    const rolled = o.taxInLease != null ? !!o.taxInLease : (deal.dealType === "lease" && !!(deal.desk && deal.desk.leaseTaxRolled));
    const cash = Math.max(0, o.dueAtSigning || 0), rebate = deal.trade.rebates || 0;
    const price = (cap) => {
      const adjCap = adjCap0 + cap;
      const depreciation = (adjCap - residual) / o.term;
      const rent = (adjCap + residual) * o.factor;
      const basePayment = round2(depreciation + rent);
      const taxBase = round2(basePayment * o.term + cash + rebate);
      return { basePayment, taxBase, tax: taxBreakdown(taxBase).total };
    };
    let cap = 0, p = price(0);
    for (let i = 0; rolled && i < 60 && p.tax !== cap; i++) { cap = p.tax; p = price(cap); }
    const basePayment = p.basePayment, taxBase = p.taxBase, leaseTax = p.tax;
    const taxAtSigning = rolled ? 0 : leaseTax, taxInLease = rolled ? leaseTax : 0;
    const payment = basePayment;
    /* the lease cannot go below its residual: what the trade equity and the rebate leave of that room is the most due
       at signing it can use */
    const room = round2(grossCap - residual - Math.max(0, netTrade) - rebate);
    /* taxes.atSigning stays true either way: New York assesses the tax at signing, and it tells this snapshot from one
       signed under the old per-payment rule (W-113). inLease says who pays it then: John, or the lease */
    return Object.assign({
      dealType: "lease", yourPrice: round2(yourPrice), accessories: acc, productsTotal: prodTotal,
      residual, residualPct: residualPct + mileAdj, term: o.term, miles: o.miles, factor: o.factor,
      basePayment, monthlyTax: 0, payment, capCostReduction: round2(capCostReduction), taxBase, taxAtSigning, taxInLease, leaseTax,
      acquisitionFee: RIDE_PRICE_DATA.leaseFees.acquisition, dueAtSigning: o.dueAtSigning || 0,
      taxes: { rows: [{ label: `New York sales tax, ${rolled ? "in the lease" : "at signing"} @ ${taxPct(taxRate)}%`, amount: leaseTax }], total: leaseTax, atSigning: true, inLease: rolled },
      fees: totalFees(), netTrade: round2(netTrade), negativeEquity: round2(negativeEquity)
    }, beyond(room, cash));
  }

  /* ---------- CASH ---------- */
  function cash(deal, vehicle, opts) {
    const o = opts || {};
    const acc = accessoriesTotal(deal.desk.accessories);
    const prodTotal = productsTotal(o.products || []);
    const yourPrice = vehicle.selling + vehicle.includedOptions + acc;
    const taxes = taxBreakdown(taxableBase(deal, vehicle, { productsTotal: prodTotal }));
    const fees = totalFees();
    const netTrade = (deal.trade.value || 0) - (deal.trade.payoff || 0);
    const totalDue = round2(yourPrice + prodTotal + taxes.total + fees - (deal.trade.rebates || 0) - netTrade);
    return Object.assign({
      dealType: "cash", yourPrice: round2(yourPrice), accessories: acc, productsTotal: prodTotal,
      taxes, fees, netTrade: round2(netTrade), totalDue: Math.max(0, totalDue), payment: 0
    }, beyond(totalDue, 0));
  }

  /* ---------- ONE-PAY LEASE ---------- */
  function onePay(deal, vehicle, opts) {
    const o = opts || {};
    /* One-pay: all base payments up front at a reduced money factor. The
       reduction applies to whichever base factor the caller is pricing at —
       taking the desk's factor unconditionally made an approved one-pay
       quote a total built on the agreed factor while every lease column
       beside it quoted the qualified one. */
    const base = isFinite(o.factor) ? o.factor : deal.desk.leaseFactor || 0.00117;
    const reduced = Math.max(0.00001, base - 0.0004);
    /* a one-pay pays its tax at signing, always: it is paid in full then, and rolling the tax into the lease would
       only tax the tax and charge rent on it, $13,418.64 for John's against $13,271.90 (DK-054, MR-16) */
    const l = lease(deal, vehicle, Object.assign({}, o, { factor: reduced, dueAtSigning: 0, taxInLease: false }));
    /* the payments pay the acquisition fee already: it is in the capitalized cost they are priced on, so the
       total is the payments and nothing more (MR-08, Desking's DK-023: it was added again, $595 twice), with New
       York's tax on them and on the rebate, all at signing; a trade is not taxed (DK-054) */
    const dueAtSigning = round2(l.payment * l.term + l.taxAtSigning);
    return Object.assign({}, l, { dealType: "onepay", dueAtSigning, payment: 0, onePayTotal: dueAtSigning, paymentsTotal: round2(l.payment * l.term) });
  }

  function calc(deal, vehicle, opts) {
    switch (deal.dealType) {
      case "lease": return lease(deal, vehicle, opts);
      case "cash": return cash(deal, vehicle, opts);
      case "onepay": return onePay(deal, vehicle, opts);
      default: return finance(deal, vehicle, opts);
    }
  }

  /* menu column payment for a given program */
  function menuColumn(deal, vehicle, programKey, program) {
    /* a withdrawn application is not a live approval — removing a co-buyer
       from a submitted joint one withdraws it, and the menu must not go on
       pricing off a rate that no longer stands */
    const q = deal.creditApp && deal.creditApp.approved && !deal.creditApp.withdrawnAt ? deal.creditApp : null;
    /* a one-pay lease has no monthly payment — every other surface quotes its
       onePayTotal, and a column that quoted a monthly figure would put a
       number in front of the customer that they never pay */
    if (deal.dealType === "onepay") {
      const r = onePay(deal, vehicle, { products: program.products, factor: q ? q.leaseFactor : deal.desk.leaseFactor });
      return { key: programKey, label: program.label, products: program.products, payment: r.onePayTotal, isTotal: true, term: r.term, detail: `${r.miles.toLocaleString()} mi/yr · ${r.term} mo, paid in full`, result: r };
    }
    if (deal.dealType === "lease") {
      const r = lease(deal, vehicle, { products: program.products, factor: q ? q.leaseFactor : deal.desk.leaseFactor });
      return { key: programKey, label: program.label, products: program.products, payment: r.payment, term: r.term, detail: `${r.miles.toLocaleString()} mi/yr · ${r.term} mo`, result: r };
    }
    if (deal.dealType === "cash") {
      const r = cash(deal, vehicle, { products: program.products });
      return { key: programKey, label: program.label, products: program.products, payment: r.totalDue, isTotal: true, detail: "Total due", result: r };
    }
    /* the lender's rate is `approvedApr` since the lending lane's package
       v032; `qualifiedApr` is what blobs saved before it carry, and a record
       holding neither must not price the whole menu at NaN */
    const qApr = q ? (q.approvedApr != null ? q.approvedApr : q.qualifiedApr) : null;
    /* every package is priced over the deal's own term and rate (§22b; the
       owner, 2026-09-26: "every math needs to be correct always", KA-013). A
       package that moved the term or the rate — Budget did, to 72 months at
       4.3% — would be a new structure the lender never approved (§18). */
    const apr = qApr != null ? qApr : deal.desk.apr;
    const term = deal.desk.term;
    const r = finance(deal, vehicle, { products: program.products, apr, term });
    /* PRODUCT MONEY IS DERIVED, NEVER ASSERTED (chrome rule §22b): a package
       payment is the agreed payment plus the amortization of the products it
       contains, over this deal's term and rate — $4,814.00 over 60 months at
       3.9% is +$88.44 a month, and the customer can check that. The full
       recalculation above is kept for `result`, which the print centre and
       the repayment page still read; what the menu QUOTES is the derived
       pair, so the delta on the row always amortizes back to the products
       beside it. */
    const baseR = finance(deal, vehicle, { apr, term });
    const products = productsTotal(program.products);
    const delta = round2(amortize(products, apr, term));
    const payment = round2(baseR.payment + delta);
    return {
      key: programKey, label: program.label, products: program.products, payment, term, apr,
      basePayment: baseR.payment, productsTotal: products, delta,
      detail: `${term} mo @ ${apr.toFixed(2)}%`, result: r
    };
  }

  const money = (n) => (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = (n) => (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

  return { creditTier, accessoriesTotal, productsTotal, productById, totalTaxRate, taxPct, totalFees, docFee, taxBreakdown, taxableBase, finance, lease, cash, onePay, calc, menuColumn, money, money0, round2, amortize };
})();
