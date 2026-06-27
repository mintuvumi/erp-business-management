import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getTenant } from "@/lib/tenant";

import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Stock from "@/models/Stock";
import Employee from "@/models/Employee";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import SalaryPayment from "@/models/SalaryPayment";
import AdvanceSalary from "@/models/AdvanceSalary";
import Loan from "@/models/Loan";

let Customer = null;
let Supplier = null;
let MarketingOfficer = null;
let CompanySetting = null;

try {
  Customer = (await import("@/models/Customer")).default;
} catch {}

try {
  Supplier = (await import("@/models/Supplier")).default;
} catch {}

try {
  MarketingOfficer = (await import("@/models/MarketingOfficer")).default;
} catch {}

try {
  CompanySetting = (await import("@/models/CompanySetting")).default;
} catch {}

function clean(value) {
  return String(value || "").toLowerCase().trim();
}

function safeRegex(q) {
  return {
    $regex: String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    $options: "i",
  };
}

function makeResult(item) {
  return {
    id: String(item.id || item._id || ""),
    type: item.type || "Result",
    title: item.title || item.name || "Untitled",
    name: item.name || item.title || "Untitled",
    subtitle: item.subtitle || item.subTitle || "",
    subTitle: item.subTitle || item.subtitle || "",
    amount: Number(item.amount || 0),
    date: item.date || "",
    route: item.route || item.path || "/dashboard",
    path: item.path || item.route || "/dashboard",
    action: item.action || "open",
    keywords: item.keywords || "",
    priority: Number(item.priority || 0),
  };
}

function scoreItem(item, q) {
  const query = clean(q);
  const name = clean(item.name);
  const title = clean(item.title);
  const subtitle = clean(item.subtitle || item.subTitle);
  const keywords = clean(item.keywords);
  const type = clean(item.type);

  let score = 0;

  if (name === query) score += 10000;
  if (title === query) score += 9500;
  if (keywords.split(/\s+/).includes(query)) score += 8000;

  if (name.startsWith(query)) score += 5000;
  if (title.startsWith(query)) score += 4500;
  if (keywords.startsWith(query)) score += 3500;

  if (name.includes(query)) score += 2000;
  if (title.includes(query)) score += 1800;
  if (subtitle.includes(query)) score += 900;
  if (keywords.includes(query)) score += 850;
  if (type.includes(query)) score += 300;

  score += Number(item.priority || 0);

  return score;
}

