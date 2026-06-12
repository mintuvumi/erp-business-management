import mongoose from "mongoose";

const PermissionSchema = new mongoose.Schema(
  {
    dashboard: { type: Boolean, default: true },
    sales: { type: Boolean, default: true },
    purchase: { type: Boolean, default: false },
    inventory: { type: Boolean, default: false },
    accounts: { type: Boolean, default: false },
    reports: { type: Boolean, default: false },
    customers: { type: Boolean, default: true },
    suppliers: { type: Boolean, default: false },
    employees: { type: Boolean, default: false },
    settings: { type: Boolean, default: false },

    customerLedger: { type: Boolean, default: false },
    dueCollection: { type: Boolean, default: false },
    collectionComment: { type: Boolean, default: false },

    engineeringOffers: { type: Boolean, default: false },

    offer: { type: Boolean, default: false },
    manufacturingProducts: { type: Boolean, default: false },
    rawMaterials: { type: Boolean, default: false },
    production: { type: Boolean, default: false },
    bom: { type: Boolean, default: false },
    wastage: { type: Boolean, default: false },
    factoryCost: { type: Boolean, default: false },
    finishedGoods: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    companyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        index: true,
      },
    ],

    activeCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    defaultCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    selectedCompanyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        index: true,
      },
    ],

    companyCode: {
      type: String,
      default: "",
      trim: true,
    },

    userId: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    photo: {
      type: String,
      default: "",
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
      trim: true,
    },

    profilePhotos: [
      {
        url: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    role: {
      type: String,
      enum: [
        "owner",
        "admin",
        "manager",
        "accountant",
        "cashier",
        "salesman",
        "marketing_officer",
        "staff",
        "offer_user",
        "sales_engineer",
      ],
      default: "staff",
      index: true,
    },

    permissions: {
      type: PermissionSchema,
      default: () => ({}),
    },

    branch: {
      type: String,
      default: "Main Branch",
      trim: true,
    },

    lastLoginAt: Date,

    loginCount: {
      type: Number,
      default: 0,
    },

    otp: String,
    otpExpire: Date,

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

function ownerPermissions() {
  return {
    dashboard: true,
    sales: true,
    purchase: true,
    inventory: true,
    accounts: true,
    reports: true,
    customers: true,
    suppliers: true,
    employees: true,
    settings: true,
    customerLedger: true,
    dueCollection: true,
    collectionComment: true,
    engineeringOffers: true,

    offer: true,
    manufacturingProducts: true,
    rawMaterials: true,
    production: true,
    bom: true,
    wastage: true,
    factoryCost: true,
    finishedGoods: true,
  };
}

function marketingPermissions() {
  return {
    dashboard: false,
    sales: false,
    purchase: false,
    inventory: false,
    accounts: false,
    reports: false,
    customers: true,
    suppliers: false,
    employees: false,
    settings: false,
    customerLedger: true,
    dueCollection: true,
    collectionComment: true,
    engineeringOffers: false,

    offer: false,
    manufacturingProducts: false,
    rawMaterials: false,
    production: false,
    bom: false,
    wastage: false,
    factoryCost: false,
    finishedGoods: false,
  };
}

UserSchema.pre("save", function () {
  if (!this.userId) {
    this.userId =
      "USR-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  if (!this.activeCompanyId && this.companyId) {
    this.activeCompanyId = this.companyId;
  }

  if (!this.defaultCompanyId && this.companyId) {
    this.defaultCompanyId = this.companyId;
  }

  if (this.companyId) {
    const mainCompanyId = String(this.companyId);

    const companyIds = (this.companyIds || []).map((id) => String(id));
    if (!companyIds.includes(mainCompanyId)) {
      this.companyIds = [...(this.companyIds || []), this.companyId];
    }

    const selectedIds = (this.selectedCompanyIds || []).map((id) => String(id));
    if (!selectedIds.includes(mainCompanyId)) {
      this.selectedCompanyIds = [
        ...(this.selectedCompanyIds || []),
        this.companyId,
      ];
    }
  }

  if (!this.photo && this.avatar) {
    this.photo = this.avatar;
  }

  if (!this.avatar && this.photo) {
    this.avatar = this.photo;
  }

  if (this.role === "owner" || this.role === "admin") {
    this.permissions = ownerPermissions();
  }

  if (this.role === "marketing_officer") {
    this.permissions = marketingPermissions();
  }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;