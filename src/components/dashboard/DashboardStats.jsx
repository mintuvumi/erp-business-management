export default function DashboardStats({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 border rounded-lg bg-gray-50">
          <p className="text-xs text-gray-500">{item.label}</p>
          <p className="font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}