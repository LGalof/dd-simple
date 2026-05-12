import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

type AppLayoutProps = {
  children: ReactNode;
  hero?: ReactNode;
  navigation?: ReactNode;
};

function AppLayout({ children, hero, navigation }: AppLayoutProps) {
  return (
    <main className="app-shell">
      <div className="app-layout">
        <header className="app-header">
          <div className="app-brand">
            <span className="app-brand-mark">D20</span>
            <div>
              <strong>D&amp;D Simple</strong>
              <p className="app-brand-copy">Project workspace</p>
            </div>
          </div>

          <nav className="app-nav" aria-label="Primary">
            {navigation ?? (
              <>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    isActive ? "app-nav-link app-nav-link-active" : "app-nav-link"
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/characters"
                  className={({ isActive }) =>
                    isActive ? "app-nav-link app-nav-link-active" : "app-nav-link"
                  }
                >
                  My Characters
                </NavLink>
              </>
            )}
          </nav>
        </header>

        {hero && <div className="app-layout-hero">{hero}</div>}

        <section className="app-layout-content">{children}</section>
      </div>
    </main>
  );
}

export { AppLayout };
