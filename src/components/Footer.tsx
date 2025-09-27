import { Facebook, Twitter, Instagram, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  return (
    <footer className="bg-black text-white border-t border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">About Urban Guardians</h3>
            <p className="text-gray-400 text-sm">
              Empowering communities to report and track civic issues for a better urban environment.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/?view=home" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  onClick={handleClick}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/?view=report" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  onClick={handleClick}
                >
                  Reports
                </Link>
              </li>
              <li>
                <Link 
                  to="/?view=community" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  onClick={handleClick}
                >
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm">Email: info@urbanguardians.com</li>
              <li className="text-gray-400 text-sm">Phone: (555) 123-4567</li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Urban Guardians. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}