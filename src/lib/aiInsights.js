export function generateAIInsights({
  sales,
  purchases,
  cash,
  bank,
}) {
  const insights = [];

  // 🔥 Sales drop detection
  const last7 = sales.slice(0, 7).reduce((s, x) => s + x.netTotal, 0);
  const prev7 = sales.slice(7, 14).reduce((s, x) => s + x.netTotal, 0);

  if (prev7 > 0 && last7 < prev7 * 0.8) {
    insights.push({
      type: "warning",
      title: "Sales Dropping",
      message: "Last 7 days sales decreased. Try marketing boost.",
    });
  }

  // 💸 Cash low
  if (cash < 5000) {
    insights.push({
      type: "danger",
      title: "Low Cash",
      message: "Cash is running low. Control expense or add capital.",
    });
  }

  // 🏦 Bank low
  if (bank < 10000) {
    insights.push({
      type: "warning",
      title: "Low Bank Balance",
      message: "Bank balance is low.",
    });
  }

  // 📈 Profit check
  if (last7 > prev7) {
    insights.push({
      type: "success",
      title: "Sales Growing",
      message: "Great! Your sales increased this week.",
    });
  }

  return insights;
}