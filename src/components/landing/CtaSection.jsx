import Link from "next/link";

export default function CtaSection() {
  return (
    <section id="cta" className="px-6 pb-24">
      <div className="max-w-5xl mx-auto glass-card px-8 py-14 text-center fade-up">
        <h2 className="text-3xl sm:text-4xl font-black t-heading mb-4">
          <span className="ar">جاهز لتنظيم عمليات الصيانة؟</span>
          <span className="en">Ready to run maintenance with one workspace?</span>
        </h2>
        <p className="t-muted max-w-2xl mx-auto mb-8">
          <span className="ar">
            سجّل الدخول لإدارة الشركات والعقارات والشكاوى وأوامر العمل من لوحة تحكم واحدة.
          </span>
          <span className="en">
            Sign in to manage companies, properties, complaints, and work orders from a single dashboard.
          </span>
        </p>
        <Link href="/login" className="btn-primary inline-flex text-white font-bold px-8 py-4 rounded-2xl text-lg">
          <span className="ar">تسجيل الدخول</span>
          <span className="en">Sign in to PMMS</span>
        </Link>
      </div>
    </section>
  );
}
