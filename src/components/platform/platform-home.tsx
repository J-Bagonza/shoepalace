"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
// THREE is imported dynamically inside GlobeHeroCanvas to keep it out of the
// initial JS bundle — it's ~600 KB and not needed until the hero mounts.
import { formatPrice } from "@/utils/product";
import { createClient } from "@/lib/supabase/client";
import type { StoreWithProducts } from "@/lib/platform/fetch-stores-directory";

// ─── Supabase image transform helper ─────────────────────────────
// Uses Supabase's built-in image transformation API to serve correctly-sized,
// compressed images instead of full-resolution originals.
function supabaseImg(
  url: string,
  { width, quality = 80 }: { width: number; quality?: number },
): string {
  try {
    const u = new URL(url);
    // Convert  /object/public/  →  /render/image/public/
    if (u.pathname.includes("/object/public/")) {
      u.pathname = u.pathname.replace("/object/public/", "/render/image/public/");
      u.searchParams.set("width", String(width));
      u.searchParams.set("quality", String(quality));
    }
    return u.toString();
  } catch {
    return url;
  }
}

interface PlatformHomeProps {
  stores: StoreWithProducts[];
}

// ─── Auth state hook for platform page ───────────────────────────
type PlatformAuthState = "loading" | "unauthenticated" | "user" | "platform_admin";

// Module-level in-memory cache so re-renders / StrictMode double-mounts don't
// fire duplicate network requests within the same browser session.
let _authCache: { state: PlatformAuthState; email: string } | null = null;
let _authInflight: Promise<void> | null = null;

function usePlatformAuth() {
  const [state, setState] = useState<PlatformAuthState>(
    _authCache?.state ?? "loading",
  );
  const [email, setEmail] = useState<string>(_authCache?.email ?? "");

  useEffect(() => {
    let cancelled = false;

    async function resolve(bust = false) {
      // Return cached result instantly unless we're busting the cache
      if (_authCache && !bust) {
        if (!cancelled) {
          setState(_authCache.state);
          setEmail(_authCache.email);
        }
        return;
      }

      // Deduplicate concurrent fetches
      if (!_authInflight || bust) {
        _authInflight = (async () => {
          try {
            const res = await fetch("/api/auth/platform-me", {
              method: "GET",
              credentials: "include",
              // Let the browser cache this for 30 s — auth state rarely changes
              // mid-session. Explicit sign-out busts the cache below.
              cache: "default",
            });

            if (!res.ok) {
              _authCache = { state: "unauthenticated", email: "" };
              return;
            }

            const json = await res.json() as {
              data: { role: string; email: string } | null;
            };

            if (!json.data) {
              _authCache = { state: "unauthenticated", email: "" };
              return;
            }

            _authCache = {
              state: json.data.role === "platform_admin" ? "platform_admin" : "user",
              email: json.data.email,
            };
          } catch {
            _authCache = { state: "unauthenticated", email: "" };
          } finally {
            _authInflight = null;
          }
        })();
      }

      await _authInflight;
      if (!cancelled && _authCache) {
        setState(_authCache.state);
        setEmail(_authCache.email);
      }
    }

    void resolve();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          _authCache = null;
          if (!cancelled) {
            setState("unauthenticated");
            setEmail("");
          }
        } else {
          // Bust cache on auth state changes (sign-in, token refresh, etc.)
          void resolve(true);
        }
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Continue even if request fails
    }
    _authCache = null; // bust the module-level cache
    setState("unauthenticated");
    setEmail("");
    window.location.href = "/";
  }

  return { state, email, signOut };
}

