export default function generateBillNo(count) {
  return `SAL-${String(count + 1).padStart(4, "0")}`;
}
