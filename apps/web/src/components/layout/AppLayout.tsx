import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

type AppLayoutProps = {
  children: ReactNode;
  hero?: ReactNode;
  navigation?: ReactNode;
  variant?: "default" | "wide-left";
};

function AppLayout({
  children,
  hero,
  navigation,
  variant = "default",
}: AppLayoutProps) {
  const { logout, user } = useAuth();
  const layoutClassName =
    variant === "wide-left" ? "app-layout app-layout-wide-left" : "app-layout";
  const shellClassName =
    variant === "wide-left" ? "app-shell app-shell-wide-left" : "app-shell";

  return (
    <main className={shellClassName}>
      <div className={layoutClassName}>
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
                <NavLink
                  to="/inventory"
                  className={({ isActive }) =>
                    isActive ? "app-nav-link app-nav-link-active" : "app-nav-link"
                  }
                >
                  Inventory
                </NavLink>
                <NavLink
                  to="/board"
                  className={({ isActive }) =>
                    isActive ? "app-nav-link app-nav-link-active" : "app-nav-link"
                  }
                >
                  Board
                </NavLink>
                <NavLink
                  to="/rooms/create"
                  className={({ isActive }) =>
                    isActive ? "app-nav-link app-nav-link-active" : "app-nav-link"
                  }
                >
                  Create room
                </NavLink>
                <NavLink
                  to="/rooms/join"
                  className={({ isActive }) =>
                    isActive ? "app-nav-link app-nav-link-active" : "app-nav-link"
                  }
                >
                  Join room
                </NavLink>
                {user && (
                  <button
                    type="button"
                    className="app-nav-link app-nav-button"
                    onClick={logout}
                  >
                    Odjava
                  </button>
                )}
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
