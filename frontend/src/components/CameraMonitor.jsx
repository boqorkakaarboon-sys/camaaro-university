import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * CameraMonitor – Live webcam panel shown during exam.
 * - Requests camera on mount
 * - Detects when video feed goes dark (possible cover) 
 * - Reports violations via onViolation callback
 */
const CameraMonitor = ({ onViolation, isActive }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const checkRef = useRef(null);
  const [status, setStatus] = useState('requesting'); // requesting | active | denied | error
  const [violations, setViolations] = useState(0);
  const [lastCheck, setLastCheck] = useState(null);
  const violationsRef = useRef(0);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (checkRef.current) {
      clearInterval(checkRef.current);
      checkRef.current = null;
    }
  }, []);

  // Check if video feed is "dark" (camera blocked)
  const checkFeedActivity = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 40;
    canvas.height = 30;
    ctx.drawImage(video, 0, 0, 40, 30);
    const data = ctx.getImageData(0, 0, 40, 30).data;

    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avg = sum / (data.length / 4);

    // Very dark frame = possible camera cover
    if (avg < 8) {
      violationsRef.current += 1;
      setViolations(violationsRef.current);
      setLastCheck('⚠ Camera may be blocked!');
      onViolation && onViolation(violationsRef.current);
    } else {
      setLastCheck('✓ Camera active');
    }
  }, [onViolation]);

  useEffect(() => {
    if (!isActive) { stopStream(); return; }

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('active');
        // Check every 5 seconds
        checkRef.current = setInterval(checkFeedActivity, 5000);
      } catch (err) {
        if (err.name === 'NotAllowedError') setStatus('denied');
        else setStatus('error');
      }
    };

    start();
    return () => stopStream();
  }, [isActive, stopStream, checkFeedActivity]);

  return (
    <div className="camera-monitor">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="cam-header">
        <span className="cam-title">📷 Camera Monitor</span>
        <span className={`cam-dot ${status === 'active' ? 'active' : 'inactive'}`} />
      </div>

      {status === 'requesting' && (
        <div className="cam-msg">Requesting camera access...</div>
      )}

      {status === 'denied' && (
        <div className="cam-warning">
          ⚠ Camera access denied.<br />
          <small>Camera is required for this exam. Please enable camera and reload.</small>
        </div>
      )}

      {status === 'error' && (
        <div className="cam-warning">
          ⚠ Camera error. Check device and reload.
        </div>
      )}

      {status === 'active' && (
        <>
          <video
            ref={videoRef}
            className="cam-video"
            autoPlay
            muted
            playsInline
          />
          <div className="cam-status">
            <span>{lastCheck || '✓ Camera active'}</span>
            {violations > 0 && (
              <span className="cam-violations">⚠ {violations} alert{violations > 1 ? 's' : ''}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CameraMonitor;
