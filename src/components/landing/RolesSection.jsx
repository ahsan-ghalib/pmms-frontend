const roles = [
  { ar: "مدير المنصة", en: "Super admin", arBody: "يدير الشركات والإعدادات العامة.", enBody: "Owns companies and platform settings." },
  { ar: "مدير الشركة", en: "Company admin", arBody: "يدير العقارات والمستخدمين والسياسات.", enBody: "Manages properties, users, and policies." },
  { ar: "مدير العقار", en: "Property manager", arBody: "يشرف على المواقع والشكاوى والتحقق.", enBody: "Oversees sites, complaints, and verification." },
  { ar: "مشرف", en: "Supervisor", arBody: "يعيّن أوامر العمل ويتابع التنفيذ.", enBody: "Assigns work orders and tracks progress." },
  { ar: "فني", en: "Technician", arBody: "ينفّذ المهام ويوثّق الإغلاق.", enBody: "Executes jobs and records completion." },
  { ar: "مستأجر / مورّد", en: "Tenant / vendor", arBody: "يبلّغ عن الأعطال أو يشارك في التنفيذ.", enBody: "Reports issues or joins assigned work." },
];

export default function RolesSection() {
  return (
    <section id="roles" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 fade-up">
          <p className="text-sm font-semibold text-violet-400 mb-3">
            <span className="ar">الأدوار</span>
            <span className="en">Roles</span>
          </p>
          <h2 className="text-3xl sm:text-4xl font-black t-heading mb-4">
            <span className="ar">صلاحيات واضحة لكل فريق</span>
            <span className="en">The right access for every team</span>
          </h2>
          <p className="t-muted">
            <span className="ar">كل مستخدم يرى فقط ما يخص شركته وعقاراته ودوره.</span>
            <span className="en">Each user sees only their company, properties, and role.</span>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.en} className="glass-card p-6 fade-up">
              <h3 className="text-lg font-bold t-heading mb-2">
                <span className="ar">{role.ar}</span>
                <span className="en">{role.en}</span>
              </h3>
              <p className="t-muted text-sm">
                <span className="ar">{role.arBody}</span>
                <span className="en">{role.enBody}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
