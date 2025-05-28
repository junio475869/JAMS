import { useState, useRef, useCallback } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export interface SpeechRecognitionHook {
  transcript: string;
  listening: boolean;
  waveformData: number[];
  duration: number;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  stream: MediaStream | null;
  setTranscript: (val: string) => void;
}

interface SpeechRecognitionProps {
  onTranscriptionComplete?: (text: string) => void;
}

export const useSpeechRecognition = (
  type: "user" | "interviewer" | "candidate",
  props?: SpeechRecognitionProps
): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef("");

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const cleanupRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current = null;
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
  };

  const startVisualizer = (stream: MediaStream) => {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.4;
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    let frameCount = 0;
    const FRAMES_TO_SKIP = 6;
    const SAMPLES_PER_SECOND = 5;
    const SECONDS_TO_KEEP = 30;
    const MAX_SAMPLES = SAMPLES_PER_SECOND * SECONDS_TO_KEEP;

    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      frameCount++;
      
      if (frameCount % FRAMES_TO_SKIP === 0) {
        const processedData = new Array(bufferLength);
        for (let i = 0; i < bufferLength; i++) {
          const factor = i < bufferLength / 2
            ? i / (bufferLength / 2)
            : 1 - (i - bufferLength / 2) / (bufferLength / 2);
          processedData[i] = dataArrayRef.current[i] * factor;
        }
        setWaveformData((prev) => {
          const next = [...prev, Math.max(...processedData)];
          return next.slice(-MAX_SAMPLES);
        });
      }
      animationFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDuration(0);
  };

  const startListening = useCallback(async () => {
    if (listening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    try {
      // First request microphone permission explicitly
      let stream;
      try {
        if (type === "candidate") {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else if (type === "interviewer") {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (permissionError: any) {
        console.error("Permission error:", permissionError);
        if (permissionError.name === "NotAllowedError") {
          alert("Microphone access was denied. Please allow microphone access to use speech recognition.");
        } else {
          alert("Error accessing microphone: " + permissionError.message);
        }
        return;
      }
      
      mediaStreamRef.current = stream;
      // startVisualizer(stream);
      startTimer();

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join("");
        setTranscript(result);
      };

      recognition.onerror = (event: SpeechRecognitionEvent) => {
        if (event.error === 'not-allowed') {
          alert("Microphone access was denied. Please allow microphone access to use speech recognition.");
          setListening(false);
          stopMediaStream();
          cleanupRecognition();
          stopVisualizer();
          stopTimer();
          return;
        }
        if (event.error === 'aborted') {
          // Don't treat aborted as an error, just stop listening
          setListening(false);
          stopMediaStream();
          cleanupRecognition();
          stopVisualizer();
          stopTimer();
          return;
        }
        if (event.error === 'no-speech') {
          // Don't treat no-speech as an error, just continue listening
          return;
        }
        console.error("Speech recognition error:", event.error);
        setListening(false);
        stopMediaStream();
        cleanupRecognition();
        stopVisualizer();
        stopTimer();
      };

      recognition.onend = () => {
        if (listening) {
          // Only restart if we're still supposed to be listening
          try {
            recognition.start();
          } catch (error) {
            console.error("Error restarting recognition:", error);
            setListening(false);
            stopMediaStream();
            cleanupRecognition();
            stopVisualizer();
            stopTimer();
          }
        } else {
          console.log("Recognition ended");
          setListening(false);
          stopMediaStream();
          cleanupRecognition();
          stopVisualizer();
          stopTimer();
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setListening(true);
      } catch (startError) {
        console.error("Error starting recognition:", startError);
        setListening(false);
        stopMediaStream();
        cleanupRecognition();
        stopVisualizer();
        stopTimer();
      }
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setListening(false);
      stopMediaStream();
      cleanupRecognition();
      stopVisualizer();
      stopTimer();
    }
  }, [listening, type]);

  const stopListening = useCallback(() => {
    if (!listening) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        cleanupRecognition();
      }
      
      // If there's a transcript and it's different from the last one, add it as a message
      if (transcript && transcript !== lastTranscriptRef.current) {
        props?.onTranscriptionComplete?.(transcript);
        lastTranscriptRef.current = transcript;
      }
    } catch (err) {
      console.error("Error stopping recognition:", err);
    } finally {
      stopMediaStream();
      stopVisualizer();
      stopTimer();
      setListening(false);
      setWaveformData([]);
    }
  }, [listening, transcript, props]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    transcript,
    listening,
    waveformData,
    duration,
    startListening,
    stopListening,
    resetTranscript,
    stream: mediaStreamRef.current,
    setTranscript,
  };
};
