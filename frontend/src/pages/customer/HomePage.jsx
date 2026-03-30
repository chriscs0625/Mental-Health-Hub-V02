import React from 'react';
import { ArrowRight, BookOpen, Headphones, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl text-primary tracking-tight">MentalBalanceHub</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/products" className="text-slate-600 hover:text-primary transition-colors font-medium">Resources</Link>
              <Link to="/about" className="text-slate-600 hover:text-primary transition-colors font-medium">Our Mission</Link>
              <Link to="/cart" className="text-slate-600 hover:text-primary transition-colors font-medium">Cart</Link>
              <Link to="/login" className="bg-primary hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-primary font-semibold text-sm mb-6">
              Your Journey Starts Here
            </span>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
              Nurture Your Mind, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Elevate Your Life</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed">
              Discover our expert-crafted digital workbooks, audio guides, and mental wellness tools designed to help you find peace and resilience in the modern world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-white bg-primary hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all">
                Explore Resources
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/about" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Why choose our resources?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Expert-Backed Guides</h3>
              <p className="text-slate-600 leading-relaxed">Evidence-based workbooks carefully constructed by mental health professionals for real results.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <Headphones className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Therapeutic Audio</h3>
              <p className="text-slate-600 leading-relaxed">Immersive soundscapes and guided meditations you can take with you anywhere, anytime.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Safe & Private</h3>
              <p className="text-slate-600 leading-relaxed">Download digitally directly to your device securely. Your journey is yours, completely confidential.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-accent" />
            <span className="font-bold text-xl text-white tracking-tight">MentalBalanceHub</span>
          </div>
          <p className="mb-6 max-w-md mx-auto text-sm">Empowering your mental wellness journey through accessible, high-quality digital resources.</p>
          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} MentalBalanceHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
