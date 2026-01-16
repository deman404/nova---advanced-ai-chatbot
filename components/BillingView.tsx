
import React from 'react';
import { UserPlan } from '../types';

interface BillingViewProps {
  currentPlan: UserPlan;
  onUpgrade: (plan: UserPlan) => void;
}

const PLANS = [
  {
    id: 'free' as UserPlan,
    name: 'Free Tier',
    price: '$0',
    description: 'Perfect for exploring Nova.',
    features: ['100 messages / day', 'Basic reasoning', 'Standard history', 'Community support'],
    color: 'bg-slate-50',
    borderColor: 'border-slate-200',
    buttonColor: 'bg-slate-800',
  },
  {
    id: 'pro' as UserPlan,
    name: 'Nova Pro',
    price: '$20',
    description: 'Advanced features for power users.',
    features: ['Unlimited messages', 'Faster response times', 'Search grounding', 'Priority support', 'Analytics access'],
    color: 'bg-indigo-50/50',
    borderColor: 'border-indigo-200',
    buttonColor: 'bg-indigo-600',
    popular: true,
  },
  {
    id: 'enterprise' as UserPlan,
    name: 'Enterprise',
    price: 'Custom',
    description: 'Dedicated infrastructure for teams.',
    features: ['SSO & SAML', 'Custom model fine-tuning', 'Dedicated account manager', '99.9% uptime SLA', 'Unlimited history storage'],
    color: 'bg-teal-50/50',
    borderColor: 'border-teal-200',
    buttonColor: 'bg-teal-600',
  }
];

export const BillingView: React.FC<BillingViewProps> = ({ currentPlan, onUpgrade }) => {
  return (
    <div className="p-6 h-full overflow-y-auto bg-white fade-in">
      <div className="max-w-5xl mx-auto py-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-800 mb-4">Choose Your Plan</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Scale your experience with Nova. Upgrade anytime to unlock more powerful reasoning and features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div 
              key={plan.id} 
              className={`relative flex flex-col p-8 rounded-3xl border ${plan.borderColor} ${plan.color} transition-all hover:shadow-xl ${plan.popular ? 'scale-105 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                  Most Popular
                </span>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  {plan.id !== 'enterprise' && <span className="text-slate-500 text-sm">/mo</span>}
                </div>
                <p className="text-slate-500 text-sm mt-4">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onUpgrade(plan.id)}
                disabled={currentPlan === plan.id}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all active:scale-95 ${plan.buttonColor} ${currentPlan === plan.id ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 shadow-md'}`}
              >
                {currentPlan === plan.id ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade Now'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
