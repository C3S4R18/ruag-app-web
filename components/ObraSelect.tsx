'use client'

/**
 * Selector de Obra / Centro de Costo desde la lista maestra (public.obras).
 *
 *  - Lista cargada una sola vez al montar.
 *  - Buscador por número de CC o por nombre (case-insensitive, sin tildes).
 *  - Solo se puede SELECCIONAR de la lista: no se permite texto libre,
 *    para evitar los duplicados que ya tenía la BD.
 *  - Estilo coherente con los inputs del wizard.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ChevronDown, Search, Check, Loader2, Building2, X } from 'lucide-react'

type Obra = { id: string; numero: string; nombre: string }

const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function ObraSelect({
    label = 'Obra / Proyecto',
    value,
    onChange,
    required = false,
    disabled = false,
    className = '',
}: {
    label?: string
    value: string | null | undefined
    onChange: (val: string) => void
    required?: boolean
    disabled?: boolean
    className?: string
}) {
    const supabase = useMemo(() => createClient(), [])
    const [obras, setObras] = useState<Obra[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            const { data, error } = await supabase
                .from('obras')
                .select('id, numero, nombre')
                .order('numero', { ascending: false })
            if (cancelled) return
            if (!error && data) {
                setObras(data as Obra[])
            }
            setLoading(false)
        })()
        return () => { cancelled = true }
    }, [supabase])

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 60)
        else setQuery('')
    }, [open])

    const filtered = useMemo(() => {
        const q = normalize(query.trim())
        if (!q) return obras
        return obras.filter(o => normalize(`${o.numero} ${o.nombre}`).includes(q))
    }, [obras, query])

    const selected = obras.find(o => o.nombre === value)
    const isMissing = !!value && !selected   // texto antiguo que no está en la lista maestra

    return (
        <div className={className} ref={containerRef}>
            <label className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                <span>{label} {required && <span className="text-red-500">*</span>}</span>
                {isMissing && <span className="normal-case tracking-normal text-[10px] font-bold text-amber-600">⚠ no está en la lista</span>}
            </label>

            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(v => !v)}
                className={`w-full p-3.5 rounded-xl border outline-none transition-all font-medium text-sm flex items-center justify-between gap-2 ${
                    disabled
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : selected
                            ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300 shadow-sm'
                            : isMissing
                                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:border-slate-300 shadow-sm'
                } ${open ? 'ring-2 ring-slate-200' : ''}`}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 size={16} className="shrink-0 text-slate-400"/>
                    {selected ? (
                        <span className="truncate"><span className="font-mono text-[11px] text-slate-500 mr-1.5 bg-slate-200 px-1.5 py-0.5 rounded">{selected.numero}</span>{selected.nombre}</span>
                    ) : value ? (
                        <span className="truncate italic">{value}</span>
                    ) : (
                        <span>Selecciona la obra…</span>
                    )}
                </div>
                <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
            </button>

            {open && (
                <div className="relative">
                    <div className="absolute top-2 left-0 right-0 z-50 bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200 overflow-hidden">
                        <div className="p-2 border-b border-slate-100 bg-slate-50/60">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Buscar por número o nombre…"
                                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400"
                                />
                                {query && (
                                    <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100">
                                        <X size={12} className="text-slate-400"/>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto">
                            {loading ? (
                                <div className="p-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
                                    <Loader2 size={14} className="animate-spin"/> Cargando obras…
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-xs">
                                    <p className="font-bold">Sin resultados</p>
                                    <p className="mt-1 text-slate-300">Si tu obra no aparece, pide al admin que la agregue a la lista maestra.</p>
                                </div>
                            ) : (
                                filtered.map(o => {
                                    const isSel = o.nombre === value
                                    return (
                                        <button
                                            key={o.id}
                                            type="button"
                                            onClick={() => { onChange(o.nombre); setOpen(false) }}
                                            className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors ${isSel ? 'bg-emerald-50/60' : ''}`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">{o.numero}</span>
                                                <span className="text-sm font-medium text-slate-700 truncate">{o.nombre}</span>
                                            </div>
                                            {isSel && <Check size={14} className="text-emerald-600 shrink-0"/>}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/60 text-[10px] text-slate-400">
                            {obras.length} obras en la lista maestra
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
