const stats = [
  { value: "1", ar: "مسار عمل", en: "operations flow" },
  { value: "7", ar: "أدوار تشغيلية", en: "operational roles" },
  { value: "AR/EN", ar: "واجهة ثنائية اللغة", en: "bilingual interface" },
  { value: "24/7", ar: "تتبع الشكاوى", en: "complaint tracking" },
];

export default function StatsSection() {
  return (
    <section className="px-6 py-10">
      <div className="max-w-7xl mx-auto glass-card stats-bar px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.en} className="text-center fade-up">
            <p className="text-3xl font-black mb-1">{stat.value}</p>
            <p className="text-sm opacity-80">
              <span className="ar">{stat.ar}</span>
              <span className="en">{stat.en}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
