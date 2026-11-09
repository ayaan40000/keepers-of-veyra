// 1.4 Finance formulae (standard textbook forms) and the Merchants' Marks.
// Each formula with a "use" has a worked number whose answer is a whole number, checked twice by hand:
//   simple 1000*0.05*3 = 150; compound 1000*1.1^2 = 1210; CAGR (121/100)^(1/2) - 1 = 0.10;
//   NPV 110/1.1 - 100 = 0; FV annuity 100*(1.1^2 - 1)/0.1 = 210; ROI (250-200)/200 = 25%;
//   gross (500-300)/500 = 40%; net 50/500 = 10%; P/E 30/2 = 15; current 300/150 = 2; D/E 400/200 = 2;
//   break-even 1000/(15-5) = 100; rule of 72: 72/8 = 9.
// This is memory practice, not financial advice.
export const FINANCE = [
  { id: 'fin-simple', name: 'Simple interest', show: ['I', '=', 'P', '×', 'r', '×', 't'], blank: [2, 4, 6], legend: 'I interest, P principal, r yearly rate, t years', use: { q: '1,000 lent at 5% simple interest for 3 years. How much interest?', a: '150' } },
  { id: 'fin-compound', name: 'Compound interest', show: ['A', '=', 'P', '(1 + r/n)', '^(nt)'], blank: [3, 4], legend: 'A final amount, P principal, r yearly rate, n compounding periods a year, t years', alt: { 3: ['1+r/n', '(1+r/n)'], 4: ['nt', '(nt)', 'n t', 'n times t'] }, use: { q: '1,000 at 10% a year, compounded once a year, for 2 years. Final amount?', a: '1210' } },
  { id: 'fin-continuous', name: 'Continuous compounding', show: ['A', '=', 'P', 'e', '^(rt)'], blank: [3, 4], legend: 'e is about 2.718, r yearly rate, t years', alt: { 4: ['rt', '(rt)', 'r t'] } },
  { id: 'fin-cagr', name: 'CAGR (compound annual growth rate)', show: ['CAGR', '=', '(End ÷ Start)', '^(1/n)', '−', '1'], blank: [2, 3], legend: 'End and Start values, n years', alt: { 2: ['end/start', '(end/start)', 'end over start'], 3: ['1/n', '(1/n)'] }, use: { q: 'A fund grows from 100 to 121 in 2 years. CAGR in percent?', a: '10' } },
  { id: 'fin-npv', name: 'Net present value', show: ['NPV', '=', 'Σ CFₜ', '÷', '(1 + r)ᵗ', '−', 'C₀'], blank: [4, 6], legend: 'CFₜ cash flow in year t, r discount rate, C₀ initial outlay', alt: { 4: ['(1+r)^t', '1+r to the t'], 6: ['C0', 'initial outlay', 'initial investment'] }, use: { q: 'Pay 100 today; receive 110 in one year; discount rate 10%. NPV?', a: '0' } },
  { id: 'fin-pv-annuity', name: 'Present value of an annuity', show: ['PV', '=', 'PMT', '×', '[1 − (1 + r)⁻ⁿ]', '÷', 'r'], blank: [2, 6], legend: 'PMT payment each period, r rate per period, n periods', alt: { 2: ['payment'] } },
  { id: 'fin-fv-annuity', name: 'Future value of an annuity', show: ['FV', '=', 'PMT', '×', '[(1 + r)ⁿ − 1]', '÷', 'r'], blank: [2, 6], legend: 'PMT paid at the end of each period, r rate per period, n periods', alt: { 2: ['payment'] }, use: { q: '100 paid in at the end of each year for 2 years at 10%. Value at the end?', a: '210' } },
  { id: 'fin-roi', name: 'Return on investment', show: ['ROI', '=', '(Gain − Cost)', '÷', 'Cost'], blank: [2, 4], legend: 'as a percentage of what was put in', alt: { 2: ['gain - cost', 'gain minus cost'] }, use: { q: 'You pay 200 and get back 250. ROI in percent?', a: '25' } },
  { id: 'fin-gross', name: 'Gross margin', show: ['Gross margin', '=', '(Revenue − COGS)', '÷', 'Revenue'], blank: [2, 4], legend: 'COGS is the cost of goods sold', alt: { 2: ['revenue - cogs', 'revenue minus cogs'] }, use: { q: 'Revenue 500, cost of goods sold 300. Gross margin in percent?', a: '40' } },
  { id: 'fin-net', name: 'Net margin', show: ['Net margin', '=', 'Net income', '÷', 'Revenue'], blank: [2, 4], legend: 'profit after all costs and taxes, as a share of revenue', alt: { 2: ['net profit', 'profit'] }, use: { q: 'Net income 50 on revenue 500. Net margin in percent?', a: '10' } },
  { id: 'fin-pe', name: 'Price to earnings ratio', show: ['P/E', '=', 'Share price', '÷', 'Earnings per share'], blank: [2, 4], legend: 'how many years of current earnings the price pays for', alt: { 2: ['price'], 4: ['EPS'] }, use: { q: 'Share price 30, earnings per share 2. P/E?', a: '15' } },
  { id: 'fin-current', name: 'Current ratio', show: ['Current ratio', '=', 'Current assets', '÷', 'Current liabilities'], blank: [2, 4], legend: 'what a company can pay within a year against what it owes within a year', use: { q: 'Current assets 300, current liabilities 150. Current ratio?', a: '2' } },
  { id: 'fin-de', name: 'Debt to equity', show: ['D/E', '=', 'Total debt', '÷', "Shareholders' equity"], blank: [2, 4], legend: 'some analysts use total liabilities on top', alt: { 2: ['debt', 'total liabilities'], 4: ['equity', 'shareholders equity'] }, use: { q: "Total debt 400, shareholders' equity 200. Debt to equity?", a: '2' } },
  { id: 'fin-breakeven', name: 'Break-even units', show: ['Units', '=', 'Fixed costs', '÷', '(Price − Variable cost)'], blank: [2, 4], legend: 'variable cost per unit', alt: { 4: ['price - variable cost', 'price minus variable cost', 'contribution margin'] }, use: { q: 'Fixed costs 1,000; price 15; variable cost 5 a unit. Break-even units?', a: '100' } },
  { id: 'fin-72', name: 'Rule of 72 (a rough guide)', show: ['Years to double', '≈', '72', '÷', 'rate %'], blank: [2, 4], legend: 'works best for rates between about 4% and 12%', alt: { 4: ['rate', 'interest rate', 'r'] }, use: { q: 'Roughly how many years to double money at 8% a year?', a: '9' } },
];

