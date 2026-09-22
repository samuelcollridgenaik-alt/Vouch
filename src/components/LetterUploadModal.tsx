import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  UploadCloud,
  FileImage,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  SwitchCamera,
  Zap,
  FileCheck,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export interface ExtractedLetterData {
  text: string;
  url: string;
  senderEmail: string;
  companyName?: string;
  jobTitle?: string;
  summary?: string;
}

interface LetterUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtracted: (data: ExtractedLetterData) => void;
}

export const LetterUploadModal: React.FC<LetterUploadModalProps> = ({
  isOpen,
  onClose,
  onExtracted,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [imageSizeKb, setImageSizeKb] = useState<number>(0);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractSeconds, setExtractSeconds] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isIframeBlocked, setIsIframeBlocked] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer for real-time extraction feedback
  useEffect(() => {
    let interval: any;
    if (isExtracting) {
      setExtractSeconds(0);
      interval = setInterval(() => {
        setExtractSeconds((prev) => +(prev + 0.1).toFixed(1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isExtracting]);

  // Clean up camera stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  }, []);

  // Handle modal open/close cleanup
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setSelectedImage(null);
      setSelectedFileName(null);
      setImageSizeKb(0);
      setErrorMsg(null);
      setIsExtracting(false);
      setIsIframeBlocked(false);
    }
  }, [isOpen, stopCameraStream]);

  // Handle active stream attaching to video element reliably
  const attachStreamToVideo = useCallback((videoEl: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!videoEl || !stream) return;
    try {
      videoEl.srcObject = stream;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('webkit-playsinline', 'true');
      videoEl.play().catch((err) => {
        console.warn('Video play deferred or prevented:', err);
      });
    } catch (e) {
      console.warn('Error attaching stream to video element:', e);
    }
  }, []);

  // Ref callback to guarantee video stream attaches the exact instant the element mounts in DOM
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoElementRef.current = node;
    if (node && streamRef.current) {
      attachStreamToVideo(node, streamRef.current);
    }
  }, [attachStreamToVideo]);

  // Start WebRTC live camera with robust fallbacks
  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    setIsIframeBlocked(false);
    setCameraLoading(true);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is unsupported or restricted in this browser context.');
      }

      let stream: MediaStream;
      try {
        // Try requested facing mode
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (errFacing) {
        console.warn('FacingMode constraint rejected, falling back to default video input:', errFacing);
        // Fallback for laptop webcams
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);
      setCameraLoading(false);

      // Attach immediately if video element already rendered
      if (videoElementRef.current) {
        attachStreamToVideo(videoElementRef.current, stream);
      }
    } catch (err: any) {
      console.warn('Live camera error:', err);
      setCameraActive(false);
      setCameraLoading(false);

      const isPermissionErr =
        err.name === 'NotAllowedError' ||
        err.name === 'SecurityError' ||
        err.message?.includes('Permission') ||
        err.message?.includes('restricted');

      if (isPermissionErr) {
        setIsIframeBlocked(true);
        setErrorMsg(
          'Webcam access is restricted inside this preview frame. Use the "Snap with Camera" button below or click "Open in New Tab" for direct hardware access.'
        );
      } else {
        setErrorMsg(
          `Camera failed to initialize: ${err.message || 'Device busy or unavailable'}. Please use "Snap with Camera" or "Browse Files".`
        );
      }
    }
  }, [cameraFacing, stopCameraStream, attachStreamToVideo]);

  // Effect to manage camera lifecycle when tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab, startCamera, stopCameraStream]);

  // Switch front/back camera
  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from live video feed (resizes to max 1000px, 0.72 quality)
  const capturePhotoFromVideo = () => {
    const video = videoElementRef.current;
    if (!video) {
      setErrorMsg('No active video element found.');
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setErrorMsg('Camera stream is still warming up. Please wait 1 second and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    let width = video.videoWidth;
    let height = video.videoHeight;
    const maxDim = 1000;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    setSelectedImage(dataUrl);
    setSelectedFileName('webcam-snapshot.jpg');
    setImageSizeKb(Math.round((dataUrl.length * 0.75) / 1024));
    stopCameraStream();
  };

  // Process uploaded image file with client-side canvas compression (~80KB)
  const processImageFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP, or HEIC).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Downscale to max 1000px for instant OCR
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
          setSelectedImage(compressedDataUrl);
          setImageSizeKb(Math.round((compressedDataUrl.length * 0.75) / 1024));
        } else {
          setSelectedImage(src);
          setImageSizeKb(Math.round((src.length * 0.75) / 1024));
        }
        setSelectedFileName(file.name);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Instant demo letter generator
  const handleLoadDemoLetter = () => {
    setErrorMsg(null);
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background paper texture
    ctx.fillStyle = '#faf9f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Letterhead banner
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 40, 720, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('GLOBAL TECH DYNAMICS INC.', 60, 82);

    // Body text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('OFFICIAL APPOINTMENT & EQUIPMENT DIRECTIVE', 60, 160);
    ctx.font = 'normal 13px sans-serif';
    ctx.fillText('Date: September 20, 2026', 60, 190);
    ctx.fillText('Candidate: Selected Applicant', 60, 215);
    ctx.fillText('Position: Remote Senior Systems Analyst ($165,000 / Year)', 60, 240);

    ctx.fillText('Dear Candidate,', 60, 280);
    ctx.fillText('We are pleased to confirm your appointment following your brief interview via Telegram.', 60, 310);
    ctx.fillText('Enclosed is a cashier check for $4,850.00. Per corporate procurement policy, you must', 60, 340);
    ctx.fillText('deposit this check into your personal bank account within 24 hours of receipt.', 60, 370);
    ctx.fillText('Once funds appear available, wire $4,200.00 immediately via Zelle or Bitcoin ATM to our', 60, 400);
    ctx.fillText('certified hardware vendor for your encrypted MacBook Pro and biometric security key.', 60, 430);

    ctx.fillText('HR Contact: hr-team@careers-globaltech.top', 60, 490);
    ctx.fillText('Company Portal: https://careers-globaltech.top/equipment-portal', 60, 520);
    ctx.fillText('Failure to complete transfer within 24 hours will forfeit your security clearance.', 60, 560);

    // Sign off
    ctx.font = 'italic 16px serif';
    ctx.fillText('Arthur Pendelton, Global HR Director', 60, 630);

    const demoUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelectedImage(demoUrl);
    setSelectedFileName('demo-scam-letter.jpg');
    setImageSizeKb(Math.round((demoUrl.length * 0.75) / 1024));
  };

  // Send to server OCR endpoint with timeout and graceful fallback
  const handleExtractAndPreFill = async () => {
    if (!selectedImage) return;
    setIsExtracting(true);
    setErrorMsg(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout

    try {
      const response = await fetch('/api/extract-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: 'image/jpeg',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Server responded with status ${response.status}`);
      }

      const data = await response.json();

      // Gracefully handle partial or summarized extractions
      let extractedText = data.text?.trim() || '';
      if (!extractedText && data.summary) {
        extractedText = `[Extracted Document Overview]\nCompany: ${data.companyName || 'Not specified'}\nRole: ${data.jobTitle || 'Not specified'}\n\nSummary:\n${data.summary}`;
      }

      if (!extractedText && !data.url && !data.senderEmail) {
        throw new Error(
          'No legible text or email links could be detected in this photo. Please retake closer or with better lighting, or paste the text directly.'
        );
      }

      onExtracted({
        text: extractedText,
        url: data.url || '',
        senderEmail: data.senderEmail || '',
        companyName: data.companyName || '',
        jobTitle: data.jobTitle || '',
        summary: data.summary || '',
      });

      onClose();
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Extraction error:', err);
      if (err.name === 'AbortError') {
        setErrorMsg('Vision OCR request timed out. Please retry or click "Load Demo Letter" to test immediately.');
      } else {
        setErrorMsg(err.message || 'Failed to process document image. Please try another photo or paste text.');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="letter-upload-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden inputs for gallery and native device camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">
                  Scan Printed Offer Letter
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> Fast Vision OCR
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Snap or upload document to auto-fill target inspection fields
              </p>
            </div>
          </div>
          <button
            id="close-letter-upload-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick action bar */}
        {!selectedImage && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              type="button"
              id="native-camera-shutter-btn"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-amber-950 font-semibold text-xs flex flex-col items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-amber-700" />
              <span>Snap with Camera</span>
            </button>

            <button
              type="button"
              id="gallery-browse-btn"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs flex flex-col items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-stone-700" />
              <span>Browse Files</span>
            </button>

            <button
              type="button"
              id="load-demo-letter-btn"
              onClick={handleLoadDemoLetter}
              className="py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-semibold text-xs flex flex-col items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
              title="Test instant OCR with a synthetic check-scam offer letter"
            >
              <FileCheck className="w-4 h-4 text-indigo-700" />
              <span>Load Demo Letter</span>
            </button>
          </div>
        )}

        {/* Tab selection for Live Webcam vs File Area */}
        {!selectedImage && (
          <div className="flex gap-2 p-1 bg-stone-100 rounded-lg mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                stopCameraStream();
              }}
              className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileImage className="w-3.5 h-3.5" />
              Drag & Drop / Gallery
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
              }}
              className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Live Webcam Viewfinder
            </button>
          </div>
        )}

        {/* Tab 1: Drag & Drop Dropzone */}
        {activeTab === 'upload' && !selectedImage && (
          <div
            id="dropzone-area"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processImageFile(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-8 text-center transition-all bg-stone-50/50 flex flex-col items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="h-12 w-12 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-2xs mb-3">
              <FileImage className="w-6 h-6 text-amber-700" />
            </div>

            <p className="text-sm font-semibold text-stone-800 mb-1">
              Drop photo of offer letter here, or click to browse
            </p>
            <p className="text-xs text-stone-500 mb-2 max-w-sm">
              Supports JPG, PNG, WEBP. Optimized client-side (~80KB) for instant OCR extraction.
            </p>
          </div>
        )}

        {/* Tab 2: Live Webcam Stream Viewfinder */}
        {activeTab === 'camera' && !selectedImage && (
          <div className="flex flex-col items-center w-full">
            {/* Camera Viewfinder Container */}
            <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-stone-800">
              {/* Always keep video element mounted so ref callback receives DOM node */}
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  cameraActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Connecting / Loading Spinner */}
              {cameraLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/80 text-white gap-2 z-20">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  <span className="text-xs font-semibold">Connecting to camera feed...</span>
                </div>
              )}

              {/* Inactive or Permission Blocked Overlay */}
              {!cameraActive && !cameraLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 text-white p-6 text-center z-10 space-y-3">
                  <Camera className="w-10 h-10 text-stone-400" />
                  <p className="text-xs text-stone-300 max-w-sm">
                    {isIframeBlocked
                      ? 'Browser policy restricts camera streaming within embedded preview tabs.'
                      : 'Live camera is currently inactive or needs initialization.'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 cursor-pointer shadow-xs"
                    >
                      Start Camera Feed
                    </button>
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold hover:bg-stone-700 cursor-pointer"
                    >
                      Use Device Camera App
                    </button>
                  </div>
                </div>
              )}

              {/* Viewfinder Controls & Guide Overlay */}
              {cameraActive && (
                <>
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      title="Flip camera"
                      className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-xs cursor-pointer"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Visual bounding box for letter positioning */}
                  <div className="absolute inset-8 border border-white/40 rounded-lg pointer-events-none border-dashed flex items-center justify-center">
                    <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                      Align document inside frame
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Shutter Button when live stream is active */}
            {cameraActive && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  id="capture-webcam-frame-btn"
                  onClick={capturePhotoFromVideo}
                  className="px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo Frame
                </button>
              </div>
            )}
          </div>
        )}

        {/* Selected Image Preview & Confirm Action */}
        {selectedImage && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 max-h-64 flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Selected letter preview"
                className="max-h-64 object-contain w-auto mx-auto"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setSelectedFileName(null);
                  setImageSizeKb(0);
                  if (activeTab === 'camera') startCamera();
                }}
                className="absolute top-2 right-2 rounded-full bg-stone-900/75 text-white p-1.5 hover:bg-stone-900 transition-colors shadow-md cursor-pointer"
                title="Retake or choose different photo"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800 truncate max-w-xs">{selectedFileName || 'Letter Image'}</span>
                {imageSizeKb > 0 && (
                  <span className="text-[10px] font-mono text-stone-500 bg-stone-200/60 px-1.5 py-0.5 rounded">
                    {imageSizeKb} KB (Optimized)
                  </span>
                )}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Fast OCR
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1">
                  <p>{errorMsg}</p>
                  {isIframeBlocked && (
                    <button
                      type="button"
                      onClick={() => window.open(window.location.origin, '_blank')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 underline hover:text-rose-950 mt-1 cursor-pointer bg-transparent p-0 border-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in New Tab for unrestricted hardware camera access
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setSelectedFileName(null);
                }}
                disabled={isExtracting}
                className="px-3 py-2 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50 cursor-pointer"
              >
                Retake Photo
              </button>

              <button
                type="button"
                id="prefill-inspection-btn"
                onClick={handleExtractAndPreFill}
                disabled={isExtracting}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Transcribing document forensic text ({extractSeconds}s)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Transcribe & Pre-fill Inputs</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner when not in selected image state */}
        {!selectedImage && errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-1">
              <p>{errorMsg}</p>
              {isIframeBlocked && (
                <button
                  type="button"
                  onClick={() => window.open(window.location.origin, '_blank')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 underline hover:text-rose-950 mt-1 cursor-pointer bg-transparent p-0 border-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in New Tab for unrestricted hardware camera access
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
