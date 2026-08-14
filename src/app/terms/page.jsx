"use client";

import "@/app/landing-theme.css";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

export default function TermsandConditionsPage() {
  return (
    <div className="landing-page-wrapper">
      <LandingNavbar />
      <main className="pt-32 pb-24 min-h-screen px-6">
        <div className="max-w-3xl mx-auto glass-card p-8 md:p-12">
          <h1 className="text-3xl font-bold mb-6 t-heading">
            <span className="ar">الشروط والأحكام</span>
            <span className="en">Terms of use</span>
          </h1>
          <div className="space-y-4 t-muted leading-relaxed">
            <p>
              <span className="ar">
                باستخدامك PMMS فإنك توافق على استخدام المنصة لإدارة صيانة العقارات والمنشآت فقط، والالتزام بصلاحيات دورك ونطاق شركتك.
              </span>
              <span className="en">
                By using PMMS you agree to use the platform for property and facility maintenance, and to stay within your role and company scope.
              </span>
            </p>
            <p>
              <span className="ar">
                الحسابات تُمنح من مدير الشركة أو مدير المنصة. أنت مسؤول عن حماية بيانات الدخول وعدم مشاركة معلومات المستأجرين أو أوامر العمل خارج العمل.
              </span>
              <span className="en">
                Accounts are issued by a company or platform admin. You are responsible for protecting sign-in details and not sharing tenant or work-order information outside your work.
              </span>
            </p>
            <p>
              <span className="ar">للاستفسارات: hello@pmms.app</span>
              <span className="en">Questions: hello@pmms.app</span>
            </p>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
