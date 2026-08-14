"use client";

import "@/app/landing-theme.css";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

export default function PrivacyPolicyPage() {
  return (
    <div className="landing-page-wrapper">
      <LandingNavbar />
      <main className="pt-32 pb-24 min-h-screen px-6">
        <div className="max-w-3xl mx-auto glass-card p-8 md:p-12">
          <h1 className="text-3xl font-bold mb-6 t-heading">
            <span className="ar">سياسة الخصوصية</span>
            <span className="en">Privacy policy</span>
          </h1>
          <div className="space-y-4 t-muted leading-relaxed">
            <p>
              <span className="ar">
                يجمع PMMS بيانات الحساب والعقار وأوامر العمل اللازمة لتشغيل منصة الصيانة. لا نبيع البيانات الشخصية.
              </span>
              <span className="en">
                PMMS collects account, property, and work-order data needed to run the maintenance platform. We do not sell personal data.
              </span>
            </p>
            <p>
              <span className="ar">
                تُحفظ البيانات داخل نطاق الشركة والعقار المرتبط بحسابك، وتُستخدم لتسجيل الشكاوى والتعيين والتنفيذ والتدقيق.
              </span>
              <span className="en">
                Data stays within the company and property scope of your account, and is used to record complaints, assignments, completion, and audit history.
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
