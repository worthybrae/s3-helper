'use client'
import React from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react";
import { UserCircle } from 'lucide-react';

const HeaderBar = () => {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-0 w-full h-[100px] z-50 ">
      <div className=""></div>
      <div className="container mx-auto h-full px-4 flex items-center justify-between relative z-10 ">
        <Link href="/" className="text-3xl font-bold text-custom-green transition-colors">
          EASY S3
        </Link>
        <div>
          {session ? (
            <div className="flex items-center space-x-4">
              <span className="text-white">{session.user.name}</span>
              <button
                onClick={() => signOut()}
                className="text-white transition-colors"
              >
                <UserCircle size={32} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="relative bg-white hover:bg-opacity-25 bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg px-5 py-3 text-custom-green"
            >
              Login with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;