// ─── Platform Navbar ─────────────────────────────────────────────
function PlatformNavbar({ stores }: { stores: StoreWithProducts[] }) {
  const { state, email, signOut } = usePlatformAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/#shops", label: "Shops" },
    { href: "/#how-it-works", label: "About" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-neutral-100">
      <nav className="mx-auto max-w-7xl px-6 lg:px-8 h-[56px] flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="font-bebas text-2xl tracking-wider text-neutral-900 hover:text-[#E8001D] transition-colors"
        >
          ShoePalace
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-4">

          {state === "loading" && (
            <div className="h-4 w-16 bg-neutral-100 animate-pulse rounded" />
          )}

          {state === "unauthenticated" && (
            <Link
              href="/login"
              className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Sign In
            </Link>
          )}

          {state === "platform_admin" && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-900 hover:text-[#E8001D] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="hidden sm:block">Platform</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white border border-neutral-100 shadow-lg z-50"
                  >
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400">Signed in as</p>
                      <p className="text-xs text-neutral-700 truncate mt-0.5">{email}</p>
                      <span className="inline-flex items-center gap-1 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-green-600 uppercase tracking-widest">Platform Admin</span>
                      </span>
                    </div>
                    <div className="py-1">
                      <Link href="/platform" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
                        <span>Platform Dashboard</span>
                        <span className="ml-auto text-neutral-300">→</span>
                      </Link>
                      <Link href="/platform/requests" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
                        <span>Store Requests</span>
                        <span className="ml-auto text-neutral-300">→</span>
                      </Link>
                      <Link href="/platform/tenants" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
                        <span>All Stores</span>
                        <span className="ml-auto text-neutral-300">→</span>
                      </Link>
                    </div>
                    <div className="border-t border-neutral-100 py-1">
                      <button
                        onClick={() => { setMenuOpen(false); void signOut(); }}
                        className="w-full flex items-center px-4 py-2.5 text-xs text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors text-left"
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {menuOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              )}
            </div>
          )}

          {state === "user" && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="text-neutral-400 hover:text-neutral-900 transition-colors"
                aria-label="Account menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-white border border-neutral-100 shadow-lg z-50"
                  >
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="text-xs text-neutral-600 truncate">{email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { setMenuOpen(false); void signOut(); }}
                        className="w-full text-left px-4 py-2.5 text-xs text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {menuOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              )}
            </div>
          )}

          <Link
            href="/register-store"
            className="bg-neutral-900 text-white px-5 py-2 text-xs uppercase tracking-widest hover:bg-[#E8001D] transition-colors hidden sm:block"
          >
            Open a Store
          </Link>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex md:hidden flex-col gap-1.5 p-1"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <motion.span animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} className="block h-px w-5 bg-neutral-900 origin-center" />
            <motion.span animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }} className="block h-px w-5 bg-neutral-900" />
            <motion.span animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} className="block h-px w-5 bg-neutral-900 origin-center" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-b border-neutral-100 px-6 py-6"
          >
            <ul className="flex flex-col gap-5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-700 hover:text-[#E8001D] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
              {state === "platform_admin" && (
                <>
                  <li><Link href="/platform" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-700 hover:text-[#E8001D] transition-colors">Platform Dashboard</Link></li>
                  <li><Link href="/platform/requests" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-700 hover:text-[#E8001D] transition-colors">Store Requests</Link></li>
                  <li><Link href="/platform/tenants" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-700 hover:text-[#E8001D] transition-colors">All Stores</Link></li>
                </>
              )}
              <li>
                <Link href="/register-store" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-700 hover:text-[#E8001D] transition-colors">
                  Open a Store
                </Link>
              </li>
              <li className="pt-2 border-t border-neutral-100">
                {state === "unauthenticated" && (
                  <Link href="/login" className="text-sm uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">Sign In</Link>
                )}
                {(state === "user" || state === "platform_admin") && (
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest truncate">{email}</span>
                    <button onClick={() => { setMobileOpen(false); void signOut(); }} className="text-sm uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors text-left">Sign Out</button>
                  </div>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Product Carousel ─────────────────────────────────────────────
function ProductCarousel({
  products,
  storeSlug,
  currency,
}: {
  products: StoreWithProducts["products"];
  storeSlug: string;
  currency: string;
}) {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-[#F5F0E8]">
        <p className="text-xs uppercase tracking-widest text-neutral-400">No products yet</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: products.length * 3,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        style={{ width: "max-content" }}
      >
        {[...products, ...products].map((product, i) => (
          <a
            key={`${product.id}-${i}`}
            href={`https://${storeSlug}.${rootDomain}/products/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-36 group"
          >
            <div className="relative aspect-square bg-white overflow-hidden mb-2 border border-neutral-100">
              {product.image_url ? (
                <Image
                  src={supabaseImg(product.image_url, { width: 288, quality: 82 })}
                  alt={product.name}
                  fill
                  sizes="144px"
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-[#F5F0E8]" />
              )}
            </div>
            <p className="text-[11px] font-medium text-neutral-900 truncate">{product.name}</p>
            <p className="text-[11px] text-neutral-500">{formatPrice(product.price, currency)}</p>
          </a>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Store Card ───────────────────────────────────────────────────
function StoreCard({ store }: { store: StoreWithProducts }) {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";
  const storeUrl = `https://${store.tenant.slug}.${rootDomain}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={clsx(
        "border bg-white overflow-hidden transition-all",
        store.is_featured ? "border-neutral-900 shadow-sm" : "border-neutral-100",
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          {store.tenant.logo_url ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-sm bg-white border border-neutral-100">
              <Image
                src={supabaseImg(store.tenant.logo_url, { width: 64, quality: 85 })}
                alt={store.tenant.name}
                fill
                sizes="32px"
                className="object-contain p-0.5"
              />
            </div>
          ) : (
            <div className="h-8 w-8 bg-neutral-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold uppercase">{store.tenant.name.charAt(0)}</span>
            </div>
          )}
          <div className="flex flex-col gap-0">
            <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-neutral-900 hover:text-[#E8001D] transition-colors leading-tight">
              {store.tenant.name}
            </a>
            <span className="text-[10px] text-neutral-400">{store.tenant.slug}.shoepalace.store</span>
          </div>
        </div>
        <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">
          Visit →
        </a>
        {store.is_featured && (
          <span className="text-[10px] uppercase tracking-widest text-[#E8001D] border border-[#E8001D] px-2 py-0.5 shrink-0">
            Featured
          </span>
        )}
      </div>
      <div className="px-5 py-4">
        <ProductCarousel products={store.products} storeSlug={store.tenant.slug} currency={store.currency} />
      </div>
    </motion.div>
  );
}

// ─── Globe Hero Canvas (immersive product globe) ─────────────────
// Images: sp (1).jpg through sp (39).jpg in the `hero/` bucket folder.
// Request 400 px wide WebP-compressed versions via Supabase image transforms —
// dramatically smaller downloads for tiles that are never shown larger than ~200 px.
const SUPABASE_BASE = "https://hisgmvazdmtgjuepuqit.supabase.co";
const HERO_IMAGE_URLS = Array.from(
  { length: 39 },
  (_, i) =>
    `${SUPABASE_BASE}/storage/v1/render/image/public/product-images/hero/sp%20(${
      i + 1
    }).jpg?width=800&height=1120&resize=contain&quality=72&format=webp`,
);

// THREE is loaded dynamically so all Three.js object types are typed as `any`
// at module scope to avoid "Cannot find namespace 'THREE'" TS errors.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type V3 = any;
interface GlobeTile {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mesh: any;
  basePosition: V3;
  targetRestOpacity: number;
  phase: "in" | "held" | "out" | null;
  phaseStart: number;
  restTransform?: { pos: V3; quat: V3 };
  outStartPos?: V3;
  aspectScale: { x: number; y: number };
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function GlobeHeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const vignetteRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let rafId = 0;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Dynamically import Three.js so it is excluded from the initial JS bundle.
    // This alone removes ~600 KB from the page's critical path.
    void (async () => {
      const THREE = await import("three");
      if (cancelled) return;

    // ----- config -----
    const GLOBE_RADIUS = 9;
    const TILE_COUNT = 90;
    const ORBIT_DURATION_MS = 5000; // phase 1: establishing orbit shot
    const DIVE_DURATION_MS = 2200; // phase 2: camera flies to the center
    const FOCUS_TRANSITION_MS = 1100; // ease an image in / out
    const FOCUS_HOLD_MS = 3000; // image stays fully visible
    const FOCUS_GAP_MS = 250; // breather between images
    const AMBIENT_ROTATE_SPEED = 0.0006; // slow drift once inside
    let STAGE_RIGHT_OFFSET = 2.4;
    let STAGE_UP_OFFSET = 0.2;
    const STAGE_FORWARD_DIST = 4.2;
    const STAGE_SCALE = 1.9;

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
      return id;
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.05,
      1000,
    );

    const OUTSIDE_CAMERA_POS = new THREE.Vector3(2, 0.5, 24);
    const INSIDE_CAMERA_POS = new THREE.Vector3(0, 0, 0.01);
    camera.position.copy(OUTSIDE_CAMERA_POS);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    scene.fog = new THREE.Fog(0x0b0b0c, 4, 16);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    function positionGlobeForViewport() {
      const isNarrow = window.innerWidth < 900;
      globeGroup.position.x = isNarrow ? 0 : GLOBE_RADIUS * 0.5;
      globeGroup.position.y = isNarrow ? 1.5 : 0.4;

      // On narrow viewports the focused/flying image must stay centered —
      // a fixed right-offset (correct on wide desktop screens) pushes it
      // past the edge of a narrow frame, where it's only partially visible.
      STAGE_RIGHT_OFFSET = isNarrow ? 0 : 2.4;
      STAGE_UP_OFFSET = isNarrow ? 0.4 : 0.2;
    }
    positionGlobeForViewport();

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    const tiles: GlobeTile[] = [];

    function fibonacciSpherePoints(count: number, radius: number) {
      const points: V3[] = [];
      const offset = 2 / count;
      const increment = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const y = i * offset - 1 + offset / 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const phi = i * increment;
        const x = Math.cos(phi) * r;
        const z = Math.sin(phi) * r;
        points.push(new THREE.Vector3(x, y, z).multiplyScalar(radius));
      }
      return points;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function animateOpacity(material: any, target: number, durationMs: number) {
      const start = material.opacity;
      const startTime = performance.now();
      function step() {
        if (cancelled) return;
        const t = Math.min(1, (performance.now() - startTime) / durationMs);
        material.opacity = start + (target - start) * easeInOutCubic(t);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    let loadedCount = 0;
    function buildTiles() {
      const points = fibonacciSpherePoints(TILE_COUNT, GLOBE_RADIUS);

      // Create all tile meshes immediately (placeholder grey squares)
      // but load textures in prioritised batches to avoid 90 simultaneous
      // network requests on mount. The first 9 unique images load right away
      // so the globe looks alive quickly; the rest trickle in after 800 ms.
      const IMMEDIATE_BATCH = 9;

      points.forEach((pos, i) => {
        const placeholderMat = new THREE.MeshBasicMaterial({
          color: 0x2a2a2a,
          transparent: true,
          opacity: 0.0,
          side: THREE.DoubleSide,
          fog: true,
        });

        const size = 1.3;
        const geo = new THREE.PlaneGeometry(size, size);
        const mesh = new THREE.Mesh(geo, placeholderMat);
        mesh.position.copy(pos);
        mesh.lookAt(0, 0, 0);
        globeGroup.add(mesh);

        const tile: GlobeTile = {
          mesh,
          basePosition: pos.clone(),
          targetRestOpacity: 0.5,
          phase: null,
          phaseStart: 0,
          aspectScale: { x: 1.3, y: 1.3 },
        };
        tiles.push(tile);

        // Load this tile's texture — immediately for the first batch,
        // deferred for the rest so we don't flood the network.
        const url = HERO_IMAGE_URLS[i % HERO_IMAGE_URLS.length]!;
        const loadTile = () => {
          loader.load(
            url,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (texture: any) => {
              if (cancelled) return;
              // Use LinearMipmapLinearFilter for better quality when textures
              // are displayed smaller than their native resolution.
              texture.minFilter = THREE.LinearMipmapLinearFilter;

              // Fit the image's true aspect ratio inside a consistent
              // bounding box (equivalent to CSS object-contain) instead of
              // always anchoring one axis at 1 — anchoring one axis caused
              // landscape photos to render as narrow vertical strips once
              // scaled up during the focused "held" stage.
              const imgW = texture.image?.width ?? 1;
              const imgH = texture.image?.height ?? 1;
              const aspect = imgW / imgH;
              const BOX = 1.3; // target box edge length, matches base plane
              tile.aspectScale =
                aspect >= 1
                  ? { x: BOX, y: BOX / aspect }
                  : { x: BOX * aspect, y: BOX };
              mesh.scale.set(
                tile.aspectScale.x / size,
                tile.aspectScale.y / size,
                1,
              );

              const mat = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.0,
                side: THREE.DoubleSide,
                fog: true,
              });
              mesh.material = mat;
              loadedCount++;
              tile.targetRestOpacity = 0.45 + Math.random() * 0.25;
              animateOpacity(mat, tile.targetRestOpacity, 900);

              if (loadedCount === 1 && statusRef.current) {
                statusRef.current.textContent = "globe ready";
              }
              if (loadedCount === points.length && statusRef.current) {
                statusRef.current.style.opacity = "0";
              }
            },
            undefined,
            () => { loadedCount++; },
          );
        };

        if (i < IMMEDIATE_BATCH) {
          loadTile();
        } else {
          // Stagger the rest: batch every 9 tiles with 250 ms between batches
          const batchDelay = Math.floor((i - IMMEDIATE_BATCH) / 9) * 250 + 800;
          schedule(loadTile, batchDelay);
        }
      });
    }
    buildTiles();

    // ----- sequence state machine -----
    // 'orbit'  -> camera outside, globe spins, establishing shot
    // 'diving' -> camera flies from outside to the center
    // 'inside' -> camera at center, images fly out at the viewer one at a time
    let sequenceState: "orbit" | "diving" | "inside" = "orbit";
    let stateStartedAt = performance.now();

    function enterState(name: "orbit" | "diving" | "inside") {
      sequenceState = name;
      stateStartedAt = performance.now();
      if (name === "diving" && overlayRef.current) {
        overlayRef.current.style.opacity = "0.85";
      }
      if (name === "inside") {
        if (vignetteRef.current) vignetteRef.current.style.opacity = "1";
        startFocusCycle();
      }
    }

    schedule(() => enterState("diving"), ORBIT_DURATION_MS);
    schedule(() => enterState("inside"), ORBIT_DURATION_MS + DIVE_DURATION_MS);

    // ----- focus cycle -----
    // a tile flies from its position on the sphere toward the viewer,
    // holds, then returns
    let focusedTile: GlobeTile | null = null;

    function pickNextFocusTile(): GlobeTile | null {
  const candidates = tiles.filter((t) => t.mesh.material.map && t !== focusedTile);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

    function startFocusCycle() {
      if (sequenceState !== "inside" || cancelled) return;

      const next = pickNextFocusTile();
      if (!next) {
        schedule(startFocusCycle, 500);
        return;
      }

      // snapshot where it rests on the globe before detaching, so it can
      // move independently of the rotating group
      next.restTransform = getRestWorldTransform(next);
      detachFromGlobe(next);

      next.phase = "in";
      next.phaseStart = performance.now();
      focusedTile = next;

      schedule(() => {
        next.outStartPos = computeStageWorldPosition();
        next.phase = "out";
        next.phaseStart = performance.now();
      }, FOCUS_TRANSITION_MS + FOCUS_HOLD_MS);

      schedule(
        startFocusCycle,
        FOCUS_TRANSITION_MS + FOCUS_HOLD_MS + FOCUS_TRANSITION_MS + FOCUS_GAP_MS,
      );
    }

    const tmpForward = new THREE.Vector3();
    const tmpRight = new THREE.Vector3();
    const tmpUp = new THREE.Vector3();
    const tmpStageWorld = new THREE.Vector3();
    const tmpWorldPos = new THREE.Vector3();
    const tmpWorldQuat = new THREE.Quaternion();
    const tmpLookMatrix = new THREE.Matrix4();
    const tmpRestQuat = new THREE.Quaternion();

    function computeStageWorldPosition() {
      camera.getWorldDirection(tmpForward);
      tmpUp.copy(camera.up);
      tmpRight.crossVectors(tmpForward, tmpUp).normalize();
      tmpStageWorld
        .copy(camera.position)
        .addScaledVector(tmpForward, STAGE_FORWARD_DIST)
        .addScaledVector(tmpRight, STAGE_RIGHT_OFFSET)
        .addScaledVector(tmpUp, STAGE_UP_OFFSET);
      return tmpStageWorld.clone();
    }

    // where a tile "lives" when resting in the globe, in WORLD space
    function getRestWorldTransform(tile: GlobeTile) {
      const worldPos = globeGroup.localToWorld(tile.basePosition.clone());
      tmpLookMatrix.lookAt(worldPos, globeGroup.position, tile.mesh.up);
      tmpRestQuat.setFromRotationMatrix(tmpLookMatrix);
      return { pos: worldPos, quat: tmpRestQuat.clone() };
    }

    // pull the tile out of the rotating globe group and into the scene root,
    // preserving its current world transform
    function detachFromGlobe(tile: GlobeTile) {
      tile.mesh.getWorldPosition(tmpWorldPos);
      tile.mesh.getWorldQuaternion(tmpWorldQuat);
      globeGroup.remove(tile.mesh);
      scene.add(tile.mesh);
      tile.mesh.position.copy(tmpWorldPos);
      tile.mesh.quaternion.copy(tmpWorldQuat);
    }

    // put the tile back into the globe group at its resting local transform
    function reattachToGlobe(tile: GlobeTile) {
      scene.remove(tile.mesh);
      globeGroup.add(tile.mesh);
      tile.mesh.position.copy(tile.basePosition);
      tile.mesh.lookAt(globeGroup.position);
    }

    function updateTileFocusState(tile: GlobeTile, now: number) {
      const mat = tile.mesh.material;
      if (!mat.map || !tile.phase) return;

      if (tile.phase === "in") {
        const t = Math.min(1, (now - tile.phaseStart) / FOCUS_TRANSITION_MS);
        const e = easeInOutCubic(t);
        const stagePos = computeStageWorldPosition();
        const restPos = tile.restTransform!.pos;
        const restQuat = tile.restTransform!.quat;

        tile.mesh.position.copy(restPos).lerp(stagePos, e);
        tile.mesh.quaternion.copy(restQuat).slerp(camera.quaternion, e);
        const sIn = 1 + e * (STAGE_SCALE - 1);
        tile.mesh.scale.set(
          (tile.aspectScale.x / 1.3) * sIn,
          (tile.aspectScale.y / 1.3) * sIn,
          1,
        );
        mat.opacity = tile.targetRestOpacity + (1 - tile.targetRestOpacity) * e;
        mat.fog = false; // left the globe now, no depth-fog while "on stage"

        if (t >= 1) tile.phase = "held";
      } else if (tile.phase === "held") {
        // fixed in world space, dead-on to the camera
        tile.mesh.position.copy(computeStageWorldPosition());
        tile.mesh.quaternion.copy(camera.quaternion);
        tile.mesh.scale.set(
          (tile.aspectScale.x / 1.3) * STAGE_SCALE,
          (tile.aspectScale.y / 1.3) * STAGE_SCALE,
          1,
        );
        mat.opacity = 1;
        mat.fog = false;
      } else if (tile.phase === "out") {
        const t = Math.min(1, (now - tile.phaseStart) / FOCUS_TRANSITION_MS);
        const e = easeInOutCubic(t);
        const stagePos = tile.outStartPos!;
        const restTransform = getRestWorldTransform(tile);

        tile.mesh.position.copy(stagePos).lerp(restTransform.pos, e);
        tile.mesh.quaternion.copy(camera.quaternion).slerp(restTransform.quat, e);
        const sOut = STAGE_SCALE - e * (STAGE_SCALE - 1);
        tile.mesh.scale.set(
          (tile.aspectScale.x / 1.3) * sOut,
          (tile.aspectScale.y / 1.3) * sOut,
          1,
        );
        mat.opacity = 1 - (1 - tile.targetRestOpacity) * e;
        mat.fog = e > 0.6;

        if (t >= 1) {
          tile.phase = null;
          reattachToGlobe(tile);
          tile.mesh.scale.set(
            tile.aspectScale.x / 1.3,
            tile.aspectScale.y / 1.3,
            1,
          );
          mat.opacity = tile.targetRestOpacity;
          mat.fog = true;
        }
      }
    }

    // ----- render loop -----
    function animate() {
      rafId = requestAnimationFrame(animate);
      const now = performance.now();

      if (sequenceState === "orbit") {
        globeGroup.rotation.y += 0.0035; // establishing spin
        camera.position.copy(OUTSIDE_CAMERA_POS);
        camera.lookAt(globeGroup.position);
      } else if (sequenceState === "diving") {
        const t = Math.min(1, (now - stateStartedAt) / DIVE_DURATION_MS);
        const e = easeInOutCubic(t);
        globeGroup.rotation.y += 0.0035 * (1 - e) + AMBIENT_ROTATE_SPEED * e;

        const target = globeGroup.position.clone().add(INSIDE_CAMERA_POS);
        camera.position.lerpVectors(OUTSIDE_CAMERA_POS, target, e);
        camera.fov = 45 + 25 * e; // widen FOV as we get close, for "swallowed up" feel
        camera.updateProjectionMatrix();
        camera.lookAt(globeGroup.position.x, globeGroup.position.y, globeGroup.position.z - 1);
      } else if (sequenceState === "inside") {
        globeGroup.rotation.y += AMBIENT_ROTATE_SPEED;
        const target = globeGroup.position.clone().add(INSIDE_CAMERA_POS);
        camera.position.copy(target);
        camera.lookAt(globeGroup.position.x, globeGroup.position.y, globeGroup.position.z - 1);
        tiles.forEach((tile) => updateTileFocusState(tile, now));
      }

      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      positionGlobeForViewport();
    }
    window.addEventListener("resize", handleResize);

    // Store cleanup fn so the outer effect cleanup can call it even though
    // Three.js was loaded asynchronously.
    (canvas as any).__threeCleanup = () => {
      timeouts.forEach(clearTimeout);
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      tiles.forEach((tile) => {
        tile.mesh.geometry.dispose();
        if (tile.mesh.material.map) tile.mesh.material.map.dispose();
        tile.mesh.material.dispose();
      });
      renderer.dispose();
    };
    })(); // end async dynamic-import IIFE

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      const cleanup = (canvas as any).__threeCleanup;
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 z-0 block h-full w-full" />
      <div
        ref={vignetteRef}
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 60% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)",
          opacity: 0,
          transition: "opacity 1.4s ease",
        }}
      />
      <div
        ref={overlayRef}
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 30%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.05) 100%)",
          opacity: 1,
          transition: "opacity 1.2s ease",
        }}
      />
      <div
        ref={statusRef}
        className="absolute bottom-6 left-6 z-[2] text-[10px] uppercase tracking-widest text-white/30 transition-opacity duration-500"
      >
        loading globe…
      </div>
    </>
  );
}

// ─── Main Platform Page ───────────────────────────────────────────
export function PlatformHomePage({ stores }: PlatformHomeProps) {
  return (
    <div className="min-h-screen bg-white">
      <PlatformNavbar stores={stores} />

      {/* ── Hero ── */}
      <section className="pt-[32px] min-h-[560px] sm:h-screen sm:min-h-[640px] flex items-start sm:items-center bg-[#0A0A0A] text-white relative overflow-hidden">
        <GlobeHeroCanvas />

        <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-8 pt-16 sm:pt-8 pb-6 sm:pb-8 md:py-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5 sm:gap-8 max-w-xl"
          >
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                The Footwear Marketplace
              </span>
              <h1 className="font-bebas text-[36px] sm:text-[56px] md:text-[108px] leading-none tracking-tight whitespace-nowrap">
                Every Shoe.<br />
                Every Store.
              </h1>
              <p className="text-sm text-white/55 max-w-md leading-relaxed">
                ShoePalace connects Kenya&apos;s best footwear stores with customers who care about quality. Browse stores, discover exclusive drops, and shop directly from verified vendors.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 items-start">
              <a
                href="#shops"
                className="w-fit bg-white text-neutral-900 px-6 sm:px-8 py-3 sm:py-3.5 text-xs uppercase tracking-widest border border-white hover:bg-[#E8001D] hover:border-[#E8001D] hover:text-white transition-colors"
              >
                Browse Stores
              </a>
              <Link
                href="/register-store"
                className="w-fit bg-transparent text-white px-6 sm:px-8 py-3 sm:py-3.5 text-xs uppercase tracking-widest border border-white/40 hover:border-white transition-colors"
              >
                Open Your Store
              </Link>
            </div>

            <div className="flex items-center gap-5 sm:gap-8 pt-4 border-t border-white/10 flex-wrap">
              {[
                { value: stores.length.toString(), label: "Active Stores" },
                { value: "Kenya", label: "Market" },
                { value: "M-Pesa", label: "Payments" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <span className="font-bebas text-2xl tracking-wide text-white">{stat.value}</span>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="bg-[#F5F0E8] py-20 md:py-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-3 block">
                A platform
              </span>
              <h2 className="font-bebas text-5xl md:text-6xl tracking-wide text-neutral-900 leading-none">
                Built for Kenya&apos;s<br />shoe market
              </h2>
            </div>
            <p className="text-sm text-neutral-500 max-w-sm leading-relaxed md:text-right">
              Every store is independently run, reviewed by our team, and powered by a shared infrastructure — so the experience is consistent wherever you shop.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-px bg-neutral-200">
            {[
              {
                num: "01",
                title: "Browse verified stores",
                body: "Every store on ShoePalace has been reviewed before going live. No pop-ups, no noise — just real sellers with real stock.",
                detail: "Verified sellers only",
                accent: "#C2542D", // terracotta
                accentSoft: "#C2542D33",
                accentSoftHover: "#C2542D55",
                circle: "absolute -top-10 -right-10 w-32 h-32",
              },
              {
                num: "02",
                title: "Order direct from the source",
                body: "Visit any store, browse their full catalogue, and place your order. Each store manages its own inventory and fulfilment.",
                detail: "Nationwide delivery",
                accent: "#6B7F5C", // sage
                accentSoft: "#6B7F5C33",
                accentSoftHover: "#6B7F5C55",
                circle: "absolute -bottom-12 -left-8 w-36 h-36",
              },
              {
                num: "03",
                title: "Pay with M-Pesa",
                body: "No card required. Every store accepts M-Pesa and you get a confirmation the moment payment goes through.",
                detail: "Instant confirmation",
                accent: "#C99A3E", // ochre
                accentSoft: "#C99A3E33",
                accentSoftHover: "#C99A3E55",
                circle: "absolute top-1/2 -right-14 -translate-y-1/2 w-28 h-28",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="relative bg-[#F5F0E8] p-8 md:p-10 flex flex-col gap-6 group overflow-hidden"
              >
                {/* Soft color field — modern-art block, visible at rest,
                    intensifies on hover. Position varies per card. */}
                <div
                  className={`${item.circle} rounded-full transition-all
                    duration-500 pointer-events-none`}
                  style={{ backgroundColor: item.accentSoft }}
                />
                <div
                  className={`${item.circle} rounded-full opacity-0
                    group-hover:opacity-100 transition-opacity
                    duration-500 pointer-events-none`}
                  style={{ backgroundColor: item.accentSoftHover }}
                />

                <div className="relative flex items-start justify-between">
                  <span
                    className="font-bebas text-[56px] leading-none
                      transition-colors duration-300"
                    style={{ color: item.accent }}
                  >
                    {item.num}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-widest px-2.5
                      py-1 mt-2 border transition-colors duration-300"
                    style={{
                      color: item.accent,
                      borderColor: item.accent,
                    }}
                  >
                    {item.detail}
                  </span>
                </div>
                <div className="relative flex flex-col gap-2.5 flex-1">
                  <h3 className="text-base font-medium text-neutral-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {item.body}
                  </p>
                </div>
                <div
                  className="relative h-[3px] transition-all duration-300"
                  style={{ backgroundColor: item.accent }}
                />
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Shops directory ── */}
      <section id="shops" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div className="flex flex-col gap-2">
              <h2 className="font-bebas text-4xl md:text-5xl tracking-wide text-neutral-900">
                Verified Stores
              </h2>
              <p className="text-sm text-neutral-400">
                {stores.length} store{stores.length !== 1 ? "s" : ""} on the platform
              </p>
            </div>
            <Link
              href="/register-store"
              className="hidden md:block text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors underline underline-offset-4"
            >
              Open your store →
            </Link>
          </div>

          {stores.length === 0 ? (
            <div className="border border-neutral-100 py-24 text-center">
              <p className="text-sm text-neutral-400 uppercase tracking-widest mb-4">No stores yet</p>
              <Link
                href="/register-store"
                className="text-xs uppercase tracking-widest text-neutral-900 underline underline-offset-4 hover:text-[#E8001D] transition-colors"
              >
                Be the first to open a store
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <StoreCard key={store.tenant.id} store={store} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA — "Sell on ShoePalace" ── */}
      <section className="bg-[#0A0A0A] text-white py-0 overflow-hidden relative">
        {/* Background image — served at 1400 px wide via Supabase transform.
            On large screens the image wrapper is inset so the shoe doesn't
            scale up to fill an extra-wide viewport via object-cover. */}
        <div className="absolute inset-0 lg:inset-y-0 lg:right-0 lg:left-[8%]">
          <Image
            src={supabaseImg(
              "https://hisgmvazdmtgjuepuqit.supabase.co/storage/v1/object/public/product-images/platform/818f929e-6d8e-4a0e-b54e-cb053585fde5.png",
              { width: 1400, quality: 80 },
            )}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center lg:object-contain lg:object-right"
            priority={false}
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #0A0A0A 0%, #0A0A0A 15%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.15) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-20 md:py-28 flex flex-col md:flex-row items-center md:items-start justify-between gap-12">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-5 max-w-lg"
          >
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              For sellers
            </span>
            <h2 className="font-bebas text-5xl md:text-6xl tracking-wide leading-none">
              Sell on ShoePalace
            </h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-sm">
              Get your own store at yourname.shoepalace.store. We handle the platform — you focus on selling. Applications are reviewed within 24 hours.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/register-store"
                className="inline-flex items-center gap-3 bg-white text-neutral-900 px-8 py-4 text-xs uppercase tracking-widest w-fit hover:bg-[#E8001D] hover:text-white transition-colors"
              >
                Apply to Open a Store
                <span>→</span>
              </Link>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">
                Free to apply · Reviewed by hand
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h2 className="font-bebas text-4xl md:text-5xl tracking-wide text-neutral-900">
                  Get In Touch
                </h2>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Questions about the platform, your store application, or anything else? We&apos;re a small team based in Nairobi and we read every message.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Email", value: "hello@shoepalace.store", href: "mailto:hello@shoepalace.store" },
                  { label: "Location", value: "Nairobi, Kenya", href: null },
                  { label: "Response time", value: "Within 24 hours", href: null },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400">{item.label}</span>
                    {item.href ? (
                      <a href={item.href} className="text-sm text-neutral-900 hover:text-[#E8001D] transition-colors">{item.value}</a>
                    ) : (
                      <span className="text-sm text-neutral-900">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium uppercase tracking-widest text-neutral-900">
                  Want to open a store?
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Apply to join the platform. Applications are reviewed by hand and we&apos;ll get back to you within 24 hours.
                </p>
              </div>
              <Link
                href="/register-store"
                className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-[#E8001D] transition-colors w-fit"
              >
                Apply Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}