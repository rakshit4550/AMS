import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaArrowRight,
  FaChartLine,
  FaFilePdf,
  FaLock,
  FaUsers,
  FaReceipt,
  FaClipboardList,
} from "react-icons/fa";
import AnimatedCanvasBg from "../components/AnimatedCanvasBg";
import LoginModal from "../components/LoginModal";
import { loadUser } from "../redux/authSlice";
import slideDashboard from "../assets/landing/slide-dashboard.png";
import slideParties from "../assets/landing/slide-parties.png";
import slideAccount from "../assets/landing/slide-account.png";
import slideReport from "../assets/landing/slide-report.png";

const SLIDES = [
  {
    id: "dashboard",
    title: "Dashboard",
    caption: "Date range, top debit & credit parties at a glance.",
    image: slideDashboard,
  },
  {
    id: "parties",
    title: "Parties",
    caption: "Add parties, search, and manage the full party list.",
    image: slideParties,
  },
  {
    id: "account",
    title: "Account ledger",
    caption: "Post deposits, transfers, and track running balances.",
    image: slideAccount,
  },
  {
    id: "report",
    title: "Reports & statements",
    caption: "Filter by party and export PDF statements anytime.",
    image: slideReport,
  },
];

const FEATURES = [
  {
    icon: FaUsers,
    title: "Party ledger",
    text: "Manage parties with clear opening, credit, debit, and closing balances.",
  },
  {
    icon: FaClipboardList,
    title: "Account entries",
    text: "Record day-to-day transactions with filters and fast search.",
  },
  {
    icon: FaFilePdf,
    title: "PDF statements",
    text: "Generate statements you can preview on desktop and mobile.",
  },
  {
    icon: FaReceipt,
    title: "UTR tracking",
    text: "Keep payment references organized for traders and admins.",
  },
  {
    icon: FaChartLine,
    title: "Reports",
    text: "Filter by date, party, and verification to see what matters.",
  },
  {
    icon: FaLock,
    title: "Secure access",
    text: "Password login plus optional Google Authenticator 2FA.",
  },
];

