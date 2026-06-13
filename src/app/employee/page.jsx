import { Suspense } from "react";
import EmployeeClient from "./EmployeeClient";

export default function EmployeePage() {
  return (
    <Suspense fallback={<div className="p-4">Loading employee...</div>}>
      <EmployeeClient />
    </Suspense>
  );
}