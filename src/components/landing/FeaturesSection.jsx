const features = [
  {
    ar: "الشكاوى",
    en: "Complaints",
    arBody: "تصنيف الخدمات، المواعيد، الحالات العاجلة، واكتشاف التكرار مع سجل كامل.",
    enBody: "Service taxonomy, booking slots, urgent flags, duplicate detection, and a complete history.",
  },
  {
    ar: "أوامر العمل",
    en: "Work orders",
    arBody: "تعيين، قبول، تعليق، إعادة جدولة، إكمال، تحقق، وإغلاق مع رقم فريد لكل أمر.",
    enBody: "Assign, accept, hold, reschedule, complete, verify, and close — each with a unique WO number.",
  },
  {
    ar: "الصيانة الوقائية",
    en: "Preventive maintenance",
    arBody: "جداول شهرية وربع سنوية وسنوية تُنشئ أوامر العمل تلقائياً في موعدها.",
    enBody: "Monthly, quarterly, and yearly schedules that generate work orders on the due date.",
  },
  {
    ar: "هيكل العقار",
    en: "Property hierarchy",
    arBody: "شركة ← عقار ← موقع ← موقع فرعي ← وحدة. كل بلاغ مربوط بمكانه.",
    enBody: "Company → property → location → sub-location → unit. Every ticket is tied to a place.",
  },
  {
    ar: "اتفاقية الخدمة",
    en: "SLA & audit",
    arBody: "تتبع الوقت، الإيقاف عند التعليق، وسجل إجراءات قابل للتصدير.",
    enBody: "Time tracking, pause-on-hold, and an exportable action history for every work order.",
  },
  {
    ar: "صور وموقع",
    en: "Photos & GPS",
    arBody: "إثبات التنفيذ بالصور وقطع الغيار وإحداثيات الموقع حسب إعدادات الشركة.",
    enBody: "Completion proof with photos, parts used, and GPS — gated by company settings.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="theme-section-glow-alt py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 fade-up">
          <p className="text-sm font-semibold text-violet-400 mb-3">
            <span className="ar">المميزات</span>
            <span className="en">Features</span>
          </p>
          <h2 className="text-3xl sm:text-4xl font-black t-heading mb-4">
            <span className="ar">كل ما تحتاجه فرق الصيانة في مكان واحد</span>
            <span className="en">Everything a maintenance team needs in one place</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.en} className="glass-card glow-card p-7 fade-up">
              <div className="icon-bg w-12 h-12 rounded-2xl mb-5 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              </div>
              <h3 className="text-xl font-bold t-heading mb-3">
                <span className="ar">{feature.ar}</span>
                <span className="en">{feature.en}</span>
              </h3>
              <p className="t-muted text-sm leading-relaxed">
                <span className="ar">{feature.arBody}</span>
                <span className="en">{feature.enBody}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
