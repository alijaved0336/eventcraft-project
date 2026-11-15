import React from 'react';
import { Link } from 'react-router-dom';

const OrganizerLandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <main>
        {/* Hero Section */}
        <section className="relative px-8 pt-24 pb-32 overflow-hidden bg-background">
          <div className="max-w-screen-2xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full bg-[#4648d4]/10 text-[#4648d4] font-semibold text-xs tracking-widest uppercase">
              Redefining Excellence
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-8 max-w-4xl leading-[1.1] font-serif">
              The Ultimate Platform for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4648d4] to-[#6063ee]">Event Organizers</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
              Experience high-performance curation for the modern era. From intimate galas to global summits, manage every detail with editorial precision.
            </p>
            <div className="flex flex-col md:flex-row gap-4 mb-20">
              <Link to="/auth/register" className="px-8 py-4 bg-[#4648d4] text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-[#4648d4]/20 transition-all active:scale-95">Get Started for Free</Link>
              <button className="px-8 py-4 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80 transition-all active:scale-95">Contact Sales</button>
            </div>
            
            {/* Dashboard Preview */}
            <div className="relative w-full max-w-6xl mx-auto">
              <div className="bg-card rounded-[2rem] p-4 shadow-[0_12px_40px_rgba(25,28,29,0.06)] border border-border">
                <img 
                  alt="EventCraft Dashboard Demo" 
                  className="w-full h-auto rounded-[1.5rem] object-cover" 
                  src="/images/dashboard-mockup.png"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#4648d4]/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
            </div>
          </div>
        </section>

        {/* Event Creation Section */}
        <section className="py-32 bg-card">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="mb-20">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4 font-serif">Event Creation Made Easy</h2>
              <p className="text-muted-foreground max-w-xl">Powerful tools designed for speed without compromising on the signature brand experience.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="group p-8 rounded-2xl bg-muted/50 hover:bg-card hover:shadow-[0_12px_40px_rgba(25,28,29,0.06)] hover:border hover:border-border transition-all duration-300">
                <div className="w-14 h-14 bg-[#4648d4]/10 rounded-xl flex items-center justify-center text-[#4648d4] mb-8 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Intuitive Setup</h3>
                <p className="text-muted-foreground leading-relaxed">Build complex event architectures in minutes with our drag-and-drop workspace designed for clarity.</p>
              </div>
              <div className="group p-8 rounded-2xl bg-[#f3f4f5] hover:bg-white hover:shadow-[0_12px_40px_rgba(25,28,29,0.06)] transition-all duration-300">
                <div className="w-14 h-14 bg-[#4648d4]/10 rounded-xl flex items-center justify-center text-[#4648d4] mb-8 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">palette</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Custom Branding</h3>
                <p className="text-muted-foreground leading-relaxed">Your brand, your rules. Fully white-label every touchpoint from registration pages to attendee mobile apps.</p>
              </div>
              <div className="group p-8 rounded-2xl bg-[#f3f4f5] hover:bg-white hover:shadow-[0_12px_40px_rgba(25,28,29,0.06)] transition-all duration-300">
                <div className="w-14 h-14 bg-[#4648d4]/10 rounded-xl flex items-center justify-center text-[#4648d4] mb-8 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Instant Launch</h3>
                <p className="text-muted-foreground leading-relaxed">Scale globally with one click. Our infrastructure handles millions of concurrent requests without breaking a sweat.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Sections */}
        <section className="py-32 bg-background">
          <div className="max-w-screen-2xl mx-auto px-8 space-y-40">
            {/* Feature 1 */}
            <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-32">
              <div className="w-full md:w-1/2">
                <div className="relative rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(25,28,29,0.06)] bg-[#e1e3e4]">
                  <img 
                    alt="Advanced Analytics" 
                    className="w-full h-[500px] object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVaf19kvM06IocAJ3sw7e9h58zlEQ4pP4HPEAFgPePjZTZ_zFDScjJpzV40QpTHaIVQkF1wHLwQ9g3yxPM15zVzus_dHX01HtUY3NpjXY-qOvc5WjYHObGPQlU7y0vheCGzegd51pG-VvwOBynrKXLJyXcsjgkGh4sMS7aIHAFf3fgUyCr2es8zDtrJezUYOtMfBcuDKxIzzHSzd2e91y13zkparsBIe1SMhKiYudtA9N4g1s7XmHAweXjOq7IuItKHGJIcSgHQ50Y"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <span className="text-[#4648d4] font-bold text-sm tracking-widest uppercase mb-4 block">Performance First</span>
                <h2 className="text-4xl font-extrabold mb-6 leading-tight font-serif">Advanced Analytics</h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Deep dive into attendee behavior and revenue trends. Our AI-driven insights help you optimize your event strategy in real-time.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 font-medium">
                    <span className="material-symbols-outlined text-[#4648d4]">check_circle</span>
                    <span>Real-time revenue tracking</span>
                  </div>
                  <div className="flex items-center gap-3 font-medium">
                    <span className="material-symbols-outlined text-[#4648d4]">check_circle</span>
                    <span>Conversion funnel analysis</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16 lg:gap-32">
              <div className="w-full md:w-1/2">
                <div className="relative rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(25,28,29,0.06)] bg-[#e1e3e4]">
                  <img 
                    alt="Attendee Tracking" 
                    className="w-full h-[500px] object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgilIiyXtu2ihXyj2-2Pg6wKGnre_c6vRYX8EhHIFhE7yDOGxiFDqmGsj5TDDThK6JQw3djvzEeijYHZDqb-aIMy3qwV7oNVZj_oQ9-BiCKfHzP4wtui181JDp_ugSDxlTo9Xxtg3Bj40qAiMwFAi-m8OYaxl3NDy6XR3EDxH5_Y5lDsWAULU29cdpWxJvq85Q2QLeqTtstnfokhYuyck5M007XWABJS_EpqD9vaBDkVhOuk7O3yZcrb843xqwsDl44MNx2Mh-oRw3"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <span className="text-[#4648d4] font-bold text-sm tracking-widest uppercase mb-4 block">Engagement Engine</span>
                <h2 className="text-4xl font-extrabold mb-6 leading-tight font-serif">Attendee Tracking</h2>
                <p className="text-lg text-[#464554] mb-8 leading-relaxed">
                  Monitor every touchpoint from check-in to session attendance. Ensure a seamless flow with our integrated RFID and QR solutions.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 font-medium">
                    <span className="material-symbols-outlined text-[#4648d4]">check_circle</span>
                    <span>Live heatmaps of venue traffic</span>
                  </div>
                  <div className="flex items-center gap-3 font-medium">
                    <span className="material-symbols-outlined text-[#4648d4]">check_circle</span>
                    <span>Automated digital check-ins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-32 bg-white">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="flex flex-col items-center text-center mb-16">
              <p className="text-[#464554] font-medium mb-8">Trusted by the world's most prestigious organizations</p>
              <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 font-serif font-black text-2xl">
                <div>VOGUE</div>
                <div>Forbes</div>
                <div>TechCrunch</div>
                <div>WIRED</div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-[3rem] p-12 md:p-24 relative overflow-hidden">
              <div className="absolute top-12 left-12 opacity-10">
                <span className="material-symbols-outlined text-9xl text-primary">format_quote</span>
              </div>
              <div className="relative z-10 max-w-3xl mx-auto text-center">
                <p className="text-2xl md:text-3xl font-bold mb-10 leading-snug font-serif">
                  "EventCraft has completely transformed how we approach high-stakes event management. The editorial level of detail combined with raw technical power is simply unmatched in the market today."
                </p>
                <div className="flex flex-col items-center font-serif">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-4 border-2 border-[#4648d4]">
                    <img 
                      alt="Lead Organizer" 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8zX1-yOy2TYKXRdQHb-eNKtvAOTiv3T8QBysEPaSFLkPNKBTVH6sPvvVsU2AvkYr0NX7PyGmDMFJdRPUO4J_seDYPqwbk0RajZeI7QcpPnBpvQ6dDSNgUE6wjKNlkUiqrOUXTSXxt8A9yzUYBcAG5ZH5fWHbBw6Bj26w33DFoSKETxoIvH16r2kRMQB-aevJsxjKDVAoU8Ua45y6NPzJG5dGg_z7AmSOo8QhEk27O8joVduLUXvAretMYBVzgCM_wvM30t-C3IjUm"
                    />
                  </div>
                  <div className="font-bold text-lg text-foreground">Alexandra Chen</div>
                  <div className="text-muted-foreground text-sm uppercase tracking-widest font-sans font-semibold">Director of Global Events, Luxury Collective</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-[#4648d4]">
          <div className="max-w-screen-xl mx-auto px-8 text-center text-white">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight font-serif">Ready to Host Your Next Big Event?</h2>
            <p className="text-xl opacity-90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join over 5,000 premium event organizers who are redefining the attendee experience with EventCraft.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-6">
              <Link to="/auth/register" className="px-12 py-5 bg-white text-[#4648d4] rounded-2xl font-extrabold text-xl shadow-2xl active:scale-95 transition-transform">Get Started</Link>
              <button className="px-12 py-5 border-2 border-white/30 hover:bg-white/10 text-white rounded-2xl font-extrabold text-xl active:scale-95 transition-transform">Schedule Demo</button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 px-8 mt-auto bg-muted/30 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 max-w-screen-2xl mx-auto">
          <div className="col-span-2">
            <div className="text-xl font-bold text-slate-900 dark:text-white mb-6 font-serif">EventCraft</div>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
              Editorial excellence in event management. Built for those who demand more from their digital platforms.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Features</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Pricing</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Case Studies</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Documentation</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">API Reference</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><a className="hover:text-indigo-600 transition-colors" href="#">About</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Contact</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-indigo-600 transition-colors" href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto mt-20 pt-8 border-t border-border text-sm text-muted-foreground">
          © {new Date().getFullYear()} EventCraft. All rights reserved. Editorial Excellence in Event Management.
        </div>
      </footer>
    </div>
  );
};

export default OrganizerLandingPage;
