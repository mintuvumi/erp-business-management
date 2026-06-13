import { Suspense } from "react";
import StockClient from "./StockClient";

export default function StockPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading stock...</div>}>
      <StockClient />
    </Suspense>
  );
}