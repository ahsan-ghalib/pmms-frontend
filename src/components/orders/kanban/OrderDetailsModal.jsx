"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { X, Calendar } from 'lucide-react';

export const OrderDetailsModal = ({ 
    isOpen, 
    order, 
    column, 
    onClose, 
    onAccept, 
    onReject, 
    onOtpChange, 
    otpValue, 
    onCompleteOtp 
}) => {
    const t = useTranslations('vendor');

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[99999] p-5 flex items-center justify-center transition-opacity">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-xl">
                    <h3 className="m-0 text-xl font-bold text-slate-800 dark:text-white">{t('order_details', 'Order Details')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-5">
                    <div className="flex justify-between mb-4">
                        <div>
                            <div className="text-[0.85rem] text-slate-500 dark:text-slate-400">{t('order_id', 'Order ID')}</div>
                            <div className="font-semibold text-slate-800 dark:text-white">#{order.order_id}</div>
                        </div>
                        <div>
                            <div className="text-[0.85rem] text-slate-500 dark:text-slate-400">{t('invoice_id', 'Invoice ID')}</div>
                            <div className="font-semibold text-slate-800 dark:text-white">#{order.invoice_id}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[0.85rem] text-slate-500 dark:text-slate-400">{t('time', 'Time')}</div>
                            <div className="font-semibold text-slate-800 dark:text-white">{order.time_ago}</div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="text-[0.85rem] text-slate-500 dark:text-slate-400">{t('customer', 'Customer')}</div>
                        <div className="font-semibold text-[1.1rem] text-slate-900 dark:text-white">{order.customer_name}</div>
                        {order.customer_phone && <div className="text-[0.85rem] text-slate-600 dark:text-slate-300">{order.customer_phone}</div>}
                        {order.customer_email && <div className="text-[0.85rem] text-slate-600 dark:text-slate-300">{order.customer_email}</div>}
                    </div>

                    {(order.store_name || order.store_address) && (
                        <div className="mb-4">
                            <div className="text-[0.85rem] text-slate-500 dark:text-slate-400">{t('store', 'Store')}</div>
                            {order.store_name && <div className="font-semibold text-[1.0rem] text-slate-900 dark:text-white">{order.store_name}</div>}
                            {order.store_phone && <div className="text-[0.85rem] text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><span className="text-slate-400">Phone:</span> {order.store_phone}</div>}
                            {order.store_address && <div className="text-[0.85rem] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-0.5"><span className="text-slate-400">Address:</span> {order.store_address}</div>}
                        </div>
                    )}

                    {order.is_scheduled && (
                        <div className="mb-4">
                            <div className="text-[0.85rem] text-slate-500 dark:text-slate-400">{t('scheduled_for', 'Scheduled For')}</div>
                            <div className="text-[0.95rem] text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 font-semibold mt-1">
                                <Calendar className="w-4 h-4" />
                                <span>{order.scheduled_date_text || order.scheduled_date}</span>
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <div className="text-[0.85rem] text-slate-500 dark:text-slate-400">{t('order_summary', 'Order Summary')}</div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg mt-1 border border-slate-100 dark:border-slate-700">
                            <div className="font-semibold mb-2 text-slate-800 dark:text-white">
                                {order.items_count} {t('items', 'Items')}:
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {order.items_list?.map((item, idx) => (
                                    <div key={idx} className="flex flex-col pb-1.5 border-b border-dashed border-slate-300 dark:border-slate-600 last:border-0">
                                        <div className="flex items-start gap-2">
                                            <div className="bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-bold px-1.5 py-0.5 rounded text-[0.85rem] min-w-[30px] text-center shadow-sm border border-slate-100 dark:border-slate-700">
                                                {item.quantity}x
                                            </div>
                                            {item.image && (
                                                <img src={item.image} className="w-10 h-10 object-cover rounded" alt="Product" />
                                            )}
                                            <div className="flex-1 text-slate-800 dark:text-white font-medium text-[0.95rem] leading-snug pt-0.5">
                                                <div className="flex justify-between items-start">
                                                    <span>{item.name}</span>
                                                    {item.price > 0 && <span className="font-semibold text-teal-600 ml-2">SAR {item.price}</span>}
                                                </div>
                                                {item.variant && (
                                                    <div className="text-[0.8rem] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        Variant: <span className="font-medium text-slate-600 dark:text-slate-300">{item.variant}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {item.modifiers?.length > 0 && (
                                            <div className="ml-[46px] mt-1.5 text-[0.85rem] text-slate-600 dark:text-slate-300">
                                                <div className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider mb-1">Add-ons</div>
                                                <ul className="m-0 pl-1 space-y-1">
                                                    {item.modifiers.map((mod, modIdx) => (
                                                        <li key={modIdx} className="flex justify-between items-center bg-white/50 dark:bg-slate-800/50 rounded px-2 py-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-slate-400 text-[0.75rem] font-semibold">{mod.quantity}x</span>
                                                                <span>{mod.name || mod}</span>
                                                            </div>
                                                            {mod.price > 0 && <span className="text-slate-500 dark:text-slate-400 text-[0.8rem]">+ SAR {mod.price}</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div>
                            <div className="text-[0.85rem] text-slate-500 dark:text-slate-400">{t('total_amount', 'Total Amount')}</div>
                            <div className="font-bold text-[1.25rem] text-teal-600 flex items-center gap-1">
                                SAR {order.total}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[0.85rem] text-slate-500 dark:text-slate-400 mb-1">{t('delivery_type', 'Delivery Type')}</div>
                            <span className="px-2 py-1 rounded-full text-[0.75rem] font-bold capitalize bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                {order.delivery_type}
                            </span>
                        </div>
                    </div>

                    {/* Accept/Reject logic only for pending */}
                    {column === 'pending' && (
                        <div className="flex gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
                            <button 
                                type="button"
                                onClick={onReject}
                                className="flex-1 py-2.5 rounded-lg border border-red-500 bg-white dark:bg-slate-900 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            >
                                {t('reject_order', 'Reject Order')}
                            </button>
                            <button 
                                type="button"
                                onClick={onAccept}
                                className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-colors"
                            >
                                {t('accept_order', 'Accept Order')}
                            </button>
                        </div>
                    )}

                    {order.can_print_receipt && (
                        <div className="pt-5 mt-2.5 border-t border-slate-200 dark:border-slate-700">
                            <a 
                                href={order.receipt_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="block w-full text-center py-2.5 rounded-lg border border-teal-600 bg-white dark:bg-slate-900 text-teal-600 font-semibold hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
                            >
                                {t('print_receipt', 'Print Receipt')} (Logestechs)
                            </a>
                        </div>
                    )}

                    {/* OTP logic for ready/dispatched orders */}
                    {(column === 'ready' || column === 'dispatched') && (
                        <div className="pt-6 mt-4 border-t border-slate-200 dark:border-slate-700">
                            <label className="text-[0.95rem] font-semibold text-slate-700 dark:text-slate-200 block mb-4 text-center">
                                {t('enter_secret_code', 'Enter Secret Code (OTP) to Deliver')}
                            </label>
                            
                            <div className="flex gap-4 justify-center mb-6">
                                {[0, 1, 2, 3].map((i) => (
                                    <input
                                        key={i}
                                        id={`otp-${i}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={otpValue[i] || ''}
                                        onChange={(e) => {
                                            const char = e.target.value.replace(/[^0-9]/g, '').slice(-1);
                                            let newValue = otpValue.split('');
                                            if (char) {
                                                newValue[i] = char;
                                                onOtpChange(newValue.join(''));
                                                if (i < 3) {
                                                    document.getElementById(`otp-${i + 1}`).focus();
                                                }
                                            } else {
                                                newValue[i] = '';
                                                onOtpChange(newValue.join(''));
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !otpValue[i] && i > 0) {
                                                document.getElementById(`otp-${i - 1}`).focus();
                                            }
                                        }}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
                                            if (pastedData) {
                                                onOtpChange(pastedData);
                                                const nextIndex = Math.min(pastedData.length, 3);
                                                if (document.getElementById(`otp-${nextIndex}`)) {
                                                    document.getElementById(`otp-${nextIndex}`).focus();
                                                }
                                            }
                                        }}
                                        className="w-14 h-14 text-center text-2xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                                    />
                                ))}
                            </div>

                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onCompleteOtp();
                                }}
                                disabled={otpValue.length !== 4}
                                className={`w-full py-3.5 rounded-xl font-bold text-[1.05rem] transition-all shadow-sm
                                    ${otpValue.length === 4 
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20' 
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
                            >
                                {t('deliver_order', 'Deliver Order')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
