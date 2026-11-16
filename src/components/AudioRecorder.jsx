import React, { useState, useRef, useEffect } from 'react';
import { formatTime } from '../utils/exportUtils';

export default function AudioRecorder({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [helpText, setHelpText] = useState('Click "Start Recording" to capture audio directly from your microphone.');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const filename = `Meeting_Recording_${new Date().toISOString().slice(0, 10)}.webm`;
        onRecordingComplete(blob, filename);

        stream.getTracks().forEach((track) => track.stop());
        cancelAnimationFrame(animFrameRef.current);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
      setElapsedSeconds(0);
      setHelpText('Recording in progress... Speak clearly into your microphone.');

      setupVisualizer(stream);

      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or unavailable: ' + err.message);
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      setHelpText('Recording paused.');
    } else if (mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      setHelpText('Recording resumed.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      clearInterval(timerIntervalRef.current);
      setIsRecording(false);
      setIsPaused(false);
      setHelpText('Recording captured. Click "Summarize with GenAI" below.');
    }
  };

  const setupVisualizer = (stream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioCtx = audioContextRef.current;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyserRef.current = analyser;
    source.connect(analyser);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#38bdf8');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };
    draw();
  };

  useEffect(() => {
    return () => {
      clearInterval(timerIntervalRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="input-card tab-panel active">
      <div className="record-container">
        <div className="record-visualizer-box">
          <canvas ref={canvasRef} width={600} height={90} className="record-visualizer-canvas" />
          <div className="timer-display">{formatTime(elapsedSeconds)}</div>
        </div>

        <div className="record-controls">
          {!isRecording ? (
            <button className="btn-record" onClick={startRecording}>
              <span className="record-indicator"></span>
              <span>Start Recording</span>
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={togglePause}>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button className="btn-danger" onClick={stopRecording}>
                Stop & Use Audio
              </button>
            </>
          )}
        </div>
        <p className="record-help">{helpText}</p>
      </div>
    </div>
  );
}
