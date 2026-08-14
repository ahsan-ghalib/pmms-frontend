"use client";

import React from 'react';
import { useTranslations } from "next-intl";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { CalendarX } from 'lucide-react';

export const KanbanColumn = ({ id, title, orders, onCardClick, isScheduled = false }) => {
    const t = useTranslations("admin");
    const { setNodeRef } = useDroppable({
        id: id,
    });

    const getColBg = (col) => {
        if (isScheduled) {
            if (col === 'today') return 'bg-[#fffbeb] border-[#fde68a] dark:bg-amber-900/20 dark:border-amber-700/30';
            if (col === 'tomorrow') return 'bg-[#faf5ff] border-[#e9d5ff] dark:bg-purple-900/20 dark:border-purple-700/30';
            if (col === 'rejected') return 'bg-[#fef2f2] border-[#fecaca] dark:bg-red-900/20 dark:border-red-700/30';
            return 'bg-[#f0f9ff] border-[#bae6fd] dark:bg-sky-900/20 dark:border-sky-700/30'; // blueish for dates
        }
        
        switch (col) {
            case 'pending': return 'bg-[#fffbeb] border-[#fde68a] dark:bg-amber-900/20 dark:border-amber-700/30';
            case 'scheduled': return 'bg-[#faf5ff] border-[#e9d5ff] dark:bg-purple-900/20 dark:border-purple-700/30';
            case 'preparing': return 'bg-[#eff6ff] border-[#bfdbfe] dark:bg-blue-900/20 dark:border-blue-700/30';
            case 'ready': return 'bg-[#fdf2f8] border-[#fbcfe8] dark:bg-pink-900/20 dark:border-pink-700/30';
            case 'dispatched': return 'bg-[#eef2ff] border-[#c7d2fe] dark:bg-indigo-900/20 dark:border-indigo-700/30';
            case 'completed': return 'bg-[#ecfdf5] border-[#a7f3d0] dark:bg-emerald-900/20 dark:border-emerald-700/30';
            case 'rejected': return 'bg-[#fef2f2] border-[#fecaca] dark:bg-red-900/20 dark:border-red-700/30';
            default: return 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700';
        }
    };

    const getBadgeBg = (col) => {
        if (isScheduled) {
            if (col === 'today') return 'bg-[#fef3c7] dark:bg-amber-900/40 text-[#d97706] dark:text-amber-400';
            if (col === 'tomorrow') return 'bg-[#f3e8ff] dark:bg-purple-900/40 text-[#7e22ce] dark:text-purple-400';
            if (col === 'rejected') return 'bg-[#fee2e2] dark:bg-red-900/40 text-[#ef4444] dark:text-red-400';
            return 'bg-[#e0f2fe] dark:bg-sky-900/40 text-[#0284c7] dark:text-sky-400';
        }

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
        <div className={`flex flex-col min-w-[320px] w-[320px] border rounded-xl shadow-sm ${getColBg(id)}`}>
            {/* Header */}
            <div className="p-4 border-b border-black/5 dark:border-white/5 font-bold flex justify-between items-center rounded-t-xl bg-white/40 dark:bg-slate-900/60">
                <span className="capitalize text-slate-800 dark:text-slate-200 text-[0.95rem]">{title}</span>
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[0.85rem] font-bold ${getBadgeBg(id)}`}>
                    {orders.length}
                </span>
            </div>

            {/* Content Area */}
            <div 
                ref={setNodeRef}
                className="p-4 flex-1 overflow-y-auto min-h-[150px] flex flex-col gap-3"
            >
                {orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500 opacity-70 mt-10">
                        <CalendarX className="w-10 h-10 mb-2 stroke-[1.5]" />
                        <span className="text-sm font-medium">{t("No_orders_scheduled", { defaultMessage: "No orders scheduled." })}</span>
                    </div>
                )}
                
                <SortableContext 
                    items={orders.map(o => o.order_id)} 
                    strategy={verticalListSortingStrategy}
                >
                    {orders.map((order) => (
                        <KanbanCard 
                            key={order.order_id} 
                            order={order} 
                            columnId={id} 
                            onClick={onCardClick} 
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};
