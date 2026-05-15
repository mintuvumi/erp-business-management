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
    <footer className="print:hidden mt-32 md:mt-44 relative overflow-hidden border-t border-gray-700 bg-gray-900 text-white">
      
      {/* BACKGROUND EFFECT */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_35%)]" />

      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />

      <div className="relative px-4 md:px-8 py-10 md:py-12">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          
          {/* BRAND */}
          <div>
            <div className="flex items-center gap-3">
              
              <div className="relative w-12 h-12 rounded-2xl bg-gray-700 border border-gray-600 flex items-center justify-center shadow-lg">
                <Building2 size={23} className="text-white" />

                <span className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-green-400 shadow-lg" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold tracking-wide">
                  SeeERP
                </h2>

                <p className="text-xs text-gray-300 mt-0.5">
                  Business Management System
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-300 mt-5 leading-relaxed max-w-sm">
              A smart and professional ERP solution for sales, purchase, stock,
              accounts, employees, reports and complete business management.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-gray-600 bg-gray-800 px-4 py-2 text-xs text-gray-200">
              <Sparkles size={14} className="text-yellow-400" />
              Smart business control in one place
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Headphones size={18} className="text-gray-200" />

              <h3 className="text-sm font-bold text-gray-100">
                Contact & Support
              </h3>
            </div>

            <div className="space-y-3">

              {/* WHATSAPP */}
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-200 hover:bg-green-600/20 hover:border-green-500 transition-all"
              >
                <span className="flex items-center gap-3">

                  <span className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <MessageCircle size={18} />
                  </span>

                  <span>
                    <span className="block text-xs text-gray-400">
                      WhatsApp
                    </span>

                    <span className="font-medium">
                      {displayPhone}
                    </span>
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  className="opacity-70 group-hover:opacity-100"
                />
              </a>

              {/* EMAIL */}
              <a
                href={`mailto:${email}?subject=SeeERP Support&body=Hello SeeERP Team,%0D%0A%0D%0AI need help with...`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-200 hover:bg-blue-600/20 hover:border-blue-500 transition-all"
              >
                <span className="flex items-center gap-3">

                  <span className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Mail size={18} />
                  </span>

                  <span>
                    <span className="block text-xs text-gray-400">
                      Email
                    </span>

                    <span className="font-medium break-all">
                      {email}
                    </span>
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  className="opacity-70 group-hover:opacity-100"
                />
              </a>

              {/* PHONE */}
              <a
                href={`tel:${displayPhone}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-200 hover:bg-purple-600/20 hover:border-purple-500 transition-all"
              >
                <span className="flex items-center gap-3">

                  <span className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Phone size={18} />
                  </span>

                  <span>
                    <span className="block text-xs text-gray-400">
                      Call
                    </span>

                    <span className="font-medium">
                      {displayPhone}
                    </span>
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  className="opacity-70 group-hover:opacity-100"
                />
              </a>
            </div>
          </div>

          {/* INFO */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe2 size={18} className="text-gray-200" />

              <h3 className="text-sm font-bold text-gray-100">
                System Info
              </h3>
            </div>

            <div className="space-y-3">

              <div className="rounded-2xl border border-gray-700 bg-gray-800 px-4 py-3 flex items-center gap-3">
                
                <span className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-cyan-300" />
                </span>

                <div>
                  <p className="text-sm font-medium text-white">
                    Secure Business Management
                  </p>

                  <p className="text-xs text-gray-400 mt-0.5">
                    Reliable ERP workflow
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-700 bg-gray-800 px-4 py-3 flex items-center gap-3">
                
                <span className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <HeartHandshake size={18} className="text-yellow-300" />
                </span>

                <div>
                  <p className="text-sm font-medium text-white">
                    Version 1.0.0
                  </p>

                  <p className="text-xs text-gray-400 mt-0.5">
                    Professional ERP system
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-700 bg-gray-800 px-4 py-3">
                <p className="text-xs text-gray-300 leading-relaxed">
                  Need help? Contact through WhatsApp or Email. Your message
                  will go directly to the support contact.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-9 pt-5 border-t border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-gray-400">
          
          <p>
            © {year}{" "}
            <span className="font-semibold text-white">
              SeeERP
            </span>. All rights reserved.
          </p>

          <p className="text-gray-500">
            Smart ERP Solution • Powered by{" "}
            <span className="text-gray-300">
              Let's Go See Technology
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}