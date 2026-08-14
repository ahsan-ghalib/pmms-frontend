import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="hero-bg hero-glow min-h-screen flex items-center pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border border-purple-400/30 bg-purple-500/10">
              <span className="w-2 h-2 rounded-full bg-violet-500 pulse-dot" />
              <span className="text-sm font-semibold text-violet-300">
                <span className="ar">منصة صيانة العقارات في قطر والخليج</span>
                <span className="en">Property maintenance for Qatar &amp; the GCC</span>
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 t-heading">
              <span className="ar">
                من الشكوى إلى الإغلاق
                <br />
                <span className="gradient-text">في مسار عمل واحد</span>
              </span>
              <span className="en">
                From complaint to close
                <br />
                <span className="gradient-text">in one operations flow</span>
              </span>
            </h1>

            <p className="t-muted text-lg leading-relaxed mb-10 max-w-xl">
              <span className="ar">
                PMMS منصة ثنائية اللغة لإدارة صيانة العقارات والمنشآت. يستقبل المستأجر الشكوى، يعيّن المشرف أمر العمل، وينفّذ الفني المهمة مع صور وتتبع واتفاقية مستوى الخدمة.
              </span>
              <span className="en">
                PMMS is a bilingual platform for property and facility maintenance. Tenants raise complaints, supervisors assign work orders, and technicians complete jobs with photos, SLA, and a full audit trail.
              </span>
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/login" className="btn-primary text-white font-bold px-8 py-4 rounded-2xl text-lg">
                <span className="ar">دخول المنصة</span>
                <span className="en">Enter workspace</span>
              </Link>
              <Link
                href="#how"
                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 t-heading font-bold px-8 py-4 rounded-2xl text-lg transition hover:bg-gray-50 dark:hover:bg-white/10"
              >
                <span className="ar">شاهد كيف يعمل</span>
                <span className="en">See how it works</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm t-faint">
              <span>
                <span className="ar">عربي / English</span>
                <span className="en">Arabic / English</span>
              </span>
              <span className="w-px h-4 bg-white/10" />
              <span>
                <span className="ar">شركات متعددة المستأجرين</span>
                <span className="en">Multi-tenant companies</span>
              </span>
              <span className="w-px h-4 bg-white/10" />
              <span>
                <span className="ar">أوامر عمل وصيانة وقائية</span>
                <span className="en">Work orders &amp; preventive plans</span>
              </span>
            </div>
          </div>

          <div className="fade-up relative">
            <div className="glass-card p-5 sm:p-6 always-dark">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-violet-300/80 mb-1">WO-20260815-0042</p>
                  <p className="text-white font-semibold">
                    <span className="ar">تسريب مياه — الوحدة 12B</span>
                    <span className="en">Water leak — Unit 12B</span>
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <span className="ar">قيد التنفيذ</span>
                  <span className="en">In progress</span>
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { ar: "شكوى", en: "Complaint", done: true },
                  { ar: "تعيين", en: "Assign", done: true },
                  { ar: "تنفيذ", en: "Work", done: true },
                  { ar: "تحقق", en: "Verify", done: false },
                ].map((step) => (
                  <div key={step.en} className="text-center">
                    <div className={`h-1.5 rounded-full mb-2 ${step.done ? "bg-violet-500" : "bg-white/10"}`} />
                    <p className="text-[11px] text-white/60">
                      <span className="ar">{step.ar}</span>
                      <span className="en">{step.en}</span>
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                  <span className="text-white/60">
                    <span className="ar">العقار</span>
                    <span className="en">Property</span>
                  </span>
                  <span className="text-white">
                    <span className="ar">أبراج اللوسيل</span>
                    <span className="en">Lusail Towers</span>
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                  <span className="text-white/60">
                    <span className="ar">الفني</span>
                    <span className="en">Technician</span>
                  </span>
                  <span className="text-white">
                    <span className="ar">أحمد المنصوري</span>
                    <span className="en">Ahmed Al-Mansouri</span>
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                  <span className="text-white/60">SLA</span>
                  <span className="text-emerald-300">
                    <span className="ar">٢ ساعة متبقية</span>
                    <span className="en">2h remaining</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -start-4 glass-card px-4 py-3 float-badge hidden sm:block">
              <p className="text-xs t-muted mb-0.5">
                <span className="ar">شكوى عاجلة</span>
                <span className="en">Urgent complaint</span>
              </p>
              <p className="text-sm font-semibold t-heading">
                <span className="ar">تم الإبلاغ من المستأجر</span>
                <span className="en">Raised by tenant</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
