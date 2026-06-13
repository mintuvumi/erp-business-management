import { Suspense } from "react";
import SalesListClient from "./SalesListClient";

export default function SalesListPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading sales...</div>}>
      <SalesListClient />
    </Suspense>
  );
}