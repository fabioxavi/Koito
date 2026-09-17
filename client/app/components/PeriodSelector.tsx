import { useEffect } from "react"

interface Props {
    setter: Function
    current: string
    disableCache?: boolean
}

export default function PeriodSelector({ setter, current, disableCache = false }: Props) {
    const periods = ['day', 'week', 'month', 'year', 'all_time']

    const periodDisplay = (str: string) => {
        return str.split('_').map(w => w.split('').map((char, index) =>
            index === 0 ? char.toUpperCase() : char).join('')).join(' ')
    }

    const setPeriod = (val: string) => {
        setter(val)
        if (!disableCache) {
            localStorage.setItem('period_selection_'+window.location.pathname.split('/')[1], val)
        }
    }

    useEffect(() => {
        if (!disableCache) {
            const cached = localStorage.getItem('period_selection_' + window.location.pathname.split('/')[1]);
            if (cached) {
              setter(cached);
            }
        }
      }, []);

    return (
        <div className="flex flex-wrap items-center gap-2 grow-0 text-sm sm:text-[16px]">
            <p className="text-(--color-fg-secondary) pr-1">Showing stats for:</p>
            <div className="flex flex-wrap gap-1 rounded-full bg-(--color-bg-tertiary)/40 p-1">
                {periods.map((p) => (
                    <button
                        key={`period_setter_${p}`}
                        className={`period-selector rounded-full px-3 py-1 transition-colors ${
                            p === current
                                ? "bg-(--color-bg-tertiary) color-fg"
                                : "color-fg-secondary hover:text-(--color-fg)"
                        }`}
                        onClick={() => setPeriod(p)}
                        disabled={p === current}
                    >
                        {periodDisplay(p)}
                    </button>
                ))}
            </div>
        </div>
    )
}
