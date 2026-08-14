"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import getEcho from '@/lib/echo';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { OrderDetailsModal } from './OrderDetailsModal';
import { KanbanSettingsModal } from './SettingsModal';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';

export const RealtimeKanbanBoard = ({ user, filterType = 'realtime' }) => {
    const t = useTranslations('vendor');
    
    const [columns, setColumns] = useState({
        pending: [],
        scheduled: [],
        preparing: [],
        ready: [],
        dispatched: [],
        completed: [],
        rejected: []
    });
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    
    const [activeId, setActiveId] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);
    const [activeColumnId, setActiveColumnId] = useState(null);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedColumn, setSelectedColumn] = useState(null);
    
    const [otpValue, setOtpValue] = useState('');
    
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [receiveOrdersVia, setReceiveOrdersVia] = useState(user?.receive_orders_via || 'mobile');
    const [dashboardAcceptance, setDashboardAcceptance] = useState(user?.dashboard_order_acceptance || 'manual');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const [showInstructions, setShowInstructions] = useState(false);

    // Hardcoded audio for now (will be updated when assets are provided)
    const notificationAudio = useRef(null);
    const newOrderAudio = useRef(null);

    const columnKeys = [
        'pending',
        ...(user?.user_type_id === 8 ? ['scheduled'] : []), // Only if user_type_id == 8
        'preparing', 'ready', 'dispatched', 'completed', 'rejected'
    ];

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchOrders();
        setupAudio();
    }, []);

    useEffect(() => {
        if (!user) return;
        const cleanup = initWebSockets();
        
        return () => {
            if (cleanup) cleanup();
        };
    }, [user?.id]);

    const setupAudio = () => {
        notificationAudio.current = new Audio('/audios/notification_message-notification-alert-4-331722.mp3');
        newOrderAudio.current = new Audio('/audios/universfield-ringtone-021-365652.mp3');
        
        const unlock = () => {
            if (notificationAudio.current) notificationAudio.current.play().then(() => { notificationAudio.current.pause(); notificationAudio.current.currentTime = 0; }).catch(()=>{});
            if (newOrderAudio.current) newOrderAudio.current.play().then(() => { newOrderAudio.current.pause(); newOrderAudio.current.currentTime = 0; }).catch(()=>{});
        };
        
        document.addEventListener('click', unlock, { once: true, capture: true });
    };

    const fetchOrders = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const endpoint = filterType === 'scheduled' 
                ? '/order-management/orders/kanban/fetch?type=scheduled' 
                : '/order-management/orders/kanban/fetch';
            const res = await axiosInstance.get(endpoint);
            if (res.data?.success) {
                setColumns(res.data.columns);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
            // Ignore error gracefully, might need to rely on old endpoints
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const initWebSockets = () => {
        const echo = getEcho;
        console.log('KanbanBoard: initWebSockets called. echo:', !!echo, 'user:', !!user);
        if (!echo || !user) return;

        const channelName = `vendor.${user.id}.orders`;
        console.log('KanbanBoard: subscribing to channel:', channelName);

        // Set initial state
        console.log('KanbanBoard: initial state:', echo.connector?.pusher?.connection?.state);
        if (echo.connector?.pusher?.connection?.state === 'connected') {
            setConnected(true);
        }

        const handleStateChange = (states) => {
            console.log('KanbanBoard: state_change event:', states);
            setConnected(states.current === 'connected');
        };

        if (echo.connector?.pusher?.connection) {
            echo.connector.pusher.connection.bind('state_change', handleStateChange);
        }

        echo.private(channelName)
            .listen('.OrderStatusUpdated', (e) => {
                console.log('KanbanBoard: OrderStatusUpdated EVENT RECEIVED!', e);
                const { order, type } = e;
                if (!order) return;
                
                // Audio and badging
                if (type === 'new') {
                    if (newOrderAudio.current) newOrderAudio.current.play().catch(()=>{});
                    toast.success('New Order Arrived!', {
                        description: `Order #${order.order_id}`,
                        action: {
                            label: 'View',
                            onClick: () => setSelectedOrder(order)
                        },
                    });
                } else {
                    if (notificationAudio.current) notificationAudio.current.play().catch(()=>{});
                    toast.info('Order Status Updated', {
                        description: `Order #${order.order_id}`,
                        action: {
                            label: 'View',
                            onClick: () => setSelectedOrder(order)
                        },
                    });
                }

                // Add badging to order object
                const updatedOrder = { ...order, isNewUpdate: true, updateType: type };

                setColumns(prev => {
                    const newCols = { ...prev };
                    
                    // Remove from old column if exists
                    Object.keys(newCols).forEach(col => {
                        newCols[col] = newCols[col].filter(o => o.order_id !== updatedOrder.order_id);
                    });

                    // Add to new column
                    const targetCol = (updatedOrder.is_scheduled && user?.user_type_id === 8 && updatedOrder.status_raw === 1) ? 'scheduled' : getColumnFromStatus(updatedOrder.status_raw);
                    
                    if (newCols[targetCol]) {
                        newCols[targetCol] = [updatedOrder, ...newCols[targetCol]];
                    }

                    return newCols;
                });

                // Remove badge after 4s
                setTimeout(() => {
                    setColumns(prev => {
                        const newCols = { ...prev };
                        const targetCol = getColumnFromStatus(updatedOrder.status_raw);
                        if (newCols[targetCol]) {
                            newCols[targetCol] = newCols[targetCol].map(o => 
                                o.order_id === updatedOrder.order_id ? { ...o, isNewUpdate: false } : o
                            );
                        }
                        return newCols;
                    });
                }, 4000);
            });

        return () => {
            if (echo.connector?.pusher?.connection) {
                echo.connector.pusher.connection.unbind('state_change', handleStateChange);
            }
            echo.leave(channelName);
        };
    };

    const getColumnFromStatus = (statusId) => {
        if (typeof statusId === 'string') {
            const status = statusId.toLowerCase();
            if (['pending', 'payment_completed'].includes(status)) return 'pending';
            if (['accepted', 'processing'].includes(status)) return 'preparing';
            if (['ready_for_delivery', 'waiting_for_batch', 'ready_for_pickup'].includes(status)) return 'ready';
            if (['dispatched', 'sent_to_logistics', 'picked_from_store', 'in_transit', 'driver_accepted'].includes(status)) return 'dispatched';
            if (['completed', 'delivered', 'completed_closed', 'picked_up'].includes(status)) return 'completed';
            if (['rejected', 'cancelled', 'returned'].includes(status)) return 'rejected';
        }

        // Fallback for older integer statuses if they exist
        switch (parseInt(statusId)) {
            case 1: return 'pending';
            case 2: return 'preparing';
            case 3: return 'ready';
            case 4: return 'dispatched';
            case 5: return 'completed';
            case 6: return 'rejected';
            default: return 'pending';
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
        
        // Find over column (could be dragging over another card or empty column)
        let overColumn = over.data.current?.columnId;
        if (!overColumn) {
            if (columnKeys.includes(overId)) overColumn = overId;
            else return; // Can't figure out target
        }

        if (activeColumn === overColumn) return; // Didn't move between columns

        // Disallow moving backward or skipping steps (enforce logic similar to backend)
        const orderIndex = ['pending', 'scheduled', 'preparing', 'ready', 'dispatched', 'completed', 'rejected'];
        const fromIdx = orderIndex.indexOf(activeColumn);
        const toIdx = orderIndex.indexOf(overColumn);

        const activeItem = active.data.current?.order;

        if (overColumn === 'completed' && activeItem?.request_deligate === 2) {
            toast.info(t('otp_required', 'Please enter OTP'));
            setSelectedOrder(activeItem);
            setSelectedColumn(activeColumn);
            return;
        }
        
        // Optimistic Update
        setColumns(prev => {
            const next = { ...prev };
            next[activeColumn] = next[activeColumn].filter(o => o.order_id !== activeId);
            next[overColumn] = [activeItem, ...next[overColumn]];
            return next;
        });

        try {
            const res = await axiosInstance.post('/order-management/orders/kanban/status', {
                order_id: activeId,
                status: overColumn, // e.g. "preparing"
            });
            
            if (!res.data?.success) {
                if (res.data?.requires_otp) {
                    toast.info(res.data?.message || t('otp_required', 'Please enter OTP'));
                    setSelectedOrder(activeItem);
                    setSelectedColumn(activeColumn);
                } else {
                    toast.error(res.data?.message || t('error_occurred', 'An error occurred'));
                }
                // Revert manually
                setColumns(prev => {
                    const next = { ...prev };
                    next[overColumn] = next[overColumn].filter(o => o.order_id !== activeId);
                    next[activeColumn] = [activeItem, ...next[activeColumn]];
                    return next;
                });
            } else {
                toast.success(t('order_status_updated', 'Order Status Updated'));
            }
        } catch (error) {
            toast.error(t('error_occurred', 'An error occurred'));
            // Revert manually
            setColumns(prev => {
                const next = { ...prev };
                next[overColumn] = next[overColumn].filter(o => o.order_id !== activeId);
                next[activeColumn] = [activeItem, ...next[activeColumn]];
                return next;
            });
        }
    };

    const handleCardClick = (order, column) => {
        setSelectedOrder(order);
        setSelectedColumn(column);
    };

    const handleAcceptOrder = () => {
        if (!selectedOrder) return;
        const targetCol = (selectedOrder.is_scheduled && user?.user_type_id === 8) ? 'scheduled' : 'preparing';
        moveOrderApi(selectedOrder.order_id, selectedColumn, targetCol);
        setSelectedOrder(null);
    };

    const handleRejectOrder = () => {
        if (!selectedOrder) return;
        moveOrderApi(selectedOrder.order_id, selectedColumn, 'rejected');
        setSelectedOrder(null);
    };

    const moveOrderApi = async (orderId, fromCol, toCol, extraData = {}) => {
        // Optimistic UI
        const order = columns[fromCol].find(o => o.order_id === orderId);
        if (!order) return;

        setColumns(prev => {
            const next = { ...prev };
            next[fromCol] = next[fromCol].filter(o => o.order_id !== orderId);
            next[toCol] = [order, ...next[toCol]];
            return next;
        });

        try {
            const res = await axiosInstance.post('/order-management/orders/kanban/status', {
                order_id: orderId,
                status: toCol,
                ...extraData
            });
            if (!res.data?.success) {
                if (res.data?.requires_otp) {
                    toast.info(res.data?.message || t('otp_required', 'Please enter OTP'));
                    setSelectedOrder(order);
                    setSelectedColumn(fromCol);
                } else {
                    toast.error(res.data?.message || t('error_occurred'));
                }
                // Revert optimistic update manually
                setColumns(prev => {
                    const next = { ...prev };
                    next[toCol] = next[toCol].filter(o => o.order_id !== orderId);
                    next[fromCol] = [order, ...next[fromCol]];
                    return next;
                });
            } else {
                toast.success(t('success'));
            }
        } catch (e) {
            // Revert optimistic update manually
            setColumns(prev => {
                const next = { ...prev };
                next[toCol] = next[toCol].filter(o => o.order_id !== orderId);
                next[fromCol] = [order, ...next[fromCol]];
                return next;
            });
            toast.error(t('error_occurred'));
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const res = await axiosInstance.post('/api/v1/vendor/profile/order_settings', {
                receive_orders_via: receiveOrdersVia,
                dashboard_order_acceptance: dashboardAcceptance
            });
            if (res.data?.status == 1 || res.data?.success) {
                toast.success(res.data?.message || t('settings_updated', 'Settings updated'));
                setSettingsOpen(false);
            } else {
                toast.error(res.data?.message || t('error_occurred'));
            }
        } catch (e) {
            toast.error(t('error_occurred'));
        } finally {
            setIsSavingSettings(false);
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

    return (
        <div className="p-5 font-sans min-h-[calc(100vh-100px)] w-full max-w-full overflow-x-hidden">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold m-0 text-slate-800 dark:text-slate-200">
                        {filterType === 'scheduled' ? t('scheduled_orders', 'Scheduled Orders') : t('realtime_kanban', 'Real-Time Kanban')}
                    </h2>
                    <p className="m-0 mt-1 text-slate-500 dark:text-slate-400">{t('drag_and_drop_orders', 'Drag and drop orders to update their status')}</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-200 px-3 py-1.5 rounded-full font-bold text-slate-700 dark:text-slate-200 text-sm">
                        <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                        <span>{connected ? t('connected', 'Connected') : t('disconnected', 'Disconnected')}</span>
                    </div>
                    
                    <button 
                        onClick={() => setSettingsOpen(true)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        title={t('order_settings', 'Order Settings')}
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 shadow-sm overflow-hidden">
                <div 
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <h3 className="m-0 text-[1.1rem] text-teal-600 font-bold">
                        {t('kanban_info_title', '🚀 Professional Order Management… From a Single Screen')}
                    </h3>
                    <div className="flex items-center text-slate-500 dark:text-slate-400 gap-2">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full ${!showInstructions ? 'bg-teal-600 text-white animate-pulse' : ''}`}>
                            {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                        <span className="text-sm font-medium">
                            {showInstructions ? t('hide_instructions', 'Hide Instructions') : t('show_instructions', 'Show Instructions')}
                        </span>
                    </div>
                </div>

                {showInstructions && (
                    <div className="p-6 text-[0.95rem] text-slate-700 dark:text-slate-300 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                        <p className="mt-0 text-[1.05rem] font-semibold">{t('kanban_info_desc_new', 'Choose the method that suits your business volume.')}</p>
                        
                        <div className="my-5 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                            <p className="m-0 mb-3 text-[1.05rem]">{t('kanban_info_app_desc_new', '📲 Receive orders directly via the app.')}</p>
                            <div className="my-3 font-bold text-slate-400">{t('kanban_info_or', 'OR')}</div>
                            <p className="m-0 mb-3 text-[1.05rem]">{t('kanban_info_dash_desc_new', '🖥️ Move order management to the dashboard and track all your orders from a single screen with greater speed and organization.')}</p>
                        </div>
                        
                        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div className="mb-2 text-[1rem]">⚡ {t('kanban_info_dash_ideal', 'Ideal for stores that receive large volumes of orders daily.')}</div>
                            <div className="text-[1rem]">🎥 {t('kanban_info_app_video', 'The app remains dedicated to live streaming, videos, and messages.')}</div>
                        </div>
                        
                        <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                            <p className="m-0 mb-4 font-semibold text-[1.05rem]">⚙️ {t('kanban_info_choose_acceptance', 'You can also choose:')}</p>
                            <div className="flex flex-wrap gap-4 mb-5 items-center">
                                <span className="bg-slate-100 dark:bg-slate-800 px-5 py-2 rounded-full text-[1rem] font-semibold">✋ {t('kanban_info_acceptance_manual_new', 'Accept orders manually')}</span>
                                <span className="font-bold text-slate-400">{t('kanban_info_or', 'OR')}</span>
                                <span className="bg-slate-100 dark:bg-slate-800 px-5 py-2 rounded-full text-[1rem] font-semibold">🤖 {t('kanban_info_acceptance_auto_new', 'Accept them automatically')}</span>
                            </div>
                            
                            <p className="m-0 font-bold text-[1.05rem] text-teal-600">
                                {t('kanban_info_settings_hint_new', 'Click on Settings ⚙️ and choose the method that suits you')}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modern Statistics Summary */}
            <div className="flex gap-4 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                {columnKeys.map(key => {
                    const getStatColor = (k) => {
                        switch(k) {
                            case 'pending': return 'text-amber-500 from-amber-500/10 to-amber-500/5';
                            case 'scheduled': return 'text-blue-500 from-blue-500/10 to-blue-500/5';
                            case 'preparing': return 'text-indigo-500 from-indigo-500/10 to-indigo-500/5';
                            case 'ready': return 'text-pink-500 from-pink-500/10 to-pink-500/5';
                            case 'dispatched': return 'text-violet-500 from-violet-500/10 to-violet-500/5';
                            case 'completed': return 'text-emerald-500 from-emerald-500/10 to-emerald-500/5';
                            case 'rejected': return 'text-rose-500 from-rose-500/10 to-rose-500/5';
                            default: return 'text-slate-500 from-slate-500/10 to-slate-500/5';
                        }
                    };
                    const colorClasses = getStatColor(key);
                    const textColor = colorClasses.split(' ')[0];
                    const bgGradient = colorClasses.split(' ').slice(1).join(' ');

                    return (
                        <div 
                            key={key} 
                            className="relative min-w-[150px] flex-1 overflow-hidden bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl p-5 flex justify-between items-end shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 group"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bgGradient} rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500`}></div>
                            <span className="text-slate-500 dark:text-slate-400 font-medium text-sm z-10">{t(key)}</span>
                            <span className={`text-3xl font-black tracking-tight ${textColor} z-10`}>
                                {columns[key]?.length || 0}
                            </span>
                        </div>
                    );
                })}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-5 overflow-x-auto pb-5 items-start w-full">
                    {columnKeys.map(key => (
                        <KanbanColumn 
                            key={key} 
                            id={key} 
                            title={t(key)} 
                            orders={columns[key] || []} 
                            onCardClick={handleCardClick}
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
                onAccept={handleAcceptOrder}
                onReject={handleRejectOrder}
                otpValue={otpValue}
                onOtpChange={setOtpValue}
                onCompleteOtp={() => {
                    moveOrderApi(selectedOrder.order_id, selectedColumn, 'completed', { otp: otpValue });
                    setSelectedOrder(null);
                    setOtpValue('');
                }}
            />

            <KanbanSettingsModal 
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                receiveOrdersVia={receiveOrdersVia}
                setReceiveOrdersVia={setReceiveOrdersVia}
                dashboardOrderAcceptance={dashboardAcceptance}
                setDashboardOrderAcceptance={setDashboardAcceptance}
                onSave={handleSaveSettings}
                isSaving={isSavingSettings}
            />
        </div>
    );
};
