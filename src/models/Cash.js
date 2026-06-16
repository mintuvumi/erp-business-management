import mongoose from "mongoose";

const CashSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
      index: true,
    },

    openingBalance: {
      type: Number,
      default: 0,
    },

    currentBalance: {
      type: Number,
      default: 0,
    },

    balance: {
      type: Number,
      default: 0,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

CashSchema.pre("save", function () {
  this.openingBalance = Number(this.openingBalance || 0);

  this.currentBalance = Number(
    this.currentBalance ?? this.balance ?? this.openingBalance ?? 0
  );

  this.balance = Number(
    this.balance ?? this.currentBalance ?? this.openingBalance ?? 0
  );
});

const Cash = mongoose.models.Cash || mongoose.model("Cash", CashSchema);

export default Cash;