const Landing = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showLogin, setShowLogin] = useState(false);
  const [slide, setSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const productTrackRef = useRef(null);
  const slideRef = useRef(0);

  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    dispatch(loadUser()).then((result) => {
      if (result.type === "user/loadUser/fulfilled") {
        navigate("/dashboard", { replace: true });
      }
    });
  }, [dispatch, navigate]);

  useEffect(() => {
    if (searchParams.get("login") === "1") {
      setShowLogin(true);
    }
    if (location.state?.accountExpiredMessage) {
      setShowLogin(true);
    }
  }, [searchParams, location.state]);

  // Pin the product section; advance slides only while it is stuck.
  // Each slide gets one viewport of scroll; after the last slide, page continues.
  useEffect(() => {
    const track = productTrackRef.current;
    if (!track) return undefined;

    const onScroll = () => {
      const rect = track.getBoundingClientRect();
      const viewH = window.innerHeight;
      const total = Math.max(track.offsetHeight - viewH, 1);

      // Not pinned yet (still above) → stay on first slide
      if (rect.top > 1) {
        if (slideRef.current !== 0) {
          slideRef.current = 0;
          setSlide(0);
        }
        return;
      }

      // Past the track → stay on last slide
      if (rect.bottom <= viewH) {
        const last = SLIDES.length - 1;
        if (slideRef.current !== last) {
          slideRef.current = last;
          setSlide(last);
        }
        return;
      }

      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      // Divide pin distance into equal segments (one per slide)
      const segment = total / SLIDES.length;
      const next = Math.min(
        SLIDES.length - 1,
        Math.max(0, Math.floor(scrolled / segment)),
      );

      if (next !== slideRef.current) {
        slideRef.current = next;
        setSlide(next);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const openLogin = () => {
    setShowLogin(true);
    setMenuOpen(false);
  };

  const closeLogin = () => {
    setShowLogin(false);
    if (searchParams.get("login") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("login");
      setSearchParams(next, { replace: true });
    }
  };

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-page relative min-h-screen bg-transparent text-slate-100">
      <AnimatedCanvasBg />

      <header className="landing-header fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="landing-brand text-xl font-bold tracking-tight text-white sm:text-2xl">
            MyAcBook
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <button type="button" onClick={() => scrollTo("product")} className="hover:text-white">
              Product
            </button>
            <button type="button" onClick={() => scrollTo("features")} className="hover:text-white">
              Features
            </button>
            <button type="button" onClick={() => scrollTo("how")} className="hover:text-white">
              How it works
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openLogin}
              className="rounded-full bg-[#424687] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#353a6e]"
            >
              Login
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              <span className="text-lg">{menuOpen ? "×" : "☰"}</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0b1220] px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2 text-sm font-medium text-slate-200">
              <button type="button" className="py-2 text-left" onClick={() => scrollTo("product")}>
                Product
              </button>
              <button type="button" className="py-2 text-left" onClick={() => scrollTo("features")}>
                Features
              </button>
              <button type="button" className="py-2 text-left" onClick={() => scrollTo("how")}>
                How it works
              </button>
            </div>
          </div>
        )}
      </header>

      <section
        id="top"
        className="relative z-10 flex min-h-[100dvh] items-center pt-16"
      >
        <div className="landing-hero-copy relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="landing-brand mb-3 text-4xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
            MyAcBook
          </p>
          <h1 className="max-w-2xl text-2xl font-semibold leading-snug text-slate-100 sm:text-3xl md:text-4xl">
            Accounting built for party ledgers and daily books
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Record entries, track UTR, and share PDF statements from one clean
            workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openLogin}
              className="inline-flex items-center gap-2 rounded-full bg-teal-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-300"
            >
              Login
              <FaArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollTo("product")}
              className="rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              See product
            </button>
          </div>
        </div>
      </section>

      <section
        id="product"
        ref={productTrackRef}
        className="relative z-20"
        style={{ height: `${(SLIDES.length + 1) * 100}vh` }}
      >
        {/* Full-viewport pin — covers hero so it cannot peek through while scrubbing */}
        <div className="sticky top-0 flex h-[100dvh] flex-col justify-center overflow-hidden bg-[#070b16]/92 backdrop-blur-[2px]">
          <div className="mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6">
            <div className="mb-5 text-center sm:mb-6">
              <h2 className="landing-brand text-3xl font-bold text-white sm:text-4xl">
                See MyAcBook in action
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400 sm:text-base">
                Section stays here — scroll to change screens. After the last one, page continues.
              </p>
            </div>

            {/* Stacked windows — past cards peek above like a deck */}
            <div className="landing-stack relative mx-auto w-full max-w-4xl pt-20 sm:pt-24">
              <div className="landing-stack-stage relative h-[min(48vh,440px)]">
                {SLIDES.map((item, index) => {
                  const depth = slide - index; // 0 active, >0 behind, <0 next
                  let layer = "landing-stack-card--next";
                  const style = {};

                  if (depth === 0) {
                    layer = "landing-stack-card--active";
                    style.zIndex = 40;
                  } else if (depth > 0) {
                    layer = "landing-stack-card--past";
                    const d = Math.min(depth, 3);
                    style.zIndex = 40 - d;
                    style.transform = `translate3d(0, ${-d * 28}px, 0) scale(${1 - d * 0.035})`;
                    style.opacity = d > 2 ? 0.35 : 0.92 - d * 0.12;
                  } else {
                    style.zIndex = 50;
                  }

                  return (
                    <article
                      key={item.id}
                      className={`landing-stack-card absolute inset-x-0 top-0 flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0f1424] ${layer}`}
                      style={style}
                      aria-hidden={index !== slide}
                    >
                      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#161c2e] px-4 py-2.5">
                        <div className="flex gap-1.5" aria-hidden>
                          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                        </div>
                        <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-300 sm:text-sm">
                          myacbook · {item.title}
                        </p>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-teal-300/80">
                          {index + 1}/{SLIDES.length}
                        </span>
                      </div>
                      <div className="min-h-0 flex-1 bg-slate-200">
                        <img
                          src={item.image}
                          alt={`${item.title} screenshot`}
                          className="h-full w-full object-cover object-top"
                          draggable={false}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-white">{SLIDES[slide].title}</p>
              <p className="max-w-md text-center text-xs text-slate-400">
                {SLIDES[slide].caption}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {SLIDES.map((item, index) => (
                  <div
                    key={item.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === slide
                        ? "w-8 bg-teal-400"
                        : index < slide
                          ? "w-3 bg-white/45"
                          : "w-3 bg-white/20"
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 border-t border-white/10 bg-black/20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="landing-brand text-3xl font-bold text-white sm:text-4xl">
            Everything your books need
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Built for teams that live in ledgers, statements, and payment references.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="border-b border-white/10 pb-6 last:border-0 sm:border-0 sm:pb-0"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#424687]/35 text-teal-300">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="relative z-10 border-t border-white/10 bg-black/25 py-16 backdrop-blur-[2px] sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="landing-brand text-3xl font-bold text-white sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Three steps from login to a shareable statement.
          </p>

          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Open your workspace",
                d: "Sign in securely and land on a dashboard tailored to your role.",
              },
              {
                n: "02",
                t: "Record the books",
                d: "Add parties, post account entries, and keep UTR references tidy.",
              },
              {
                n: "03",
                t: "Share statements",
                d: "Preview PDFs, download reports, and keep clients in sync.",
              },
            ].map((step) => (
              <li key={step.n}>
                <p className="text-sm font-bold tracking-[0.2em] text-teal-400">
                  {step.n}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">{step.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {step.d}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-black/20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="landing-brand text-3xl font-bold text-white sm:text-4xl">
            Ready to open your books?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Log in to MyAcBook or message support if you need access or a recharge.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={openLogin}
              className="rounded-full bg-[#424687] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#353a6e]"
            >
              Login to MyAcBook
            </button>
            <a
              href="https://wa.me/380936072208"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              WhatsApp support
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-black/40 py-8 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 sm:flex-row sm:items-center sm:px-6">
          <p className="landing-brand text-lg font-bold text-white">MyAcBook</p>
          <p className="text-sm text-slate-500">
            © {year} MyAcBook · Accounting & ledger software
          </p>
        </div>
      </footer>

      <LoginModal open={showLogin} onClose={closeLogin} />
    </div>
  );
};

export default Landing;
