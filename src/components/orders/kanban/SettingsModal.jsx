"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

export const KanbanSettingsModal = ({ 
    isOpen, 
    onClose, 
    receiveOrdersVia, 
    setReceiveOrdersVia, 
    dashboardOrderAcceptance, 
    setDashboardOrderAcceptance, 
    onSave, 
    isSaving 
}) => {
    const t = useTranslations('vendor');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[99999] p-5 flex items-center justify-center transition-opacity">
            <div className="bg-white rounded-xl w-full max-w-[600px] shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="m-0 text-xl font-bold text-slate-800 dark:text-white">{t('store_order_management_settings', 'Store Order Management Settings')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-5">
                    <div className="mb-4">
                        <label className="block font-semibold mb-2 text-slate-800 dark:text-white">{t('receive_orders_via', 'Receive Orders Via')}</label>
                        <select 
                            value={receiveOrdersVia} 
                            onChange={(e) => setReceiveOrdersVia(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="mobile">{t('mobile', 'Mobile App')}</option>
                            <option value="dashboard">{t('dashboard', 'Dashboard')}</option>
                        </select>
                    </div>
                    
                    {receiveOrdersVia === 'dashboard' && (
                        <div className="mb-6">
                            <label className="block font-semibold mb-2 text-slate-800 dark:text-white">{t('dashboard_order_acceptance', 'Dashboard Order Acceptance')}</label>
                            <select 
                                value={dashboardOrderAcceptance}
                                onChange={(e) => setDashboardOrderAcceptance(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="manual">{t('manual', 'Manual')}</option>
                                <option value="auto">{t('auto_accept', 'Auto Accept')}</option>
                            </select>
                        </div>
                    )}

                    <div className="text-right border-t border-slate-200 pt-4 flex justify-end gap-3">
                        <button 
                            onClick={onClose} 
                            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-semibold transition-colors"
                        >
                            {t('cancel', 'Cancel')}
                        </button>
                        <button 
                            onClick={onSave} 
                            disabled={isSaving}
                            className="px-6 py-2 rounded-lg border-none bg-blue-500 text-white font-semibold cursor-pointer hover:bg-blue-600 disabled:opacity-70 transition-colors"
                        >
                            {isSaving ? t('saving', 'Saving...') : t('save_settings', 'Save Settings')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
