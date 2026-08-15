/* Ride Price Portal — deal math (finance, lease, cash, one-pay) */
"use strict";

const RIDE_PRICE_CALC = (function () {

  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

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

  /* taxable base: your price + accessories − trade allowance (when tax credit applies) */
  function taxableBase(deal, vehicle, opts) {
    const o = opts || {};
    const price = vehicle.selling + vehicle.includedOptions + accessoriesTotal(deal.desk.accessories) + (o.productsTotal || 0);
    const tradeCredit = (deal.trade.applyTaxCredit && deal.trade.value > 0) ? deal.trade.value : 0;
    return Math.max(0, price - tradeCredit);
  }

  function taxBreakdown(base) {
    const rows = RIDE_PRICE_DATA.taxes.map(t => ({ label: `${t.label} @ ${taxPct(t.rate)}%`, amount: round2(base * t.rate) }));
    return { rows, total: round2(rows.reduce((s, r) => s + r.amount, 0)) };
  }

  function amortize(principal, apr, months) {
    if (principal <= 0) return 0;
    const r = apr / 100 / 12;
    if (r === 0) return principal / months;
    return principal * r / (1 - Math.pow(1 + r, -months));
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
    return {
      dealType: "finance", yourPrice: round2(yourPrice), accessories: acc, productsTotal: prodTotal,
      taxes, fees, netTrade: round2(netTrade), amountFinanced: Math.max(0, amountFinanced),
      payment, apr: o.apr, term: o.term, downPayment: deal.desk.downPayment || 0
    };
  }

  /* ---------- LEASE ---------- */
  function lease(deal, vehicle, opts) {
    const o = Object.assign({ term: deal.desk.leaseTerm, miles: deal.desk.milesPerYear, factor: deal.desk.leaseFactor, products: [], dueAtSigning: deal.desk.dueAtSigning }, opts || {});
    const acc = accessoriesTotal(deal.desk.accessories);
    const prodTotal = productsTotal(o.products);
    const yourPrice = vehicle.selling + vehicle.includedOptions + acc;
    const residualPct = RIDE_PRICE_DATA.residuals[o.term] || 0.6;
    /* mileage adjustment: baseline 12k; ±2% residual per 2,500 miles step */
    const mileAdj = (12000 - o.miles) / 2500 * 0.02;
    const residual = round2(vehicle.msrp * (residualPct + mileAdj));
    const netTrade = (deal.trade.value || 0) - (deal.trade.payoff || 0);
    const capCostReduction = Math.max(0, (o.dueAtSigning || 0)) + Math.max(0, netTrade) + (deal.trade.rebates || 0);
    const grossCap = yourPrice + prodTotal + RIDE_PRICE_DATA.leaseFees.acquisition + totalFees();
    const adjCap = Math.max(residual, grossCap - capCostReduction);
    const depreciation = (adjCap - residual) / o.term;
    const rent = (adjCap + residual) * o.factor;
    const basePayment = round2(depreciation + rent);
    const taxRate = totalTaxRate();
    const monthlyTax = round2(basePayment * taxRate);
    const payment = round2(basePayment + monthlyTax);
    const ccrTax = round2(capCostReduction * taxRate);
    return {
      dealType: "lease", yourPrice: round2(yourPrice), accessories: acc, productsTotal: prodTotal,
      residual, residualPct: residualPct + mileAdj, term: o.term, miles: o.miles, factor: o.factor,
      basePayment, monthlyTax, payment, capCostReduction: round2(capCostReduction), ccrTax,
      acquisitionFee: RIDE_PRICE_DATA.leaseFees.acquisition, dueAtSigning: o.dueAtSigning || 0,
      taxes: { rows: [{ label: `Sales Tax on Payment @ ${taxPct(taxRate)}%`, amount: monthlyTax }], total: monthlyTax },
      fees: totalFees(), netTrade: round2(netTrade)
    };
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
    return {
      dealType: "cash", yourPrice: round2(yourPrice), accessories: acc, productsTotal: prodTotal,
      taxes, fees, netTrade: round2(netTrade), totalDue: Math.max(0, totalDue), payment: 0
    };
  }

  /* ---------- ONE-PAY LEASE ---------- */
  function onePay(deal, vehicle, opts) {
    const o = opts || {};
    /* one-pay: all base payments up front at a reduced money factor */
    const reduced = Math.max(0.00001, (deal.desk.leaseFactor || 0.00117) - 0.0004);
    const l = lease(deal, vehicle, Object.assign({}, o, { factor: reduced, dueAtSigning: 0 }));
    const dueAtSigning = round2(l.payment * l.term + RIDE_PRICE_DATA.leaseFees.acquisition);
    return Object.assign({}, l, { dealType: "onepay", dueAtSigning, payment: 0, onePayTotal: dueAtSigning });
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
    const q = deal.creditApp && deal.creditApp.approved ? deal.creditApp : null;
    if (deal.dealType === "lease" || deal.dealType === "onepay") {
      const r = lease(deal, vehicle, { products: program.products, factor: q ? q.leaseFactor : deal.desk.leaseFactor });
      return { key: programKey, label: program.label, products: program.products, payment: r.payment, term: r.term, detail: `${r.miles.toLocaleString()} mi/yr · ${r.term} mo`, result: r };
    }
    if (deal.dealType === "cash") {
      const r = cash(deal, vehicle, { products: program.products });
      return { key: programKey, label: program.label, products: program.products, payment: r.totalDue, isTotal: true, detail: "Total due", result: r };
    }
    const apr = (q ? q.qualifiedApr : deal.desk.apr) + (program.aprAdj || 0);
    const term = deal.desk.term + (program.termAdj || 0);
    const r = finance(deal, vehicle, { products: program.products, apr, term });
    return { key: programKey, label: program.label, products: program.products, payment: r.payment, term, apr, detail: `${term} mo @ ${apr.toFixed(2)}%`, result: r };
  }

  const money = (n) => (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = (n) => (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

  return { creditTier, accessoriesTotal, productsTotal, productById, totalTaxRate, taxPct, totalFees, taxBreakdown, taxableBase, finance, lease, cash, onePay, calc, menuColumn, money, money0, round2 };
})();