// The Merchants' Marks: a fixed picture for each mathematical mark, learned like the Major list.
export const MARKS = [
  ['=', 'balanced scales'], ['+', 'a gull with spread wings'], ['−', 'a cut rope'], ['×', 'two crossed oars'],
  ['÷', 'a loaf broken in two'], ['fraction bar', 'a shelf, top over bottom'], ['² (squared)', 'a pair of boots'], ['³ (cubed)', 'a die'],
  ['√ (root)', 'a tree root'], ['^ (power)', 'a ladder'], ['Σ (sum)', 'a sack that swallows everything'], ['Δ (change)', 'a sail'],
  ['π (pi)', 'a pie'], ['e', 'an eel that keeps growing'], ['log', 'a floating log'], ['ln (natural log)', 'a log in a forest pond'],
  ['%', 'a pair of goggles'], ['<', 'an open beak facing the bigger fish'], ['≈ (about)', 'gentle waves'], ['∞ (infinity)', 'a rope in a figure eight'],
  ['! (factorial)', 'a candle on a stack of boxes'], ['subscript', 'a doormat under the letter'], ['superscript', 'a bird perched on the letter'], ['α (alpha)', 'an anchor'],
  ['β (beta)', 'a beehive'], ['γ (gamma)', 'a goose'], ['θ (theta, an angle)', 'a slice of cheese'], ['σ (sigma, spread)', 'a snake uncoiling'],
  ['μ (mu, the mean)', 'a mule'], ['λ (lambda)', 'a lamb'], ['ρ (rho)', 'a rowing boat'], ['ω (omega)', 'an owl'],
];
