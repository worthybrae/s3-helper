import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';

const BucketSelect = ({ credentials, onBucketSelect }) => {
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState('');
  const [customBucketName, setCustomBucketName] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasListBucketsPermission, setHasListBucketsPermission] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    fetchBuckets();
  }, [credentials]);

  const fetchBuckets = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/list-buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (response.ok) {
        const data = await response.json();
        setBuckets(data.buckets);
        setHasListBucketsPermission(true);
      } else {
        setHasListBucketsPermission(false);
      }
    } catch (err) {
      setHasListBucketsPermission(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBucketSelect = (e) => {
    const bucket = e.target.value;
    setSelectedBucket(bucket);
    setCustomBucketName(bucket);
  };

  const handleCustomBucketNameChange = (e) => {
    setCustomBucketName(e.target.value);
  };

  const handlePreviewClick = () => {
    onBucketSelect(customBucketName || selectedBucket);
    setIsConfirmed(true);
    setIsExpanded(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg p-6 text-custom-green">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-semibold">S3 Bucket</h2>
            {isConfirmed && <CheckCircle className="text-green-500" size={24} />}
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
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div>
                {hasListBucketsPermission ? (
                  <select
                    value={selectedBucket}
                    onChange={handleBucketSelect}
                    className="w-full px-3 py-2 border text-black rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white mb-4"
                  >
                    <option value="">Select a bucket</option>
                    {buckets.map((bucket) => (
                      <option key={bucket.name} value={bucket.name}>
                        {bucket.name} ({bucket.size.toFixed(2)} GB, {bucket.files} files)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mb-4">
                    <input
                      type="text"
                      value={customBucketName}
                      onChange={handleCustomBucketNameChange}
                      placeholder="Enter bucket name"
                      className="w-full px-3 py-2 border text-black rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex items-center text-yellow-300 text-sm mt-2">
                      <AlertTriangle size={16} className="mr-1" />
                      <span>List bucket permissions aren't enabled</span>
                    </div>
                  </div>
                )}
                
                <button
                onClick={handlePreviewClick}
                className="bg-white text-black px-6 py-2 rounded-lg hover:bg-opacity-80 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!customBucketName && !selectedBucket}
                >
                Preview
                </button>
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BucketSelect;