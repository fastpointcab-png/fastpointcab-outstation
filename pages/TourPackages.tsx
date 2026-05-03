import React from 'react';
import { Send, MapPin, Sparkles, Compass } from 'lucide-react';

const topTenTours = [
 {
  title: "Ooty",
  quote: "The Queen of Hills is best experienced with a slow drive through the pines.",
  image: "/images/Ooty.webp",
  duration: "Flexible Trip Plan"
},
{
  title: "Munnar",
  quote: "Greenery that heals the soul. The tea gardens of Kerala are calling.",
  image: "/images/Munnar.webp",
  duration: "Flexible Trip Plan"
},
{
  title: "Kodaikanal",
  quote: "Mist-covered peaks and quiet lakes. Perfect for a weekend escape.",
  image: "/images/Kodaikanal.webp",
  duration: "Flexible Trip Plan"
},
{
  title: "Madurai",
  quote: "Step into history. The architecture of Meenakshi Temple is a divine marvel.",
  image: "/images/Madurai.webp",
  duration: "Flexible Trip Plan"
},
{
  title: "Valparai",
  quote: "Untouched, wild, and beautiful. A journey through 40 hair-pin bends.",
  image: "/images/Valparai.webp",
  duration: "Flexible Trip Plan"
},
{
  title: "Wayanad",
  quote: "Experience the heart of the Western Ghats with deep forest drives.",
  image: "/images/Wayanad.webp",
  duration: "Flexible Trip Plan"
},
{
  title: "Pondicherry",
  quote: "A slice of France in South India. Cycle through the white town.",
  image: "/images/Pondicherry.webp",
  duration: "Flexible Trip Plan"
},
{
  title: "Mysuru",
  quote: "The City of Palaces. Royalty and heritage at every corner.",
  image: "/images/Mysuru.webp",
  duration: "Flexible Trip Plan"
},
{
  title: "Rameshwaram",
  quote: "A spiritual odyssey to the edge of the ocean. Pure peace.",
  image: "/images/Rameshwaram.webp",
  duration: "Flexible Trip Plan"
},
{
  title: "Kanyakumari",
  quote: "Where three seas meet. The ultimate sunrise and sunset destination.",
  image: "/images/Kanyakumari.webp",
  duration: "Flexible Trip Plan"
}
];

export const TourPackages: React.FC = () => {

  const handleBooking = (title: string) => {
    const text = `Hi FastPoint Cab, I want to book a tour to ${title}. Please send me a quote.`;
    window.open(`https://wa.me/919488834020?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCustomTrip = () => {
    const text = "Hi FastPoint Cab, I want to plan a custom tour package.";
    window.open(`https://wa.me/919488834020?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">

      {/* HEADER */}
      <section className="relative h-[45vh] flex items-center justify-center bg-slate-900 overflow-hidden">
        <img
          src="/images/IMG_8962.webp"
          className="absolute w-full h-full object-cover opacity-70"
          alt="Travel"
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative text-center text-white">
          <h1 className="text-3xl md:text-5xl font-black uppercase">
            Tour Packages
          </h1>
          <p className="text-sm mt-2 opacity-80">
            Explore South India with premium cab tours
          </p>
        </div>
      </section>

      {/* GRID */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">

          {topTenTours.map((tour, index) => (
            <div
              key={tour.title}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition"
            >

              {/* IMAGE */}
              <div className="relative h-64">
                <img
                  src={tour.image}
                  className="w-full h-full object-cover"
                  alt={tour.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                <div className="absolute top-4 left-4 bg-white/10 text-white px-3 py-1 rounded-xl text-xs">
                  {index + 1}
                </div>

                <div className="absolute bottom-4 left-4 text-white">
                  <h2 className="text-xl font-black">{tour.title}</h2>
                  <p className="text-xs opacity-80">{tour.quote}</p>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase">Duration</div>
                  <div className="flex items-center gap-2 font-bold">
                    <Compass size={14} className="text-red-500" />
                    {tour.duration}
                  </div>
                </div>

                <button
                  onClick={() => handleBooking(tour.title)}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  Book <Sparkles size={14} />
                </button>
              </div>

            </div>
          ))}

        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Plan Your Custom Trip
          </h2>
          <p className="text-slate-500 mt-2">
            Build your own travel package with us
          </p>

          <button
            onClick={handleCustomTrip}
            className="mt-6 bg-red-500 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 mx-auto"
          >
            <Send size={16} /> Start Planning
          </button>
        </div>

      </div>
    </div>
  );
};