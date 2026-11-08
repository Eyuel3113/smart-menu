'use client';

import React, { useState, useMemo } from 'react';
import { X, Check, Loader2, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
import sound from '@/lib/sound';

export type PaymentProvider = 'telebirr' | 'cbe' | 'awash';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number | string;
  tableId: string;
  grandTotal: number;
  itemCount?: number;
  onConfirmPayment: (data: {
    provider: PaymentProvider;
    phoneNumber: string;
    grandTotal: number;
  }) => Promise<void>;
}

export default function PaymentModal({
  isOpen,
  onClose,
  tableNumber,
  tableId,
  grandTotal,
  itemCount,
  onConfirmPayment,
}: PaymentModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>('telebirr');
  const [phoneNumber, setPhoneNumber] = useState<string>('913260197');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ussdDispatched, setUssdDispatched] = useState<boolean>(false);

  // Validate Ethiopian phone number: 9 digits starting with 9 or 7 (or 09.../07...)
  const cleanPhone = useMemo(() => {
    let p = phoneNumber.replace(/\D/g, '');
    if (p.startsWith('251')) p = p.slice(3);
    if (p.startsWith('0')) p = p.slice(1);
    return p;
  }, [phoneNumber]);

  const isValidNumber = useMemo(() => {
    return cleanPhone.length === 9 && (cleanPhone.startsWith('9') || cleanPhone.startsWith('7'));
  }, [cleanPhone]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    setPhoneNumber(val);
  };

  const handlePay = async () => {
    if (!selectedProvider) return;
    if (!isValidNumber) {
      alert('Please enter a valid 9-digit Ethiopian mobile number (e.g. 913260197).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmPayment({
        provider: selectedProvider,
        phoneNumber: cleanPhone,
        grandTotal,
      });
      try {
        sound.playSuccessDing();
      } catch {}
      setUssdDispatched(true);
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const providerName =
    selectedProvider === 'telebirr'
      ? 'Telebirr'
      : selectedProvider === 'cbe'
      ? 'CBE Birr'
      : 'Awash Birr';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 font-sans">
      <div className="w-full sm:max-w-md bg-[#0d121d] border-t sm:border border-slate-800/80 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-white max-h-[94vh] overflow-y-auto animate-in zoom-in-95">
        {/* Top Handle Bar for Mobile */}
        <div className="w-12 h-1 bg-slate-700/60 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

        {ussdDispatched ? (
          /* --- USSD PUSH CONFIRMATION SCREEN --- */
          <div className="py-6 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
              <Smartphone className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                <Check className="w-3.5 h-3.5" />
                USSD Prompt Sent
              </div>
              <h3 className="text-xl font-black text-white">Check Your Phone Screen</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                An instant <span className="text-white font-bold">{providerName}</span> authorization
                prompt for <span className="text-emerald-400 font-bold">{grandTotal.toFixed(2)} ETB</span> has been
                dispatched to <span className="font-mono text-white font-bold">+251 {cleanPhone}</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#141b2b] border border-slate-800 text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Status</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                  Awaiting PIN Authorization
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Table</span>
                <span className="text-white font-bold">Table #{tableNumber}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Total Amount</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  {grandTotal.toFixed(2)} ETB
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Enter your PIN on your mobile handset to complete the payment. The restaurant staff will be notified automatically.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Done & Return to Session
            </button>
          </div>
        ) : (
          /* --- MAIN PAYMENT MODAL CONTENT --- */
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                  <Smartphone className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white leading-tight">
                    Direct Mobile Payment
                  </h3>
                  <p className="text-xs text-slate-400">Instant USSD push</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bill Summary Banner (Package replaced by Total Bill) */}
            <div className="p-4 rounded-2xl bg-[#141b2b] border border-slate-800/80 flex items-center justify-between shadow-inner">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase tracking-widest inline-block">
                  TOTAL BILL
                </span>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  TABLE #{tableNumber}
                </h4>
              </div>

              <div className="text-right">
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {grandTotal.toFixed(2)}{' '}
                  <span className="text-xs font-bold text-slate-400">ETB</span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-400">
                  Instant USSD Settlement
                </div>
              </div>
            </div>

            {/* 1. SELECT PAYMENT METHOD */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                1. SELECT PAYMENT METHOD
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {/* 1. Telebirr */}
                <button
                  type="button"
                  onClick={() => setSelectedProvider('telebirr')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                    selectedProvider === 'telebirr'
                      ? 'bg-[#162236] border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/40'
                      : 'bg-[#141b2b] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md mb-2 p-1.5">
                    {/* Telebirr Logo */}
                    <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
                      <path
                        d="M24 6C17 6 12 11 12 18C12 25 20 30 24 30C28 30 36 34 36 41C36 47 30 48 24 48"
                        stroke="#0072CE"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      <circle cx="24" cy="18" r="4.5" fill="#0072CE" />
                      <circle cx="36" cy="41" r="3.5" fill="#00A3E0" />
                      <path
                        d="M32 10L39 17"
                        stroke="#00A3E0"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9 34L16 41"
                        stroke="#00A3E0"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-200">Telebirr</span>
                </button>

                {/* 2. CBE Birr */}
                <button
                  type="button"
                  onClick={() => setSelectedProvider('cbe')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                    selectedProvider === 'cbe'
                      ? 'bg-[#162236] border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/40'
                      : 'bg-[#141b2b] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md mb-2 p-1.5">
                    {/* CBE Birr Emblem */}
                    <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
                      <circle cx="24" cy="24" r="21" fill="#7C2D12" stroke="#D97706" strokeWidth="2" />
                      <circle cx="24" cy="24" r="16" fill="#F59E0B" opacity="0.25" />
                      <path
                        d="M24 11C16.8 11 11 16.8 11 24C11 31.2 16.8 37 24 37C31.2 37 37 31.2 37 24"
                        stroke="#FBBF24"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M20 20C20 17.5 22 16 24 16C26 16 28 17.5 28 20C28 23 24 24.5 24 28V29"
                        stroke="#FEF3C7"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="24" cy="33" r="1.5" fill="#FEF3C7" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-200">CBE Birr</span>
                </button>

                {/* 3. Awash Birr */}
                <button
                  type="button"
                  onClick={() => setSelectedProvider('awash')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                    selectedProvider === 'awash'
                      ? 'bg-[#162236] border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/40'
                      : 'bg-[#141b2b] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md mb-2 p-1.5">
                    {/* Awash Bank Globe */}
                    <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
                      <circle cx="24" cy="24" r="21" fill="#0F172A" />
                      <path d="M12 19C16 13 32 13 36 19C32 22 16 22 12 19Z" fill="#F97316" />
                      <path d="M10 25C16 22 32 22 38 25C34 28 14 28 10 25Z" fill="#EA580C" />
                      <path d="M12 31C18 29 30 29 36 31C32 34 16 34 12 31Z" fill="#1E3A8A" />
                      <path d="M16 36C20 35 28 35 32 36C29 38 19 38 16 36Z" fill="#2563EB" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-200">Awash Birr</span>
                </button>
              </div>
            </div>

            {/* 2. ENTER PHONE NUMBER */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                2. ENTER PHONE NUMBER
              </label>

              <div className="bg-[#141b2b] border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition">
                {/* Ethiopian Flag & +251 prefix */}
                <div className="flex items-center gap-2 select-none">
                  <span className="text-lg">🇪🇹</span>
                  <span className="font-bold text-slate-300 text-sm font-mono">+251</span>
                </div>

                <div className="h-5 w-px bg-slate-700" />

                {/* Number Input */}
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="913260197"
                  className="bg-transparent text-white font-mono font-bold text-base placeholder-slate-600 focus:outline-hidden flex-1 tracking-wider"
                />
              </div>

              {/* Status and Helper */}
              <div className="flex items-center justify-between pt-1 px-1 text-[11px]">
                <span className="text-slate-400">
                  The USSD prompt will be sent directly to this phone.
                </span>
                {isValidNumber && (
                  <span className="font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    Valid Number
                  </span>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSubmitting || !isValidNumber || !selectedProvider}
                onClick={handlePay}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition cursor-pointer ${
                  selectedProvider && isValidNumber
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 active:scale-[0.99]'
                    : 'bg-[#142322] border border-emerald-500/30 text-emerald-400/80'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Dispatching USSD Push...</span>
                  </>
                ) : selectedProvider ? (
                  <>
                    <span>SEND USSD PUSH &bull; {grandTotal.toFixed(2)} ETB</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <span>SELECT PAYMENT PROVIDER</span>
                )}
              </button>
            </div>

            {/* Footer Disclaimer */}
            <p className="text-center text-[10px] text-slate-500 tracking-wide">
              By proceeding you agree to SmartMenu Terms of Service.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

