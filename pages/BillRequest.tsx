
import React, { useState, useEffect, memo } from 'react';
import { FileText, User, Phone, MapPin, Calendar, CreditCard, Car, MessageCircle } from 'lucide-react';
import { BillRequestDetails } from '../types';

interface InputFieldProps {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  icon: any;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

/**
 * Stable InputField defined outside to prevent focus reset on every keystroke
 */
const InputField: React.FC<InputFieldProps> = memo(({ 
  label, name, type, placeholder, icon: Icon, required, value, onChange, className = "" 
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
      {label} {required && !label.includes('*') && <span className="text-brand-yellow">*</span>}
    </label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-yellow transition-colors pointer-events-none z-10">
        <Icon size={16} />
      </div>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-brand-yellow/10 focus:border-brand-yellow dark:text-white text-sm font-semibold transition-all"
      />
    </div>
  </div>
));

export const BillRequest: React.FC = () => {
  const [formData, setFormData] = useState<BillRequestDetails>({
    name: '',
    phone: '',
    date: '',
    pickup: '',
    drop: '',
    amount: '',
    vehicleNumber: '',
  });

  useEffect(() => {
    const now = new Date();
    const indiaDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    
    setFormData(prev => ({ ...prev, date: indiaDate }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWhatsAppSend = (e: React.FormEvent) => {
    e.preventDefault();
    
    const messageText = `*BILL REQUEST - FastPointCab*
--------------------------------
*Customer:* ${formData.name}
*Phone:* ${formData.phone}
*Trip Date:* ${formData.date}
*Pickup:* ${formData.pickup}
*Drop:* ${formData.drop}
*Vehicle No:* ${formData.vehicleNumber || 'Not Mentioned'}
*Total Fare:* ${formData.amount}
--------------------------------
Please generate a bill for the above trip.`;

    const phoneNumber = '919488834020';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageText)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-yellow/10 rounded-2xl text-brand-yellow mb-6 shadow-sm">
            <FileText size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 leading-none">
            Request Bill
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest max-w-sm mx-auto">
            Digital invoice via WhatsApp
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-10 shadow-2xl border border-slate-100 dark:border-slate-800">
          <form onSubmit={handleWhatsAppSend} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Full Name" 
                name="name" 
                type="text" 
                placeholder="Full Name" 
                icon={User} 
                required 
                value={formData.name}
                onChange={handleChange}
              />
              <InputField 
                label="Mobile" 
                name="phone" 
                type="tel" 
                placeholder="10-digit number" 
                icon={Phone} 
                required 
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <InputField 
              label="Trip Date (IST)" 
              name="date" 
              type="date" 
              placeholder="" 
              icon={Calendar} 
              required 
              value={formData.date ?? ''}
              onChange={handleChange}
            />

            <InputField 
              label="Total Fare (₹) *" 
              name="amount" 
              type="number" 
              placeholder="00.00" 
              icon={CreditCard} 
              required 
              value={formData.amount}
              onChange={handleChange}
              className="bg-brand-yellow/5 p-5 rounded-2xl border border-brand-yellow/20"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="From" 
                name="pickup" 
                type="text" 
                placeholder="Pickup Location" 
                icon={MapPin} 
                required 
                value={formData.pickup}
                onChange={handleChange}
              />
              <InputField 
                label="To" 
                name="drop" 
                type="text" 
                placeholder="Destination" 
                icon={MapPin} 
                required 
                value={formData.drop}
                onChange={handleChange}
              />
            </div>

            <InputField 
              label="Vehicle Number (Optional)" 
              name="vehicleNumber" 
              type="text" 
              placeholder="TN XX XX 0000" 
              icon={Car} 
              value={formData.vehicleNumber || ''}
              onChange={handleChange}
            />

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-xl shadow-green-500/20 uppercase tracking-widest text-[10px]"
              >
                <MessageCircle size={20} />
                Request via WhatsApp
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
