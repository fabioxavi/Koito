import { Settings2, User } from "lucide-react";
import SettingsModal from "../modals/SettingsModal";
import SidebarItem from "./SidebarItem";
import { useEffect, useState } from "react";

interface Props {
    size: number
    showLabel?: boolean
}

export default function SidebarSettings({ size, showLabel }: Props) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement;
            const isTyping = active && (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                (active as HTMLElement).isContentEditable
            );
    
            if (!isTyping && e.key === '\\') {
                e.preventDefault();
                setOpen(!open);
            }
        };
    
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    if (showLabel) {
        return (
            <>
                <button
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-100 text-(--color-fg-secondary) hover:bg-(--color-bg-tertiary) hover:text-(--color-fg) w-full text-left"
                >
                    <User size={size} />
                    <span className="hidden sm:inline text-sm">Account</span>
                </button>
                <SettingsModal open={open} setOpen={setOpen} />
            </>
        );
    }

    return (
        <SidebarItem space={30} keyHint="\" name="Settings" onClick={() => setOpen(true)} modal={<SettingsModal open={open} setOpen={setOpen} />}>
            <Settings2 size={size} />
        </SidebarItem>
    )
}
