import React, { useState } from "react";
import Popup from "../Popup";
import { NavLink } from "react-router";

interface Props {
    name: string;
    to?: string;
    onClick: Function;
    children: React.ReactNode;
    modal: React.ReactNode;
    keyHint?: React.ReactNode;
    space?: number
    externalLink?: boolean
    /* true if the keyhint is an icon and not text */
    icon?: boolean
    end?: boolean
}

export default function SidebarItem({ externalLink, space, keyHint, name, to, children, modal, onClick, icon, end }: Props) {
    const classes = "hover:cursor-pointer hover:bg-(--color-bg-tertiary) transition duration-100 rounded-md p-2 inline-block";
    const activeClasses = "bg-(--color-bg-tertiary) color-fg";

    const popupInner = keyHint ? (
        <div className="flex items-center gap-2">
            <span>{name}</span>
            {icon ?
            <div>
                {keyHint}
            </div>
            :
            <kbd className="px-1 text-sm rounded bg-(--color-bg-tertiary) text-(--color-fg) border border-[var(--color-fg)]">
                {keyHint}
            </kbd>
            }
        </div>
    ) : name;

    return (
        <>
            <Popup position="right" space={space ?? 20} inner={popupInner}>
                {to ? (
                    <NavLink
                        target={externalLink ? "_blank" : ""}
                        className={({ isActive }) => `${classes} ${isActive && !externalLink ? activeClasses : ""}`}
                        to={to}
                        end={end}
                    >{children}</NavLink>
                ) : (
                    <a className={classes} onClick={() => onClick()}>{children}</a>
                )}
            </Popup>
            {modal}
        </>
    );
}
