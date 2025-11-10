
// prettier-ignore
import React from 'react';
import logoUrl from './public/vin_school_logo.png';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <img
          src={logoUrl}
          alt="Vinschool logo"
          className="h-20 w-20 md:h-24 md:w-24 object-contain"
          loading="eager"
          decoding="async"
        />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 leading-tight">
        Vinschool English Coach AI 📚
      </h1>
      <p className="mt-2 text-lg text-gray-600">
        Your friendly AI tutor to help you master English writing and speaking!
      </p>
    </header>
  );
};

export default Header;
