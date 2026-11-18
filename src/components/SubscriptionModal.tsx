import React, { useState } from 'react';
import {
  X,
  Check,
  CreditCard,
  Phone,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertCircle,
  Smartphone,
  Zap,
  Lock
} from 'lucide-react';
import { SubscriptionPlan, PaymentMethod, UserProfile, UserSubscription } from '../types';
import { processSubscriptionPayment } from '../services/paymentService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  user: UserProfile;
  onSuccess: (subscription?: UserSubscription) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  plans = [],
  user,
  onSuccess
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    plans.find((p) => p.isPopular)?.id || plans[0]?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN_MOMO');
  const [phoneNumber, setPhoneNumber] = useState<string>(user.phoneNumber || '0788123456');
  const [cardNumber, setCardNumber] = useState<string>('4532 8901 2345 6789');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('829');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (selectedPlan.price === 0) {
      // Free plan selected
      onClose();
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const res = await processSubscriptionPayment({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userPhone: phoneNumber,
        plan: selectedPlan,
        paymentMethod,
        cardNumber,
        cardExpiry,
        cardCvv
      });

      if (res.success && res.subscription) {
        setPaymentSuccessMessage(res.message);
        onSuccess(res.subscription);
        setTimeout(() => {
          setIsProcessing(false);
          onClose();
        }, 1800);
      } else {
        setPaymentError(res.message || 'Payment could not be completed.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setPaymentError(err?.message || 'Payment transaction failed.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto select-none">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#050a16] border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/80 overflow-hidden my-auto ring-1 ring-cyan-400/30">
        
        {/* Top Tri-Color Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-sky-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-blue-950/70 via-[#050a16] to-transparent border-b border-blue-900/30 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 text-xs font-black uppercase tracking-wider shadow">
            <Sparkles className="w-3.5 h-3.5" /> GURA VIP PASS • MTN MOMO & AIRTEL
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Select Your Subscription Plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Unlock all Agasobanuye HD series, 1080p high quality movies, and high-speed offline downloads.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-950/80 ring-2 ring-cyan-400/40'
                      : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500 hover:bg-slate-900'
                  }`}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                      MOST POPULAR
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-black text-white">{plan.name}</h3>
                      <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-400/30">
                        {plan.durationDays} Days
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                        {plan.price.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {plan.currency}
                      </span>
                    </div>

                    <div className="border-t border-slate-800 my-3" />

                    <ul className="space-y-2 text-xs text-slate-300">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-2xl text-xs font-black transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-black shadow-md shadow-cyan-900/50'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Selected Plan' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Method Selection & Checkout Form */}
          {selectedPlan && selectedPlan.price > 0 && (
            <form onSubmit={handleCheckout} className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-cyan-400" /> SELECT PAYMENT METHOD (RWANDA)
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" /> 256-Bit Encrypted
                </span>
              </div>

              {/* Payment Tabs (MTN MoMo, Airtel, Card) */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'MTN_MOMO', label: 'MTN MoMo (*182#)', icon: Smartphone, color: 'text-yellow-400' },
                  { id: 'AIRTEL_MONEY', label: 'Airtel Money (*500#)', icon: Smartphone, color: 'text-red-400' },
                  { id: 'CARD', label: 'Visa / Mastercard', icon: CreditCard, color: 'text-blue-400' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isCur = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id as PaymentMethod)}
                      className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        isCur
                          ? 'bg-blue-600/20 border-yellow-400 text-white ring-1 ring-yellow-400/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${item.color}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Inputs based on payment method */}
              {paymentMethod === 'MTN_MOMO' || paymentMethod === 'AIRTEL_MONEY' ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">
                    Shyiramo Numero ya {paymentMethod === 'MTN_MOMO' ? 'MTN Mobile Money' : 'Airtel Money'} (*182#)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-yellow-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="urugero: 0788 123 456"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Kuri telefone yawe harahita haza ubutumwa bwa USSD bw'ubwishyu bwa {selectedPlan.price.toLocaleString()} {selectedPlan.currency}.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4532 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">CVV Security Code</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status or Error feedback */}
              {paymentError && (
                <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {paymentSuccessMessage && (
                <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{paymentSuccessMessage}</span>
                </div>
              )}

              {/* Pay Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-900/50 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer hover:scale-[1.01]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span className="text-slate-950">Kohereza USSD Push kuri telefone...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current text-slate-950" />
                    <span className="text-slate-950">Ishyura {selectedPlan.price.toLocaleString()} {selectedPlan.currency} & Fungura VIP</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
