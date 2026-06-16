export async function PATCH(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const sub = await requireActiveSubscription(tenant);

    if (!sub.ok) {
      return NextResponse.json(
        {
          success: false,
          subscriptionExpired: true,
          message: sub.message,
        },
        { status: sub.status }
      );
    }

    try {
      await requirePermission(tenant, "purchase");
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Access denied",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, message: "Purchase id is required" },
        { status: 400 }
      );
    }

    const purchase = await Purchase.findOne({
      _id: body._id,
      companyId: tenant.companyId,
    });

    if (!purchase) {
      return NextResponse.json(
        { success: false, message: "Purchase not found" },
        { status: 404 }
      );
    }

    if (body.cancel === true) {
      if (purchase.status !== "cancelled") {
        await restoreStockFromPurchase({
          purchase,
          user: tenant.user,
        });

        const cashTransactions = await CashTransaction.find({
          companyId: tenant.companyId,
          purchaseId: purchase._id,
          status: { $ne: "cancelled" },
        });

        let cash = await Cash.findOne({ companyId: tenant.companyId });

        if (cash) {
          for (const tx of cashTransactions) {
            if (tx.type === "out") {
              cash.currentBalance =
                Number(cash.currentBalance || cash.balance || 0) +
                Number(tx.amount || 0);
              cash.balance = cash.currentBalance;
            }

            if (tx.type === "in") {
              cash.currentBalance = Math.max(
                Number(cash.currentBalance || cash.balance || 0) -
                  Number(tx.amount || 0),
                0
              );
              cash.balance = cash.currentBalance;
            }

            tx.status = "cancelled";
            tx.cancelledAt = new Date();
            tx.cancelledByUserId = tenant.user?.id || null;
            tx.updatedByUserId = tenant.user?.id || null;
            tx.updatedBy = tenant.user?.name || "";
            tx.comment = `${tx.comment || ""} Purchase cancelled/reversed`.trim();

            await tx.save();
          }

          await cash.save();
        }

        const bankTransactions = await BankTransaction.find({
          companyId: tenant.companyId,
          purchaseId: purchase._id,
          status: { $ne: "cancelled" },
        });

        for (const tx of bankTransactions) {
          const bank = await BankAccount.findOne({
            _id: tx.bankId,
            companyId: tenant.companyId,
          });

          if (bank) {
            if (tx.type === "out") {
              bank.currentBalance =
                Number(bank.currentBalance || bank.balance || 0) +
                Number(tx.amount || 0);
              bank.balance = bank.currentBalance;
            }

            if (tx.type === "in") {
              bank.currentBalance = Math.max(
                Number(bank.currentBalance || bank.balance || 0) -
                  Number(tx.amount || 0),
                0
              );
              bank.balance = bank.currentBalance;
            }

            await bank.save();
          }

          tx.status = "cancelled";
          tx.cancelledAt = new Date();
          tx.cancelledByUserId = tenant.user?.id || null;
          tx.updatedByUserId = tenant.user?.id || null;
          tx.updatedBy = tenant.user?.name || "";
          tx.comment = `${tx.comment || ""} Purchase cancelled/reversed`.trim();

          await tx.save();
        }

        purchase.status = "cancelled";
        purchase.updatedByUserId = tenant.user?.id || null;
        purchase.updatedBy = tenant.user?.name || "";
        purchase.cancelledAt = new Date();
        purchase.cancelledByUserId = tenant.user?.id || null;
        purchase.cancelReason =
          body.reason || "Purchase cancelled from supplier ledger";

        await purchase.save();
      }

      return NextResponse.json({
        success: true,
        message: "Purchase cancelled successfully",
      });
    }

    if (body.supplierBillNo !== undefined) {
      purchase.supplierBillNo = body.supplierBillNo;
    }

    if (body.supplierInvoiceNo !== undefined) {
      purchase.supplierInvoiceNo = body.supplierInvoiceNo;
    }

    if (body.supplierName !== undefined) {
      purchase.supplierName = body.supplierName;
    }

    if (body.supplierPhone !== undefined) {
      purchase.supplierPhone = body.supplierPhone;
    }

    if (body.supplierAddress !== undefined) {
      purchase.supplierAddress = body.supplierAddress;
    }

    if (body.note !== undefined) {
      purchase.note = body.note;
    }

    if (body.date !== undefined) {
      purchase.date = body.date;
    }

    purchase.updatedByUserId = tenant.user?.id || null;
    purchase.updatedBy = tenant.user?.name || "";

    await purchase.save();

    return NextResponse.json({
      success: true,
      message: "Purchase updated successfully",
      data: purchase,
    });
  } catch (error) {
    console.error("PURCHASE_PATCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Purchase update failed",
      },
      { status: 500 }
    );
  }
}