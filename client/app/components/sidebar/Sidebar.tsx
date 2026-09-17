import { ExternalLink, History, Home, Info, Users, Disc, Music, Headphones, Sparkles, Mic2 } from "lucide-react";
import SidebarSearch from "./SidebarSearch";
import SidebarItem from "./SidebarItem";
import SidebarSettings from "./SidebarSettings";
import { getRewindParams, getRewindYear } from "~/utils/utils";

export default function Sidebar() {
  const iconSize = 20;

  return (
    <div className="z-50 flex sm:flex-col justify-between sm:fixed sm:top-0 sm:left-0 sm:h-screen h-auto sm:w-auto w-full border-b sm:border-b-0 sm:border-r border-(--color-bg-tertiary) pt-2 sm:py-10 sm:px-1 px-4 bg-(--color-bg)">
      <div className="flex gap-4 sm:flex-col">
        <SidebarItem space={10} to="/" end name="Home" onClick={() => {}} modal={<></>}>
          <Home size={iconSize} />
        </SidebarItem>
        <SidebarItem space={10} to="/clean-mode" name="Clean Mode" onClick={() => {}} modal={<></>}>
          <Sparkles size={iconSize} />
        </SidebarItem>
        <SidebarSearch size={iconSize} />
        <SidebarItem space={10} to="/rewind" name="Rewind" onClick={() => {}} modal={<></>}>
          <History size={iconSize} />
        </SidebarItem>
        <SidebarItem space={10} to="/chart/top-artists" name="Artists" onClick={() => {}} modal={<></>}>
          <Users size={iconSize} />
        </SidebarItem>
        <SidebarItem space={10} to="/chart/top-albums" name="Albums" onClick={() => {}} modal={<></>}>
          <Disc size={iconSize} />
        </SidebarItem>
        <SidebarItem space={10} to="/chart/top-tracks" name="Tracks" onClick={() => {}} modal={<></>}>
          <Music size={iconSize} />
        </SidebarItem>
        <SidebarItem space={10} to="/listens" name="Listens" onClick={() => {}} modal={<></>}>
          <Headphones size={iconSize} />
        </SidebarItem>
        <SidebarItem space={10} to="/live-shows" name="Live Shows" onClick={() => {}} modal={<></>}>
          <Mic2 size={iconSize} />
        </SidebarItem>
      </div>
      <div className="flex gap-4 sm:flex-col">
        <SidebarItem icon keyHint={<ExternalLink size={14} />} space={22} externalLink to="https://koito.io" name="About" onClick={() => {}} modal={<></>}>
          <Info size={iconSize} />
        </SidebarItem>
        <SidebarSettings size={iconSize} />
      </div>
    </div>
  );
}
