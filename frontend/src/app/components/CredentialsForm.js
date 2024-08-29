import React, { useState, useEffect } from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';

const CredentialsForm = ({ setCredentials, setIsVerified, isVerified }) => {
  const [formData, setFormData] = useState({
    accessKeyId: '',
    secretAccessKey: '',
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(!isVerified);

  useEffect(() => {
    setIsExpanded(!isVerified);
  }, [isVerified]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const verifyCredentials = async () => {
    setIsVerifying(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/verify-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setCredentials(formData);
        setIsVerified(true);
      } else {
        throw new Error('Failed to verify credentials');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="relative bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg p-6 text-custom-green">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-semibold">S3 Credentials</h2>
            {isVerified && <CheckCircle className="text-green-500" size={24} />}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="focus:outline-none"
          >
            <ChevronDown size={24} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-4">
            <p className="text-sm text-white mb-4">
              We do not store your credentials and use encryption when making requests
            </p>
            <form className="space-y-6">
              <div>
                <label htmlFor="accessKeyId" className="block text-sm font-medium text-white mb-1">
                  Access Key ID
                </label>
                <input
                  type="text"
                  name="accessKeyId"
                  id="accessKeyId"
                  value={formData.accessKeyId}
                  onChange={handleInputChange}
                  disabled={isVerified}
                  className="w-full px-3 py-2 border text-black placeholder-black rounded-md focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-200 disabled:text-gray-600"
                  placeholder="Enter AWS Access Key ID"
                />
              </div>
              <div>
                <label htmlFor="secretAccessKey" className="block text-sm font-medium text-white mb-1">
                  Secret Access Key
                </label>
                <input
                  type="password"
                  name="secretAccessKey"
                  id="secretAccessKey"
                  value={formData.secretAccessKey}
                  onChange={handleInputChange}
                  disabled={isVerified}
                  className="w-full px-3 py-2 border placeholder-black text-black rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-600"
                  placeholder="Enter AWS Secret Access Key"
                />
              </div>
              {!isVerified && (
                <div className="flex justify-start mt-4">
                  <button
                    type="button"
                    onClick={verifyCredentials}
                    disabled={isVerifying}
                    className="bg-white text-black px-6 py-2 rounded-lg hover:bg-opacity-80 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Credentials'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default CredentialsForm;