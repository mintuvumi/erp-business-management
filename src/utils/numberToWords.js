export function numberToWordsBD(amount) {
  const n = Math.floor(Number(amount || 0));

  if (n === 0) return "Zero Taka Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function belowThousand(num) {
    let text = "";

    if (num >= 100) {
      text += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num >= 20) {
      text += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }

    if (num > 0) {
      text += ones[num] + " ";
    }

    return text.trim();
  }

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  let words = "";

  if (crore) words += belowThousand(crore) + " Crore ";
  if (lakh) words += belowThousand(lakh) + " Lakh ";
  if (thousand) words += belowThousand(thousand) + " Thousand ";
  if (rest) words += belowThousand(rest);

  return `${words.trim()} Taka Only`;
}