function staticCommands(settings = {}) {
  const isManufacturing =
    settings?.businessType === "manufacturing" ||
    settings?.manufacturingEnabled === true;

  return [
    {
      type: "Menu",
      title: "Dashboard",
      name: "Dashboard",
      subtitle: "Business overview",
      keywords: "dashboard overview summary home",
      route: "/dashboard",
      priority: 300,
    },
    {
      type: "Menu",
      title: "Sales",
      name: "Sales",
      subtitle: "Create or view sales",
      keywords: "sales invoice bill customer sale",
      route: "/sales",
      priority: 300,
    },
    {
      type: "Menu",
      title: "Sales List",
      name: "Sales List",
      subtitle: "View all invoices",
      keywords: "sales list invoice list bill list",
      route: "/sales/list",
      priority: 300,
    },
    {
      type: "Menu",
      title: "Purchase",
      name: "Purchase",
      subtitle: "Purchase entry",
      keywords: "purchase buy supplier stock in",
      route: "/purchase",
      priority: 260,
    },
    {
      type: "Menu",
      title: "Stock",
      name: "Stock",
      subtitle: "Inventory stock",
      keywords: "stock inventory product item barcode sku",
      route: "/stock",
      priority: 260,
    },
    {
      type: "Menu",
      title: "Customers",
      name: "Customers",
      subtitle: "Customer ledger and due",
      keywords: "customer customers due ledger collection",
      route: "/customers",
      priority: 260,
    },
    {
      type: "Menu",
      title: "Customer Statement",
      name: "Customer Statement",
      subtitle: "Customer account statement",
      keywords: "customer statement ledger due collection",
      route: "/customers/statement",
      priority: 260,
    },
    {
      type: "Menu",
      title: "Suppliers",
      name: "Suppliers",
      subtitle: "Supplier management",
      keywords: "supplier suppliers vendor",
      route: "/suppliers",
      priority: 240,
    },
    {
      type: "Menu",
      title: "Supplier Ledger",
      name: "Supplier Ledger",
      subtitle: "Supplier payable statement",
      keywords: "supplier ledger due purchase payable",
      route: "/suppliers/ledger",
      priority: 240,
    },
    {
      type: "Menu",
      title: "Cash",
      name: "Cash",
      subtitle: "Cash in hand transactions",
      keywords: "cash cash in hand cash transaction",
      route: "/cash",
      priority: 240,
    },
    {
      type: "Menu",
      title: "Bank",
      name: "Bank",
      subtitle: "Bank accounts and statement",
      keywords: "bank statement account transaction cheque",
      route: "/bank",
      priority: 240,
    },
    {
      type: "Menu",
      title: "Accounts",
      name: "Accounts",
      subtitle: "Accounts dashboard",
      keywords: "accounts finance balance cash bank profit loss",
      route: "/accounts",
      priority: 220,
    },
    {
      type: "Menu",
      title: "Profit & Loss",
      name: "Profit & Loss",
      subtitle: "Business profit/loss report",
      keywords: "profit loss pnl income expense",
      route: "/accounts/profit-loss",
      priority: 220,
    },
    {
      type: "Menu",
      title: "Marketing Officers",
      name: "Marketing Officers",
      subtitle: "Sales officer and collection",
      keywords: "marketing officer sales officer collection follow up",
      route: "/marketing-officers",
      priority: 220,
    },
    {
      type: "Menu",
      title: "Employee",
      name: "Employee",
      subtitle: "Employee management",
      keywords: "employee staff hr salary attendance",
      route: "/employee",
      priority: 200,
    },
    {
      type: "Menu",
      title: "Settings",
      name: "Settings",
      subtitle: "Company settings",
      keywords: "settings company business setup profile",
      route: "/settings",
      priority: 200,
    },
    ...(isManufacturing
      ? [
          {
            type: "Manufacturing Menu",
            title: "Production",
            name: "Production",
            subtitle: "Manufacturing production",
            keywords: "production manufacturing factory",
            route: "/production",
            priority: 500,
          },
          {
            type: "Manufacturing Menu",
            title: "Raw Material",
            name: "Raw Material",
            subtitle: "Raw material stock",
            keywords: "raw material manufacturing stock",
            route: "/production/raw-material",
            priority: 500,
          },
          {
            type: "Manufacturing Menu",
            title: "BOM",
            name: "BOM",
            subtitle: "Bill of materials",
            keywords: "bom recipe bill of material manufacturing",
            route: "/production/bom",
            priority: 500,
          },
          {
            type: "Manufacturing Menu",
            title: "Work Order",
            name: "Work Order",
            subtitle: "Manufacturing work order",
            keywords: "work order factory production",
            route: "/production/work-order",
            priority: 500,
          },
          {
            type: "Manufacturing Menu",
            title: "Engineering Offers",
            name: "Engineering Offers",
            subtitle: "Offer and quotation",
            keywords: "offer quotation engineering proposal",
            route: "/engineering-offers",
            priority: 500,
          },
        ]
      : []),
  ].map(makeResult);
}

