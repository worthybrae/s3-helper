'use client';

import HeaderBar from './components/HeaderBar';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const CredentialsForm = dynamic(() => import('./components/CredentialsForm'), { ssr: false });
const BucketList = dynamic(() => import('./components/BucketSelect'), { ssr: false });
const S3Browser = dynamic(() => import('./components/S3Browser'), { ssr: false });

export default function Home() {
  const [credentials, setCredentials] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState('');

  return (
    <main className="min-h-screen">
      <HeaderBar />
      <div className="pt-[100px]">
        <CredentialsForm
          setCredentials={setCredentials}
          setIsVerified={setIsVerified}
          isVerified={isVerified}
        />
        {isVerified && (
          <>
            <BucketList 
              credentials={credentials} 
              onBucketSelect={setSelectedBucket}
            />
            {selectedBucket && (
              <S3Browser 
                credentials={credentials} 
                selectedBucket={selectedBucket} 
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}