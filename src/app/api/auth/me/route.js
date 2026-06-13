import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";

function companyDTO(c) {
  return {
    id: String(c._id),
    _id: String(c._id),

    name: c.name,
    businessType: c.businessType,
    logo: c.logo,

    address: c.address || "",
    phone: c.phone || "",
    email: c.email || "",

    currency: c.currency || "BDT",
    timezone: c.timezone || "Asia/Dhaka",
    setupCompleted: c.setupCompleted,
    companyCode: c.companyCode || "",

    subscriptionPlan: c.subscriptionPlan || "free",
    subscriptionStatus: c.subscriptionStatus || "trial",
    paymentStatus: c.paymentStatus || "unpaid",
    serviceLocked: Boolean(c.serviceLocked),
    graceActive: Boolean(c.graceActive),
    graceUntil: c.graceUntil || "",
    promisePaymentDate: c.promisePaymentDate || "",
  };
}

function activePhotoList(user) {
  const list = [];

  if (user.photo) list.push(user.photo);
  if (user.avatar && user.avatar !== user.photo) list.push(user.avatar);

  (user.profilePhotos || []).forEach((p) => {
    if (p?.isActive !== false && p?.url && !list.includes(p.url)) {
      list.push(p.url);
    }
  });

  return list;
}

export async function GET(req) {
  try {
    await connectDB();

    const token = req.cookies.get("erp_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, data: null, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, data: null, message: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, data: null, message: "User inactive" },
        { status: 401 }
      );
    }

    const allowedIds = [
      user.companyId,
      user.activeCompanyId,
      user.defaultCompanyId,
      ...(user.companyIds || []),
    ]
      .filter(Boolean)
      .map((id) => String(id));

    const selectedIds = (user.selectedCompanyIds || [])
      .filter(Boolean)
      .map((id) => String(id));

    const finalCompanyIds = selectedIds.length > 0 ? selectedIds : allowedIds;
    const uniqueCompanyIds = [...new Set(finalCompanyIds)];

    const companies = await Company.find({
      _id: { $in: uniqueCompanyIds },
      isActive: true,
    }).sort({ createdAt: 1 });

    const activeCompany =
      companies.find((c) => String(c._id) === String(user.activeCompanyId)) ||
      companies.find((c) => String(c._id) === String(user.defaultCompanyId)) ||
      companies.find((c) => String(c._id) === String(user.companyId)) ||
      companies[0] ||
      null;

    const photoList = activePhotoList(user);

    return NextResponse.json({
      success: true,
      data: {
        id: String(user._id),
        _id: String(user._id),
        userId: user.userId,

        name: user.name,
        email: user.email,
        phone: user.phone,

        photo: photoList[0] || "",
        avatar: photoList[0] || "",
        profilePhotos: photoList,

        role: user.role,
        isSaasAdmin: Boolean(user.isSaasAdmin),
        permissions: user.permissions,
        branch: user.branch,

        companyId: activeCompany ? String(activeCompany._id) : "",
        activeCompanyId: activeCompany ? String(activeCompany._id) : "",
        defaultCompanyId: user.defaultCompanyId
          ? String(user.defaultCompanyId)
          : activeCompany
          ? String(activeCompany._id)
          : "",

        companyIds: companies.map((c) => String(c._id)),
        selectedCompanyIds: companies.map((c) => String(c._id)),

        companyCode: activeCompany?.companyCode || user.companyCode || "",

        company: activeCompany ? companyDTO(activeCompany) : null,
        companies: companies.map(companyDTO),
      },
    });
  } catch (error) {
    console.error("AUTH_ME_ERROR:", error);

    return NextResponse.json(
      { success: false, data: null, message: error.message },
      { status: 500 }
    );
  }
}