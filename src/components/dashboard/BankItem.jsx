export default function BankItem({ name, balance }) {
  return (
    <div className="p-3 border rounded-lg flex justify-between mb-2">
      <span>{name}</span>
      <span className="font-semibold">{balance}</span>
    </div>
  );
}