import Link from "next/link";
import BrandMark from "./BrandMark";

export default function LandingFooter() {
  return (
    <footer className="theme-footer pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <BrandMark className="h-10 w-10" />
              <span className="text-xl font-bold t-heading">PMMS</span>
            </div>
            <p className="t-muted text-sm leading-relaxed">
              <span className="ar">
                منصة إدارة صيانة العقارات والمنشآت للشركات والمشرفين والفنيين والمستأجرين في قطر ودول الخليج.
              </span>
              <span className="en">
                Property and facility maintenance for companies, supervisors, technicians, and tenants across Qatar and the GCC.
              </span>
            </p>
          </div>

          <div>
            <h4 className="t-heading font-bold mb-6">
              <span className="ar">المنتج</span>
              <span className="en">Product</span>
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="/#features" className="t-muted hover:text-brand-orange transition-colors">
                  <span className="ar">المميزات</span>
                  <span className="en">Features</span>
                </Link>
              </li>
              <li>
                <Link href="/#how" className="t-muted hover:text-brand-orange transition-colors">
                  <span className="ar">كيف يعمل</span>
                  <span className="en">How it works</span>
                </Link>
              </li>
              <li>
                <Link href="/#roles" className="t-muted hover:text-brand-orange transition-colors">
                  <span className="ar">الأدوار</span>
                  <span className="en">Roles</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="t-muted hover:text-brand-orange transition-colors">
                  <span className="ar">تسجيل الدخول</span>
                  <span className="en">Sign in</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="t-heading font-bold mb-6">
              <span className="ar">قانوني</span>
              <span className="en">Legal</span>
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy" className="t-muted hover:text-brand-orange transition-colors">
                  <span className="ar">سياسة الخصوصية</span>
                  <span className="en">Privacy policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="t-muted hover:text-brand-orange transition-colors">
                  <span className="ar">الشروط والأحكام</span>
                  <span className="en">Terms</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="t-heading font-bold mb-6">
              <span className="ar">تواصل</span>
              <span className="en">Contact</span>
            </h4>
            <ul className="space-y-4 t-muted text-sm">
              <li className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" className="mt-0.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>hello@pmms.app</span>
              </li>
              <li className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" className="mt-0.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>
                  <span className="ar">الدوحة، قطر</span>
                  <span className="en">Doha, Qatar</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="t-faint text-sm">
            <span className="ar">© {new Date().getFullYear()} PMMS. جميع الحقوق محفوظة.</span>
            <span className="en">© {new Date().getFullYear()} PMMS. All rights reserved.</span>
          </p>
          <p className="t-faint text-sm">
            <span className="ar">صُمم لعمليات الصيانة في قطر والخليج</span>
            <span className="en">Built for Qatar &amp; GCC facility operations</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
