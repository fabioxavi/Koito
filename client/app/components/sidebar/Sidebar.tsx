import { ExternalLink, History, Home, Info, Share2, Users, Music } from "lucide-react";
import SidebarItem from "./SidebarItem";
import SidebarSettings from "./SidebarSettings";
import { NavLink } from "react-router";

export default function Sidebar() {
  const iconSize = 20;

  return (
    <div
      className="
            z-50
            flex
            sm:flex-col
            justify-between
            sm:fixed
            sm:top-0
            sm:left-0
            sm:h-screen
            h-auto
            sm:w-[200px]
            w-full
            border-b
            sm:border-b-0
            sm:border-r
            border-(--color-bg-tertiary)
            pt-2
            sm:py-6
            sm:px-3
            px-4
            bg-(--color-bg)
        "
    >
      {/* Logo */}
      <div className="flex flex-col gap-1">
        <div className="hidden sm:flex items-center gap-2 px-2 py-3 mb-4">
          <Music size={24} className="text-(--color-primary)" />
          <span className="header-font font-bold text-lg">Koito</span>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex gap-2 sm:flex-col sm:gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-100 ${
                isActive
                  ? "text-(--color-primary) bg-(--color-bg-secondary)"
                  : "text-(--color-fg-secondary) hover:bg-(--color-bg-tertiary) hover:text-(--color-fg)"
              }`
            }
          >
            <Home size={iconSize} />
            <span className="hidden sm:inline text-sm">Dashboard</span>
          </NavLink>
          
          <NavLink
            to="/chart/listens"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-100 ${
                isActive
                  ? "text-(--color-primary) bg-(--color-bg-secondary)"
                  : "text-(--color-fg-secondary) hover:bg-(--color-bg-tertiary) hover:text-(--color-fg)"
              }`
            }
          >
            <History size={iconSize} />
            <span className="hidden sm:inline text-sm">Scrobbles</span>
          </NavLink>
          
          <NavLink
            to="/rewind"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-100 ${
                isActive
                  ? "text-(--color-primary) bg-(--color-bg-secondary)"
                  : "text-(--color-fg-secondary) hover:bg-(--color-bg-tertiary) hover:text-(--color-fg)"
              }`
            }
          >
            <Share2 size={iconSize} />
            <span className="hidden sm:inline text-sm">Share</span>
          </NavLink>
        </nav>
      </div>
      
      {/* Bottom Items */}
      <div className="flex gap-2 sm:flex-col sm:gap-1">
        <SidebarSettings size={iconSize} showLabel />
      </div>
    </div>
  );
}
