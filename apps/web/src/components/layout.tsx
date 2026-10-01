import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/reconciliations", label: "Reconciliations" },
  { to: "/ask", label: "Ask AI" },
];

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row">
      <a href="#main-content" className="skip-link">Skip to content</a>
      {/* Sidebar */}
      <aside className="bg-sidebar text-sidebar-foreground p-5 md:w-64 md:shrink-0 md:p-6">
        <div className="mb-5 flex items-center gap-3 md:mb-8">
          <img src="/favicon.svg" alt="" className="h-10 w-10 shrink-0" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">LedgerMatch</h1>
            <p className="mt-1 text-xs text-slate-300">Payment Reconciliation Platform</p>
          </div>
        </div>
        <nav aria-label="Main navigation" className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-200 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-5 text-xs leading-relaxed text-slate-300 md:mt-8">Demo workspace · Simulated provider records</p>
      </aside>

      {/* Main content */}
      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 p-4 sm:p-6 md:overflow-auto lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
