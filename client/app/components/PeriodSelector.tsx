import { useEffect } from "react"

interface Props {
    setter: Function
    current: string
    disableCache?: boolean
}

export default function PeriodSelector({ setter, current, disableCache = false }: Props) {
    const periods = [
        { value: 'day', label: 'Last day' },
        { value: 'week', label: 'Last week' },
        { value: 'month', label: 'Last month' },
        { value: 'year', label: 'Last year' },
    ]

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
        <div className="flex flex-wrap items-center gap-2">
            {periods.map((p) => (
                <button 
                    key={`period_setter_${p.value}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                        p.value === current 
                            ? 'bg-(--color-bg-tertiary) text-(--color-fg) border-(--color-fg-tertiary)' 
                            : 'bg-transparent text-(--color-fg-secondary) border-(--color-bg-tertiary) hover:bg-(--color-bg-tertiary) hover:text-(--color-fg)'
                    }`}
                    onClick={() => setPeriod(p.value)}
                >
                    {p.label}
                </button>
            ))}
        </div>
    )
}
