const steps = [
  {
    n: "01",
    ar: "المستأجر يبلّغ",
    en: "Tenant reports",
    arBody: "يُنشئ المستأجر شكوى مع الموقع والصور والموعد المناسب. الحالات العاجلة تُرفع فوراً.",
    enBody: "A tenant files a complaint with location, photos, and a preferred slot. Urgent cases escalate immediately.",
  },
  {
    n: "02",
    ar: "المشرف يعيّن",
    en: "Supervisor assigns",
    arBody: "يراجع المشرف التكرار والأولوية ويعيّن فنياً أساسياً مع زملاء عند الحاجة.",
    enBody: "A supervisor reviews duplicates and priority, then assigns a primary technician and optional co-workers.",
  },
  {
    n: "03",
    ar: "الفني ينفّذ",
    en: "Technician completes",
    arBody: "يقبل الفني أمر العمل، يوثّق الصور وقطع الغيار والموقع، ثم يغلق المهمة.",
    enBody: "The technician accepts the work order, records photos, parts, and GPS, then marks the job complete.",
  },
  {
    n: "04",
    ar: "المدير يتحقق",
    en: "Manager verifies",
    arBody: "يُراجع العمل ويُغلق الأمر أو يُعاد للتنفيذ. يمكن للمستأجر تقييم الخدمة بعد الإغلاق.",
    enBody: "A manager verifies the work, closes or sends it back for rework, and the tenant can rate the visit.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how" className="theme-section-glow py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 fade-up">
          <p className="text-sm font-semibold text-violet-400 mb-3">
            <span className="ar">كيف يعمل</span>
            <span className="en">How it works</span>
          </p>
          <h2 className="text-3xl sm:text-4xl font-black t-heading mb-4">
            <span className="ar">دورة صيانة واضحة من البلاغ حتى الإغلاق</span>
            <span className="en">A clear maintenance cycle from report to close</span>
          </h2>
          <p className="t-muted">
            <span className="ar">كل خطوة مسجّلة، مع صلاحيات حسب الدور ونطاق العقار.</span>
            <span className="en">Every step is recorded, with role-based access and property scope.</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.n} className="glass-card p-6 fade-up">
              <p className="text-sm font-bold text-violet-400 mb-4">{step.n}</p>
              <h3 className="text-xl font-bold t-heading mb-3">
                <span className="ar">{step.ar}</span>
                <span className="en">{step.en}</span>
              </h3>
              <p className="t-muted text-sm leading-relaxed">
                <span className="ar">{step.arBody}</span>
                <span className="en">{step.enBody}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
