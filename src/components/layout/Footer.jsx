"use client";

import {
  Mail,
  MessageCircle,
  Phone,
  Building2,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Headphones,
  Globe2,
  ArrowUpRight,
} from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  const whatsappNumber = "8801731166304";
  const displayPhone = "01731166304";
  const email = "mdmintuvumi@gmail.com";

  return (
    <footer className="print:hidden mt-32 md:mt-44 relative overflow-hidden border-t border-blue-100 bg-slate-950 text-white">
      {/* BACKGROUND DESIGN */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.22),transparent_35%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-blue-950/95 to-slate-950" />

      <div className="relative px-4 md:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {/* BRAND */}
          <div>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-300/20 flex items-center justify-center shadow-[0_12px_35px_rgba(59,130,246,0.25)]">
                <Building2 size={23} className="text-blue-300" />
                <span className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold tracking-wide">
                  NextCore ERP
                </h2>
                <p className="text-xs text-blue-200 mt-0.5">
                  Business Management System
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mt-5 leading-relaxed max-w-sm">
              A smart and professional ERP solution for sales, purchase, stock,
              accounts, employees, reports and business growth.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-blue-100">
              <Sparkles size={14} className="text-cyan-300" />
              Smart business control in one place
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Headphones size={18} className="text-blue-300" />
              <h3 className="text-sm font-bold text-blue-100">
                Contact & Support
              </h3>
            </div>

            <div className="space-y-3">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-green-500/10 hover:border-green-400/30 hover:text-green-200 transition-all"
              >
                <span className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-green-500/15 border border-green-400/20 flex items-center justify-center group-hover:bg-green-500/25">
                    <MessageCircle size={18} />
                  </span>
                  <span>
                    <span className="block text-xs text-slate-400">
                      WhatsApp
                    </span>
                    <span className="font-medium">{displayPhone}</span>
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  className="opacity-60 group-hover:opacity-100"
                />
              </a>

              <a
                href={`mailto:${email}?subject=NextCore ERP Support&body=Hello NextCore ERP Team,%0D%0A%0D%0AI need help with...`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-blue-500/10 hover:border-blue-400/30 hover:text-blue-200 transition-all"
              >
                <span className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-blue-500/15 border border-blue-400/20 flex items-center justify-center group-hover:bg-blue-500/25">
                    <Mail size={18} />
                  </span>
                  <span>
                    <span className="block text-xs text-slate-400">Email</span>
                    <span className="font-medium break-all">{email}</span>
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  className="opacity-60 group-hover:opacity-100"
                />
              </a>

              <a
                href={`tel:${displayPhone}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-purple-500/10 hover:border-purple-400/30 hover:text-purple-200 transition-all"
              >
                <span className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-purple-500/15 border border-purple-400/20 flex items-center justify-center group-hover:bg-purple-500/25">
                    <Phone size={18} />
                  </span>
                  <span>
                    <span className="block text-xs text-slate-400">Call</span>
                    <span className="font-medium">{displayPhone}</span>
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  className="opacity-60 group-hover:opacity-100"
                />
              </a>
            </div>
          </div>

          {/* INFO */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe2 size={18} className="text-blue-300" />
              <h3 className="text-sm font-bold text-blue-100">System Info</h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-400/20 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-cyan-300" />
                </span>

                <div>
                  <p className="text-sm font-medium text-slate-100">
                    Secure Business Management
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reliable ERP workflow
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-400/20 flex items-center justify-center">
                  <HeartHandshake size={18} className="text-amber-300" />
                </span>

                <div>
                  <p className="text-sm font-medium text-slate-100">
                    Version 1.0.0
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Professional ERP system
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-300/20 bg-blue-500/10 px-4 py-3">
                <p className="text-xs text-blue-100 leading-relaxed">
                  Need help? Contact through WhatsApp or Email. Your message
                  will go directly to the support contact.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-9 pt-5 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-slate-400">
          <p>
            © {year}{" "}
            <span className="font-semibold text-white">NextCore ERP</span>. All
            rights reserved.
          </p>

          <p className="text-slate-500">
            Business Management System • Powered by{" "}
            <span className="text-blue-200">NextCore Technology</span>
          </p>
        </div>
      </div>
    </footer>
  );
}