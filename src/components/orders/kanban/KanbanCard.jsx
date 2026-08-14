"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';

export const KanbanCard = ({ order, columnId, isOverlay = false, onClick }) => {
    const t = useTranslations('vendor');

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: order.order_id,
        data: {
            type: 'Order',
            order,
            columnId,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    if (isDragging && !isOverlay) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 h-[180px] opacity-40"
            />
        );
    }

    const isScheduled = order.is_scheduled;
    const nowTimestamp = Math.floor(Date.now() / 1000);
    const isShaking = isScheduled && (order.scheduled_timestamp - nowTimestamp <= 3600) && columnId === 'scheduled';

    const getBgColor = (col) => {
        switch (col) {
            case 'pending': return 'bg-[#fef3c7] dark:bg-amber-900/40 text-[#d97706] dark:text-amber-400';
            case 'scheduled': return 'bg-[#f3e8ff] dark:bg-purple-900/40 text-[#7e22ce] dark:text-purple-400';
            case 'preparing': return 'bg-[#dbeafe] dark:bg-blue-900/40 text-[#2563eb] dark:text-blue-400';
            case 'ready': return 'bg-[#fce7f3] dark:bg-pink-900/40 text-[#db2777] dark:text-pink-400';
            case 'dispatched': return 'bg-[#e0e7ff] dark:bg-indigo-900/40 text-[#4f46e5] dark:text-indigo-400';
            case 'completed': return 'bg-[#d1fae5] dark:bg-emerald-900/40 text-[#059669] dark:text-emerald-400';
            case 'rejected': return 'bg-[#fee2e2] dark:bg-red-900/40 text-[#ef4444] dark:text-red-400';
            default: return 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300';
        }
    };

    return (
        <div
            ref={isOverlay ? null : setNodeRef}
            style={style}
            {...(isOverlay ? {} : attributes)}
            {...(isOverlay ? {} : listeners)}
            onClick={(e) => {
                // Prevent drag click from firing
                if (e.defaultPrevented) return;
                onClick(order, columnId);
            }}
            className={`
                bg-white dark:bg-slate-800 border rounded-lg p-4 shadow-sm cursor-grab active:cursor-grabbing relative touch-none
                transition-all duration-200 hover:shadow-md
                ${isOverlay ? 'shadow-xl scale-105 border-slate-300 dark:border-slate-600 ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-700'}
                ${isShaking ? 'animate-[gentle-shake_2s_infinite] border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : ''}
            `}
        >
            <div className="flex justify-between items-center mb-2 text-[0.85rem] text-slate-500 dark:text-slate-400">
                <div className="font-semibold text-slate-800 dark:text-slate-200">#{order.order_id}</div>
                <div className="flex items-center gap-2">
                    {order.isNewUpdate && (
                        <span className={`inline-flex items-center justify-center whitespace-nowrap text-[0.75rem] px-2 py-0.5 rounded-full font-bold ${order.updateType === 'new' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'}`}>
                            {order.updateType === 'new' ? t('new_order_received', 'New Order') : t('order_status_changed', 'Status Changed')}
                        </span>
                    )}
                    <span>{order.time_ago}</span>
                </div>
            </div>

            <div className="font-semibold text-[1rem] text-slate-900 dark:text-slate-100 mb-1">
                {order.customer_name}
                {order.customer_phone && <span className="text-[0.75rem] text-slate-500 dark:text-slate-400 font-normal ml-2">({order.customer_phone})</span>}
            </div>
            {order.store_name && (
                <div className="text-[0.8rem] text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {order.store_name}
                </div>
            )}

            <div className="mt-1.5 text-[0.85rem] text-slate-500 dark:text-slate-400 leading-snug">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{order.items_count} {t('items', 'Items')}: </span>
                {order.items_summary}
            </div>

            {isScheduled && (
                <div className="text-[0.75rem] text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-1 rounded inline-flex items-center gap-1 font-semibold mt-2">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{order.scheduled_date_text || order.scheduled_date}</span>
                </div>
            )}

            <div className="flex justify-between items-center mt-3">
                <div className="font-bold text-teal-600 dark:text-teal-400 text-[1.1rem] flex items-center gap-1">
                    SAR {order.total}
                </div>
                <div className="flex items-center gap-1.5">
                    {order.has_complaint && (
                        <a 
                            href={order.complaint_url} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()} 
                            className="text-[0.75rem] px-2 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/50 font-bold inline-flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('complaint', 'Complaint')}
                        </a>
                    )}
                    <span className={`px-2 py-1 rounded-full text-[0.75rem] font-bold capitalize ${getBgColor(columnId)}`}>
                        {order.delivery_type}
                    </span>
                </div>
            </div>
        </div>
    );
};