function dueReminderResults(sales = []) {
  const today = new Date().toISOString().slice(0, 10);

  return sales
    .filter((s) => Number(s.dueAmount || 0) > 0)
    .map((s) => {
      const nextDate =
        s.nextCollectionDate ||
        s.dueSchedule?.nextDueDate ||
        s.dueSchedule?.promiseDate ||
        "";

      const isDueToday = nextDate === today;
      const isOverdue = nextDate && nextDate < today;

      return makeResult({
        type: isOverdue ? "Overdue Collection" : "Due Collection",
        title: `${s.customerName || "Customer"} - Due ৳ ${Number(
          s.dueAmount || 0
        ).toFixed(2)}`,
        name: s.customerName || s.billNo || "Due Collection",
        subtitle: `Bill: ${s.billNo || s.invoiceNo || "-"} • ${
          nextDate ? `Next: ${nextDate}` : "No reminder date"
        }`,
        keywords: `${s.customerName || ""} ${s.customerPhone || ""} ${
          s.billNo || ""
        } ${s.invoiceNo || ""} due collection reminder installment ${
          s.marketingOfficerName || ""
        } ${s.collectionComment || ""}`,
        amount: Number(s.dueAmount || 0),
        date: nextDate || s.date || s.createdAt,
        route: `/customers/profile?id=${s.customerId || ""}`,
        priority: isDueToday ? 1200 : isOverdue ? 1100 : 700,
      });
    });
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: [] },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q) return NextResponse.json({ success: true, data: [] });

    const regex = safeRegex(q);
    const baseFilter = { companyId: tenant.companyId };

    const settings = CompanySetting
      ? await CompanySetting.findOne({ companyId: tenant.companyId }).lean()
      : null;

    const [
      employees,
      sales,
      stocks,
      purchases,
      cashTransactions,
      bankAccounts,
      bankTransactions,
      salaryPayments,
      advances,
      loans,
      customers,
      suppliers,
      marketingOfficers,
    ] = await Promise.all([
      Employee.find({
        ...baseFilter,
        status: "active",
        $or: [
          { name: regex },
          { phone: regex },
          { email: regex },
          { employeeId: regex },
          { employeeCode: regex },
          { designation: regex },
          { department: regex },
          { bankName: regex },
          { bankAccountNo: regex },
        ],
      }).sort({ createdAt: -1 }).limit(25).lean(),

      Sale.find({
        ...baseFilter,
        status: { $ne: "cancelled" },
        $or: [
          { billNo: regex },
          { manualBillNo: regex },
          { invoiceNo: regex },
          { customerName: regex },
          { customerPhone: regex },
          { customerEmail: regex },
          { marketingOfficerName: regex },
          { paymentType: regex },
          { note: regex },
          { collectionComment: regex },
          { lastCollectionComment: regex },
          { nextCollectionDate: regex },
          { "items.name": regex },
          { "items.itemName": regex },
          { "items.productName": regex },
          { "dueSchedule.nextDueDate": regex },
          { "dueSchedule.promiseDate": regex },
          { "dueSchedule.reminderNote": regex },
        ],
      }).sort({ createdAt: -1 }).limit(30).lean(),

      Stock.find({
        ...baseFilter,
        status: "active",
        $or: [
          { itemName: regex },
          { productName: regex },
          { category: regex },
          { brand: regex },
          { model: regex },
          { productCode: regex },
          { code: regex },
          { sku: regex },
          { barcode: regex },
          { supplierName: regex },
          { warehouse: regex },
          { rackNo: regex },
        ],
      }).sort({ createdAt: -1 }).limit(25).lean(),

      Purchase.find({
        ...baseFilter,
        status: { $ne: "cancelled" },
        $or: [
          { billNo: regex },
          { invoiceNo: regex },
          { supplierName: regex },
          { supplierPhone: regex },
          { itemName: regex },
          { productName: regex },
          { paymentType: regex },
          { purchaseType: regex },
          { note: regex },
          { "items.name": regex },
          { "items.itemName": regex },
          { "items.productName": regex },
        ],
      }).sort({ createdAt: -1 }).limit(20).lean(),

      CashTransaction.find({
        ...baseFilter,
        status: { $ne: "cancelled" },
        $or: [
          { title: regex },
          { category: regex },
          { note: regex },
          { comment: regex },
          { refType: regex },
          { refId: regex },
          { voucherNo: regex },
          { head: regex },
          { employeeName: regex },
          { customerName: regex },
          { customerPhone: regex },
          { marketingOfficerName: regex },
          { billNo: regex },
          { paymentType: regex },
        ],
      }).sort({ createdAt: -1 }).limit(20).lean(),

      BankAccount.find({
        ...baseFilter,
        status: "active",
        $or: [
          { bankName: regex },
          { accountName: regex },
          { accountNo: regex },
          { accountNumber: regex },
          { branchName: regex },
          { routingNumber: regex },
          { note: regex },
        ],
      }).sort({ createdAt: -1 }).limit(20).lean(),

      BankTransaction.find({
        ...baseFilter,
        status: { $ne: "cancelled" },
        $or: [
          { transactionNo: regex },
          { title: regex },
          { category: regex },
          { note: regex },
          { refType: regex },
          { refId: regex },
          { voucherNo: regex },
          { chequeNo: regex },
          { transactionId: regex },
          { personName: regex },
        ],
      }).populate("bankId").sort({ createdAt: -1 }).limit(20).lean(),

      SalaryPayment.find({
        ...baseFilter,
        $or: [
          { employeeName: regex },
          { month: regex },
          { paymentMethod: regex },
          { note: regex },
        ],
      }).sort({ createdAt: -1 }).limit(12).lean(),

      AdvanceSalary.find({
        ...baseFilter,
        $or: [
          { employeeName: regex },
          { paidBy: regex },
          { status: regex },
          { note: regex },
        ],
      }).sort({ createdAt: -1 }).limit(12).lean(),

      Loan.find({
        ...baseFilter,
        $or: [{ lenderName: regex }, { loanType: regex }, { note: regex }],
      }).sort({ createdAt: -1 }).limit(12).lean(),

      Customer
        ? Customer.find({
            ...baseFilter,
            status: { $ne: "inactive" },
            $or: [
              { name: regex },
              { phone: regex },
              { email: regex },
              { address: regex },
              { customerCode: regex },
            ],
          }).sort({ createdAt: -1 }).limit(25).lean()
        : Promise.resolve([]),

      Supplier
        ? Supplier.find({
            ...baseFilter,
            status: { $ne: "inactive" },
            $or: [
              { name: regex },
              { supplierName: regex },
              { phone: regex },
              { email: regex },
              { address: regex },
              { supplierCode: regex },
            ],
          }).sort({ createdAt: -1 }).limit(25).lean()
        : Promise.resolve([]),

      MarketingOfficer
        ? MarketingOfficer.find({
            ...baseFilter,
            status: "active",
            $or: [
              { name: regex },
              { phone: regex },
              { email: regex },
              { designation: regex },
              { officerCode: regex },
            ],
          }).sort({ createdAt: -1 }).limit(25).lean()
        : Promise.resolve([]),
    ]);

    const results = [
      ...staticCommands(settings),

      ...dueReminderResults(sales),

      ...customers.map((c) =>
        makeResult({
          id: c._id,
          type: "Customer",
          title: c.name || "Customer",
          subtitle: `${c.phone || ""} • Due ৳ ${Number(
            c.dueAmount || c.balance || 0
          ).toFixed(2)}`,
          keywords: `${c.name || ""} ${c.phone || ""} ${c.email || ""} ${
            c.address || ""
          } ${c.customerCode || ""} customer due collection ledger`,
          amount: Number(c.dueAmount || c.balance || 0),
          date: c.createdAt,
          route: `/customers/profile?id=${c._id}`,
          priority: 1000,
        })
      ),

      ...sales.map((s) =>
        makeResult({
          id: s._id,
          type: "Sale",
          title: `${s.customerName || "Customer"} - ${
            s.billNo || s.invoiceNo || "Sale"
          }`,
          subtitle: `Bill: ${s.billNo || s.invoiceNo || "-"} • Due ৳ ${Number(
            s.dueAmount || 0
          ).toFixed(2)}`,
          keywords: `${s.billNo || ""} ${s.manualBillNo || ""} ${
            s.invoiceNo || ""
          } ${s.customerName || ""} ${s.customerPhone || ""} ${
            s.customerEmail || ""
          } ${s.marketingOfficerName || ""} ${s.collectionComment || ""} ${
            s.lastCollectionComment || ""
          } ${s.nextCollectionDate || ""} ${
            s.items
              ?.map(
                (i) =>
                  `${i.name || ""} ${i.itemName || ""} ${i.productName || ""}`
              )
              .join(" ") || ""
          } sale invoice due collection installment`,
          amount: Number(s.netReceivable || s.netTotal || s.invoiceTotal || 0),
          date: s.date || s.createdAt,
          route: `/sales/list?id=${s._id}`,
          priority: 950,
        })
      ),

      ...stocks.map((s) =>
        makeResult({
          id: s._id,
          type: "Stock",
          title: s.itemName || s.productName || "Stock Item",
          subtitle: `Qty ${Number(s.qty || 0)} • Value ৳ ${Number(
            s.totalValue || 0
          ).toFixed(2)}`,
          keywords: `${s.itemName || ""} ${s.productName || ""} ${
            s.category || ""
          } ${s.brand || ""} ${s.model || ""} ${s.productCode || ""} ${
            s.code || ""
          } ${s.sku || ""} ${s.barcode || ""} ${
            s.supplierName || ""
          } stock inventory product item`,
          amount: Number(s.totalValue || 0),
          date: s.createdAt,
          route: `/stock?id=${s._id}`,
          priority: 900,
        })
      ),

      ...employees.map((e) =>
        makeResult({
          id: e._id,
          type: "Employee",
          title: e.name,
          subtitle: `${e.designation || "Employee"} • ${e.phone || ""}`,
          keywords: `${e.name || ""} ${e.phone || ""} ${e.email || ""} ${
            e.employeeId || ""
          } ${e.employeeCode || ""} ${e.designation || ""} ${
            e.department || ""
          } employee staff salary attendance`,
          amount: Number(e.basicSalary || 0),
          date: e.createdAt,
          route: `/employee?id=${e._id}`,
          priority: 850,
        })
      ),

      ...marketingOfficers.map((m) =>
        makeResult({
          id: m._id,
          type: "Marketing Officer",
          title: m.name,
          subtitle: `${m.designation || "Marketing Officer"} • ${
            m.phone || ""
          }`,
          keywords: `${m.name || ""} ${m.phone || ""} ${m.email || ""} ${
            m.designation || ""
          } ${m.officerCode || ""} marketing officer collection customer ledger`,
          amount: Number(m.totalCollection || 0),
          date: m.createdAt,
          route: `/marketing-officers?id=${m._id}`,
          priority: 820,
        })
      ),

      ...purchases.map((p) =>
        makeResult({
          id: p._id,
          type: "Purchase",
          title: `${p.supplierName || p.itemName || "Purchase"} - ${
            p.billNo || p.invoiceNo || ""
          }`,
          subtitle: `Bill: ${p.billNo || p.invoiceNo || "-"} • Due ৳ ${Number(
            p.dueAmount || 0
          ).toFixed(2)}`,
          keywords: `${p.billNo || ""} ${p.invoiceNo || ""} ${
            p.supplierName || ""
          } ${p.supplierPhone || ""} ${p.itemName || ""} ${
            p.productName || ""
          } purchase supplier stock payable`,
          amount: Number(p.total || p.netTotal || 0),
          date: p.date || p.createdAt,
          route: `/suppliers/profile?id=${p._id}`,
          priority: 750,
        })
      ),

      ...suppliers.map((s) =>
        makeResult({
          id: s._id,
          type: "Supplier",
          title: s.name || s.supplierName || "Supplier",
          subtitle: `${s.phone || ""} • Due ৳ ${Number(
            s.dueAmount || s.balance || 0
          ).toFixed(2)}`,
          keywords: `${s.name || ""} ${s.supplierName || ""} ${
            s.phone || ""
          } ${s.email || ""} ${s.address || ""} ${
            s.supplierCode || ""
          } supplier vendor ledger payable`,
          amount: Number(s.dueAmount || s.balance || 0),
          date: s.createdAt,
          route: `/suppliers/profile?id=${s._id}`,
path: `/suppliers/profile?id=${s._id}`,
          priority: 720,
        })
      ),

      ...cashTransactions.map((c) =>
        makeResult({
          id: c._id,
          type: "Cash",
          title: c.title || c.voucherNo || "Cash Transaction",
          subtitle: `${c.type || ""} • ${String(c.category || "").replaceAll(
            "_",
            " "
          )}`,
          keywords: `${c.title || ""} ${c.voucherNo || ""} ${
            c.category || ""
          } ${c.note || ""} ${c.comment || ""} ${c.refType || ""} ${
            c.refId || ""
          } ${c.head || ""} ${c.employeeName || ""} ${
            c.customerName || ""
          } ${c.customerPhone || ""} ${c.billNo || ""} ${
            c.marketingOfficerName || ""
          } cash transaction voucher`,
          amount: Number(c.amount || 0),
          date: c.date || c.createdAt,
          route: `/cash?id=${c._id}`,
          priority: 600,
        })
      ),

      ...bankAccounts.map((b) =>
        makeResult({
          id: b._id,
          type: "Bank",
          title: b.bankName || b.accountName,
          subtitle: `${b.accountName || "Account"} • ${
            b.accountNo || b.accountNumber || ""
          }`,
          keywords: `${b.bankName || ""} ${b.accountName || ""} ${
            b.accountNo || ""
          } ${b.accountNumber || ""} ${b.branchName || ""} ${
            b.routingNumber || ""
          } bank statement account`,
          amount: Number(b.currentBalance || 0),
          date: b.createdAt,
          route: `/bank?id=${b._id}`,
          priority: 550,
        })
      ),

      ...bankTransactions.map((b) =>
        makeResult({
          id: b._id,
          type: "Bank Transaction",
          title: b.title || b.transactionNo || "Bank Transaction",
          subtitle: `${b.bankId?.bankName || "Bank"} • ${String(
            b.category || ""
          ).replaceAll("_", " ")}`,
          keywords: `${b.title || ""} ${b.transactionNo || ""} ${
            b.voucherNo || ""
          } ${b.category || ""} ${b.note || ""} ${b.refType || ""} ${
            b.refId || ""
          } ${b.bankId?.bankName || ""} ${b.chequeNo || ""} ${
            b.transactionId || ""
          } ${b.personName || ""} bank transaction statement`,
          amount: Number(b.amount || 0),
          date: b.date || b.createdAt,
          route: `/bank?id=${b._id}`,
          priority: 520,
        })
      ),

      ...salaryPayments.map((s) =>
        makeResult({
          id: s._id,
          type: "Salary",
          title: `Salary ${s.employeeName || ""}`,
          subtitle: `${s.month || ""} • ${s.paymentMethod || ""}`,
          keywords: `${s.employeeName || ""} ${s.month || ""} ${
            s.paymentMethod || ""
          } ${s.note || ""} salary payroll`,
          amount: Number(s.paidAmount || 0),
          date: s.date || s.createdAt,
          route: `/salary/sheet?id=${s._id}`,
          priority: 350,
        })
      ),

      ...advances.map((a) =>
        makeResult({
          id: a._id,
          type: "Advance Salary",
          title: `Advance ${a.employeeName || ""}`,
          subtitle: `${a.paidBy || ""} • Remaining ৳ ${Number(
            a.remainingAmount || 0
          ).toFixed(2)}`,
          keywords: `${a.employeeName || ""} ${a.paidBy || ""} ${
            a.status || ""
          } ${a.note || ""} advance salary employee`,
          amount: Number(a.amount || 0),
          date: a.date || a.createdAt,
          route: a.employeeId ? `/employee?id=${a.employeeId}` : `/employee`,
          priority: 330,
        })
      ),

      ...loans.map((l) =>
        makeResult({
          id: l._id,
          type: "Loan",
          title: `${l.loanType || ""} loan - ${l.lenderName || ""}`,
          subtitle: `${l.lenderName || ""} • Due ৳ ${Number(
            l.dueAmount || 0
          ).toFixed(2)}`,
          keywords: `${l.lenderName || ""} ${l.loanType || ""} ${
            l.note || ""
          } loan account payable receivable`,
          amount: Number(l.amount || 0),
          date: l.date || l.createdAt,
          route: `/accounts?id=${l._id}`,
          priority: 300,
        })
      ),
    ];

    const sorted = results
      .map((item) => ({ ...item, score: scoreItem(item, q) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      });

    return NextResponse.json({
      success: true,
      data: sorted.slice(0, 100),
    });
  } catch (error) {
    console.error("GLOBAL_SEARCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Search failed",
        data: [],
      },
      { status: 500 }
    );
  }
}