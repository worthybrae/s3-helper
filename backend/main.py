from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
import polars as pl
import io
import zlib
import bz2
import lzma
import magic
import csv


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Credentials(BaseModel):
    accessKeyId: str
    secretAccessKey: str

class BucketRequest(BaseModel):
    accessKeyId: str
    secretAccessKey: str
    bucketName: str

class FileRequest(BucketRequest):
    fileName: str

@app.post("/verify-credentials")
async def verify_credentials(credentials: Credentials):
    try:
        sts = boto3.client(
            'sts',
            aws_access_key_id=credentials.accessKeyId,
            aws_secret_access_key=credentials.secretAccessKey
        )
        sts.get_caller_identity()
        return {"message": "Credentials verified successfully"}
    except ClientError:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/list-buckets")
async def list_buckets(credentials: Credentials):
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=credentials.accessKeyId,
            aws_secret_access_key=credentials.secretAccessKey
        )
        response = s3.list_buckets()
        buckets = []
        for bucket in response['Buckets']:
            try:
                size = sum(obj['Size'] for obj in s3.list_objects(Bucket=bucket['Name']).get('Contents', []))
                files = len(s3.list_objects(Bucket=bucket['Name']).get('Contents', []))
            except ClientError:
                size = 0
                files = 0
            buckets.append({
                "name": bucket['Name'],
                "size": size / (1024 * 1024 * 1024),  # Convert to GB
                "files": files
            })
        return {"buckets": buckets}
    except ClientError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/list-bucket-contents")
async def list_bucket_contents(request: BucketRequest):
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=request.accessKeyId,
            aws_secret_access_key=request.secretAccessKey
        )
        response = s3.list_objects_v2(Bucket=request.bucketName)
        contents = []
        for obj in response.get('Contents', []):
            contents.append({
                "name": obj['Key'],
                "size": obj['Size'],
                "storageType": obj['StorageClass']
            })
        return {"contents": contents}
    except ClientError as e:
        raise HTTPException(status_code=400, detail=str(e))

def detect_file_type(data):
    # Check for common compression types first
    if data.startswith(b'\x1f\x8b'):
        return 'gzip'
    if data.startswith(b'BZh'):
        return 'bz2'
    if data.startswith(b'\xfd7zXZ\x00'):
        return 'xz'
    if data.startswith(b'PK\x03\x04'):
        return 'zip'
    
    # Use libmagic for other type detection
    mime_type = magic.from_buffer(data, mime=True)
    
    if mime_type == 'application/octet-stream':
        if data.startswith(b'PAR1'):
            return 'parquet'
    
    return mime_type

@app.post("/quick-preview")
async def quick_preview(request: FileRequest):
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=request.accessKeyId,
            aws_secret_access_key=request.secretAccessKey
        )
        
        # Read the first 100000 bytes
        response = s3.get_object(Bucket=request.bucketName, Key=request.fileName, Range='bytes=0-99999')
        content = response['Body'].read()

        file_type = detect_file_type(content)
        preview_text = preview_content(content, file_type)

        # Try to detect CSV/TSV if it's a text file
        delimiter = None
        if 'text' in file_type or file_type in ['application/octet-stream', 'application/x-empty']:
            try:
                dialect = csv.Sniffer().sniff(preview_text[:1000])  # Use only first 1000 chars for sniffing
                delimiter = dialect.delimiter
                file_type = 'tsv' if delimiter == '\t' else f'csv (delimiter: {repr(delimiter)})'
            except:
                pass

        return {
            "fileName": request.fileName,
            "fileType": file_type,
            "delimiter": delimiter,
            "previewText": preview_text[:10000],  # Return up to 10000 characters
            "totalBytes": int(response['ContentRange'].split('/')[-1])
        }
    except ClientError as e:
        raise HTTPException(status_code=400, detail=str(e))

def preview_content(data, file_type):
    preview = data[:10000]  # Increase to 10000 bytes
    
    if file_type == 'gzip':
        try:
            decompressor = zlib.decompressobj(16 + zlib.MAX_WBITS)
            preview = decompressor.decompress(data, 10000)  # Increase to 10000 bytes
        except:
            pass
    elif file_type == 'bz2':
        try:
            decompressor = bz2.BZ2Decompressor()
            preview = decompressor.decompress(data, 10000)  # Increase to 10000 bytes
        except:
            pass
    elif file_type == 'xz':
        try:
            decompressor = lzma.LZMADecompressor()
            preview = decompressor.decompress(data, 10000)  # Increase to 10000 bytes
        except:
            pass
    
    # Attempt to decode as UTF-8, fallback to latin-1 if that fails
    try:
        return preview.decode('utf-8', errors='ignore')
    except:
        return preview.decode('latin-1', errors='ignore')
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)