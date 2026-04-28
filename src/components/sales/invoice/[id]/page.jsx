"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SalesInvoice from "@/components/sales/SalesInvoice";

export default function SalesInvoicePage() {
  const params = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const res = await fetch(`/api/sales/${params.id}`);
        const data = await res.json();

        if (data.success) {
          setSale(data.data);
        } else {
          alert(data.message || "Invoice not found");
        }
      } catch (error) {
        console.error(error);
        alert("Invoice load failed");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchSale();
  }, [params.id]);

  if (loading) {
    return (
      <div className="bg-white border rounded-3xl p-8 text-center">
        Loading invoice...
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="bg-white border rounded-3xl p-8 text-center text-red-500">
        Invoice not found
      </div>
    );
  }

  return <SalesInvoice sale={sale} />;
}