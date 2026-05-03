import React, { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const Contact: React.FC = () => {
  const [showTerms, setShowTerms] = useState(false);

  const handleWhatsAppClick = () => {
    const text = `Hi Fastpointcab, I have an inquiry about your taxi services in Coimbatore.`;
    const phoneNumber = '919488834020';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
   <div className="min-h-screen bg-white dark:bg-slate-950 py-14 md:py-20">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6">
            Get in Touch
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Fast pointCab for 24/7 safe and reliable taxi services in Coimbatore, Tamil Nadu.
          </p>
        </div>


        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                  Customer Support
                </h3>

                <div className="space-y-8">
                  <a href="tel:+914223596446" className="flex items-start gap-6 group">
                    <div className="bg-[#FF6467]/20 p-4 rounded-2xl text-[#FF6467] group-hover:bg-[#FF6467] group-hover:text-white transition-all">
                      <Phone size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-slate-900 dark:text-white">
                        Phone
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">
                        +91 422 359 6446
                      </p>
                    </div>
                  </a>

                  <a href="mailto:fastpointcab@gmail.com" className="flex items-start gap-6 group">
                    <div className="bg-[#FF6467]/20 p-4 rounded-2xl text-[#FF6467] group-hover:bg-[#FF6467] group-hover:text-white transition-all">
                      <Mail size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-slate-900 dark:text-white">
                        Email
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">
                        fastpointcab@gmail.com
                      </p>
                    </div>
                  </a>

                  <div className="flex items-start gap-6">
                    <div className="bg-[#FF6467]/20 p-4 rounded-2xl text-[#FF6467]">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-slate-900 dark:text-white">
                        Address
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Fastpoint Cab – Taxi Services <br />
                        Coimbatore, Tamil Nadu 641014
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
             <div className="w-full h-64 mt-12 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-500">
  <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125322.44163071375!2d76.88483286780826!3d11.014203302096378!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba859af2f971cb5%3A0x2fc1c817186f121b!2sCoimbatore%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1709555000000!5m2!1sen!2sin"
    className="w-full h-full grayscale-[20%] hover:grayscale-0 transition-all duration-700"
    loading="lazy"
    title="Coimbatore Map"
    referrerPolicy="no-referrer-when-downgrade"
  />
</div>

            </div>
          </div>

          {/* WhatsApp / Booking */}
          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border-2 border-dashed border-[#FF6467]/40 text-center">
            <div className="w-24 h-24 bg-[#FF6467]/20 rounded-full flex items-center justify-center mx-auto mb-8 text-[#FF6467]">
              <MessageCircle size={48} />
            </div>

            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Direct WhatsApp Booking
            </h3>

            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">
              Reach out 24/7 for instant taxi booking including outstation and business travel in Coimbatore.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleWhatsAppClick}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 text-xl"
              >
                <MessageCircle size={24} />
                Message on WhatsApp
              </button>

              <a
                href="tel:+914223596446"
                className="w-full bg-slate-100 dark:bg-slate-800 py-5 rounded-full flex items-center justify-center gap-3 text-xl font-bold"
              >
                <Phone size={24} />
                Call Directly
              </a>
            </div>

            {/* Terms & Conditions */}
            <div className="mt-10 text-left">
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="flex items-center justify-between w-full font-semibold text-lg bg-slate-100 dark:bg-slate-800 p-4 rounded-xl"
              >
                <span>Terms and Conditions</span>
                {showTerms ? <ChevronUp /> : <ChevronDown />}
              </button>

              {showTerms && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm text-slate-600 dark:text-slate-400 space-y-2">
                   <p>1. All taxi bookings are subject to availability.</p>
    <p>2. Customers must provide accurate pickup and drop location details.</p>
    <p>3. Payments can be made in cash or via approved digital payment methods.</p>
    <p>4. FastPointCab & Trustyyellowcabs is not responsible for delays due to traffic, weather, or unforeseen circumstances.</p>
    <p>5. Cancellation policies apply; cancellation fees are applicable. Please refer to our cancellation terms when booking.</p>
    <p>6. By using our services, you agree to follow all applicable local regulations.</p>
    <p>7. One day is equal to one calendar day (from midnight to midnight).</p>
    <p>8. Parking, toll, and interstate permit charges are extra.</p>
    <p>9. Driver allowance will be extra if the driver drives between 10:00 PM to 6:00 AM.</p>
    <p>10. Total km and time calculation is from office to office.</p>
    <p>11. AC will not work in hill areas (upwards) and stopped/parked vehicles.</p>
    <p>12. If km usage exceeds standard limits, tariff shifts automatically to Day/KM Basis.</p>
     <p>13. Bookings made via online ads (e.g., Google Ads) may appear when searching for other brands. Trustyyellowcabs is only responsible for bookings actually made with us. Customers cannot claim services from other brands using our ad links.</p>
      <p>14. Our website and booking page may appear in search results when customers search for other taxi brand names. By clicking our advertisement, website link, WhatsApp, or call button, the customer acknowledges that they are contacting our company directly, not any other brand.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
