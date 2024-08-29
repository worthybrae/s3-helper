import React, { useState, useEffect, useCallback } from 'react';
import { Folder, File, ArrowLeft, Eye, Trash2, X } from 'lucide-react';

const S3Browser = ({ credentials, selectedBucket }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (selectedBucket) {
      fetchContents('/');
    }
  }, [selectedBucket]);

  const fetchContents = async (path) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/list-bucket-contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          bucketName: selectedBucket,
          prefix: path === '/' ? '' : path,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const processedContents = processContents(data.contents, path);
        setContents(processedContents);
      } else {
        throw new Error('Failed to fetch bucket contents');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processContents = (items, currentPath) => {
    const folders = new Map();
    const files = [];

    items.forEach(item => {
      const relativePath = item.name.slice(currentPath === '/' ? 0 : currentPath.length);
      const parts = relativePath.split('/');

      if (parts.length > 1 && parts[0] !== '') {
        // It's a folder
        if (!folders.has(parts[0])) {
          folders.set(parts[0], { size: 0, count: 0 });
        }
        folders.get(parts[0]).size += item.size;
        folders.get(parts[0]).count += 1;
      } else if (parts[0] !== '') {
        // It's a file
        files.push({
          name: parts[0],
          size: item.size,
          fullPath: item.name
        });
      }
    });

    return [
      ...Array.from(folders).map(([folder, data]) => ({ 
        name: folder, 
        isFolder: true, 
        size: data.size,
        count: data.count
      })),
      ...files.map(file => ({ ...file, isFolder: false }))
    ];
  };

  const handleFolderClick = (folderName) => {
    const newPath = currentPath === '/' ? `/${folderName}/` : `${currentPath}${folderName}/`;
    setCurrentPath(newPath);
    fetchContents(newPath);
  };

  const navigateUp = () => {
    if (currentPath === '/') return;
    const newPath = currentPath.split('/').slice(0, -2).join('/') + '/';
    setCurrentPath(newPath);
    fetchContents(newPath);
  };

  const formatSize = (size) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const handlePreview = useCallback(async (item) => {
    setPreviewFile(item);
    setPreviewLoading(true);
    setPreviewContent(null);

    try {
      const response = await fetch('http://localhost:8000/quick-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          bucketName: selectedBucket,
          fileName: item.fullPath,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setPreviewContent(data);
      } else {
        throw new Error('Failed to fetch file preview');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  }, [credentials, selectedBucket]);

  const renderPreviewContent = (previewContent) => {
    if (!previewContent || !previewContent.previewText) return null;

    const lines = previewContent.previewText.split('\n');
    const headers = lines[0].split(',').map(header => header.replace(/"/g, ''));
    const rows = lines.slice(1, 11).map(line => line.split(',').map(cell => cell.replace(/"/g, '')));

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const closePreview = useCallback(() => {
    setPreviewFile(null);
    setPreviewContent(null);
  }, []);

  

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg p-6 text-custom-green">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">{selectedBucket}</h2>
          <div className="flex items-center">
            <span className="mr-4">Current Path: {currentPath}</span>
            {currentPath !== '/' && (
              <button
                onClick={navigateUp}
                className="bg-white text-black px-6 py-2 rounded-lg hover:bg-opacity-80 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {contents.length > 0 ? (
              <ul className="space-y-2">
                {contents.map((item, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-white bg-opacity-0 hover:bg-opacity-15 rounded">
                    <div className="flex items-center flex-grow">
                      {item.isFolder ? (
                        <button
                          onClick={() => handleFolderClick(item.name)}
                          className="flex items-center w-full text-left"
                        >
                          <Folder className="mr-2 h-4 w-4" />
                          {item.name}
                        </button>
                      ) : (
                        <div className="flex items-center">
                          <File className="mr-2 h-4 w-4" />
                          {item.name}
                          <Eye 
                            className="ml-2 h-4 w-4 cursor-pointer" 
                            onClick={() => handlePreview(item)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-4">
                        {item.isFolder ? `${item.count} items, ` : ''}
                        {formatSize(item.size)}
                      </span>
                      {!item.isFolder && (
                        <Trash2 className="h-4 w-4 cursor-pointer text-red-500" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No contents found in this location.</p>
            )}
          </div>
        )}
      </div>

      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{previewFile.name}</h3>
              <button onClick={closePreview} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            {previewLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              </div>
            ) : previewContent ? (
              <>
                {renderPreviewContent(previewContent)}
                <p className="mt-4 text-sm text-gray-500">
                  File Type: {previewContent.fileType}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  This is a preview of the first 10,000 bytes of the file.
                </p>
              </>
            ) : (
              <p>No preview available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default S3Browser;