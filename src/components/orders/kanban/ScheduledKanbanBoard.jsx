"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
    DndContext, 
    DragOverlay, 
    closestCorners, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors 
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import axiosInstance from '@/lib/axios';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { OrderDetailsModal } from './OrderDetailsModal';
import { toast } from 'sonner';

export const ScheduledKanbanBoard = ({ user }) => {
    const t = useTranslations('vendor');
    
    // Generate next 7 days
    const generateColumns = () => {
        const cols = {};
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            let key = date.toISOString().split('T')[0];
            let title = '';
            let colId = key;
            
            if (i === 0) {
                colId = 'today';
                title = t('today', { defaultMessage: 'Today' });
            } else if (i === 1) {
                colId = 'tomorrow';
                title = t('tomorrow', { defaultMessage: 'Tomorrow' });
            } else {
                const options = { weekday: 'long', month: 'short', day: '2-digit' };
                title = date.toLocaleDateString('en-US', options); // We might need localization here later
            }
            
            cols[colId] = {
                title,
                orders: []
            };
        }
        
        // Add rejected tab
        cols['rejected'] = {
            title: t('rejected', { defaultMessage: 'Rejected' }),
            orders: []
        };
        
        return cols;
    };

    const [columns, setColumns] = useState(generateColumns());
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);
    const [activeColumnId, setActiveColumnId] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedColumn, setSelectedColumn] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/api/v1/vendor/orders/scheduled/fetch');
            if (res.data?.success && res.data?.columns) {
                // Merge fetched data with our generated columns
                setColumns(prev => {
                    const next = { ...prev };
                    Object.keys(res.data.columns).forEach(key => {
                        if (next[key]) {
                            next[key].orders = res.data.columns[key];
                        }
                    });
                    return next;
                });
            }
        } catch (error) {
            console.error("Failed to fetch scheduled orders", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);
        setActiveOrder(active.data.current?.order);
        setActiveColumnId(active.data.current?.columnId);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveOrder(null);
        setActiveColumnId(null);

        if (!over) return;

        const activeId = active.id;
        const activeColumn = active.data.current?.columnId;
        const overId = over.id;
        
        let overColumn = over.data.current?.columnId;
        if (!overColumn) {
            if (columns[overId]) overColumn = overId;
            else return;
        }

        if (activeColumn === overColumn) return;

        const activeItem = active.data.current?.order;
        
        setColumns(prev => {
            const next = { ...prev };
            next[activeColumn].orders = next[activeColumn].orders.filter(o => o.order_id !== activeId);
            next[overColumn].orders = [activeItem, ...next[overColumn].orders];
            return next;
        });

        try {
            let res;
            if (overColumn === 'rejected') {
                res = await axiosInstance.post('/api/v1/vendor/orders/kanban/status', {
                    order_id: activeId,
                    status: 'rejected'
                });
            } else {
                res = await axiosInstance.post('/api/v1/vendor/orders/scheduled/reschedule', {
                    order_id: activeId,
                    target_date: overColumn === 'today' ? new Date().toISOString().split('T')[0] 
                               : overColumn === 'tomorrow' ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
                               : overColumn
                });
            }
            
            if (!res.data?.success) {
                toast.error(res.data?.message || t('error_occurred'));
                fetchOrders(); 
            } else {
                toast.success(overColumn === 'rejected' ? t('order_status_updated') : t('order_rescheduled', 'Order Rescheduled'));
            }
        } catch (error) {
            toast.error(t('error_occurred'));
            fetchOrders();
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                <p className="mt-4 text-slate-500 dark:text-slate-400">{t('loading_orders', 'Loading orders...')}</p>
            </div>
        );
    }

    const tomorrowOrdersCount = columns['tomorrow']?.orders?.length || 0;
    const totalUpcoming = Object.keys(columns).reduce((acc, key) => acc + (columns[key].orders?.length || 0), 0) - (columns['today']?.orders?.length || 0);

    return (
        <div className="p-5 font-sans min-h-[calc(100vh-100px)] w-full max-w-full overflow-x-hidden">
            <div className="flex flex-wrap justify-between items-start mb-6 gap-4 my-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
                <div>
                    <h2 className="text-2xl font-bold m-0 text-slate-800 dark:text-white">{t('scheduled_orders', 'Scheduled Orders')}</h2>
                    <p className="m-0 mt-1 text-slate-500 dark:text-slate-400 font-medium text-sm">
                        {t('orders_tomorrow_count', 'Orders scheduled for delivery tomorrow:')} <span className="font-bold text-slate-800 dark:text-white">{tomorrowOrdersCount}</span> | {t('total_upcoming', 'Total upcoming:')} <span className="font-bold text-slate-800 dark:text-white">{totalUpcoming}</span>
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 backdrop-blur-sm px-3 py-1.5 rounded-full font-bold text-slate-700 dark:text-slate-300 text-sm shadow-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span>{t('connected', 'Connected')}</span>
                    </div>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-5 overflow-x-auto pb-5 items-start w-full">
                    {Object.keys(columns).map(key => (
                        <KanbanColumn 
                            key={key} 
                            id={key} 
                            title={columns[key].title} 
                            orders={columns[key].orders} 
                            onCardClick={(order) => { setSelectedOrder(order); setSelectedColumn(key); }}
                            isScheduled={true}
                        />
                    ))}
                </div>
                
                <DragOverlay>
                    {activeId ? (
                        <KanbanCard 
                            order={activeOrder} 
                            columnId={activeColumnId} 
                            isOverlay={true} 
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <OrderDetailsModal 
                isOpen={!!selectedOrder}
                order={selectedOrder}
                column={selectedColumn}
                onClose={() => setSelectedOrder(null)}
            />
        </div>
    );
};
