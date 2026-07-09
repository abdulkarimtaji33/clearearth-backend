/**
 * Converts a monetary amount to words, e.g. 472.50 AED -> "UAE Dirham Four Hundred Seventy-Two and Fifty Fils"
 */
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const SCALES = ['', 'Thousand', 'Million', 'Billion'];

const CURRENCY_WORDS = {
  AED: { major: 'UAE Dirham', minor: 'Fils' },
  USD: { major: 'United States Dollar', minor: 'Cent' },
  EUR: { major: 'Euro', minor: 'Cent' },
  GBP: { major: 'British Pound', minor: 'Pence' },
  SAR: { major: 'Saudi Riyal', minor: 'Halala' },
  KWD: { major: 'Kuwaiti Dinar', minor: 'Fils' },
};

function threeDigitsToWords(n) {
  let str = '';
  if (n >= 100) {
    str += `${ONES[Math.floor(n / 100)]} Hundred `;
    n %= 100;
  }
  if (n >= 20) {
    str += `${TENS[Math.floor(n / 10)]} `;
    n %= 10;
    if (n > 0) str = `${str.trim()}-${ONES[n]} `;
  } else if (n > 0) {
    str += `${ONES[n]} `;
  }
  return str.trim();
}

function integerToWords(num) {
  if (num === 0) return 'Zero';
  let str = '';
  let scaleIdx = 0;
  let n = num;
  const groups = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    str += `${threeDigitsToWords(groups[i])} ${SCALES[i]} `.trim() + ' ';
  }
  return str.replace(/\s+/g, ' ').trim();
}

function amountInWords(amount, currency = 'AED') {
  const num = Math.round((parseFloat(amount) || 0) * 100) / 100;
  const whole = Math.floor(num);
  const fraction = Math.round((num - whole) * 100);
  const cur = CURRENCY_WORDS[String(currency).toUpperCase()] || { major: String(currency).toUpperCase(), minor: 'Cents' };

  let words = `${cur.major} ${integerToWords(whole)}`;
  if (fraction > 0) {
    words += ` and ${integerToWords(fraction)} ${cur.minor}`;
  }
  return words.replace(/\s+/g, ' ').trim();
}

module.exports = { amountInWords };
