import React from 'react';
import Link from 'next/link';
import ConnectWallet from './ConnectWallet';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <nav className="border-b border-dark-700 bg-dark-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                ShadowBox
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/demo" className="text-dark-300 hover:text-primary-400 transition">
                  Demo
                </Link>
                <Link href="/prepare" className="text-dark-300 hover:text-primary-400 transition">
                  Prepare
                </Link>
                <Link href="/status" className="text-dark-300 hover:text-primary-400 transition">
                  Status
                </Link>
              </div>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="border-t border-dark-700 bg-dark-900/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-dark-400">
          <p>ShadowBox — Hybrid Private Airdrops on Zama FHEVM</p>
          <p className="text-sm mt-2">Built with ❤️ for privacy-first rewards</p>
        </div>
      </footer>
    </div>
  );
}
