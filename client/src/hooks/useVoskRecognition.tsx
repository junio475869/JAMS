import { useState, useRef, useCallback, useEffect } from "react";
import { createModel, Model } from "vosk-browser";

export interface VoskRecognitionHook {
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

interface VoskRecognitionProps {
  onTranscriptionComplete?: (text: string) => void;
}

export const useVoskRecognition = (props?: VoskRecognitionProps): VoskRecognitionHook => {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const lastTranscriptRef = useRef("");

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognizerRef = useRef<any>(null);
  const modelRef = useRef<Model | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const stopMediaStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
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
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    audioContextRef.current = audioCtx;

    const FRAMES_TO_SKIP = 6;
    const SAMPLES_PER_SECOND = 5;
    const MAX_SAMPLES = SAMPLES_PER_SECOND * 30;
    let frameCount = 0;

    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      frameCount++;

      if (frameCount % FRAMES_TO_SKIP === 0) {
        const processedData = Array.from(dataArrayRef.current).map((val, i) => {
          const factor = i < bufferLength / 2
            ? i / (bufferLength / 2)
            : 1 - (i - bufferLength / 2) / (bufferLength / 2);
          return val * factor;
        });
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
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setDuration(0);
  };

  const downsampleBuffer = (
    buffer: Float32Array,
    inputSampleRate: number,
    outputSampleRate: number
  ): Float32Array => {
    if (outputSampleRate === inputSampleRate) return buffer;
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < newLength) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count === 0 ? 0 : accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  };

  useEffect(() => {
    const loadModel = async () => {
      if (!modelRef.current) {
        modelRef.current = await createModel("/download-vosk-model", 1);
        console.log("Model loaded:", modelRef.current);
      }
    };
    loadModel();
  }, []);

  const startListening = useCallback(async () => {
    if (listening) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      });

      if (!stream.getAudioTracks().length) {
        throw new Error("No audio track found in display media stream.");
      }

      mediaStreamRef.current = stream;
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
      audioContextRef.current = audioContext;

      const recognizer = new modelRef.current!.KaldiRecognizer(16000);
      recognizerRef.current = recognizer;

      recognizer.on("result", (msg: any) => {
        if (msg.result?.text) setTranscript(msg.result.text);
      });
      recognizer.on("partialresult", (msg: any) => {
        if (msg.result?.partial) setTranscript(msg.result.partial);
      });

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (!listening) return;
        const input = e.inputBuffer.getChannelData(0);
        const resampled = downsampleBuffer(input, audioContext.sampleRate, 16000);
        recognizer.acceptWaveformFloat(resampled, 16000);
      };

      processor.connect(audioContext.destination);
      source.connect(processor);
      processorRef.current = processor;

    //   startVisualizer(stream);
      startTimer();
      setListening(true);
    } catch (err) {
      console.error("Error starting recognition:", err);
      alert("Failed to capture display audio. Please ensure a tab with audio is shared.");
      stopMediaStream();
      stopVisualizer();
      stopTimer();
      setListening(false);
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    if (!listening) return;

    try {
      recognizerRef.current?.remove();
      processorRef.current?.disconnect();
      
      // If there's a transcript and it's different from the last one, add it as a message
      if (transcript && transcript !== lastTranscriptRef.current) {
        props?.onTranscriptionComplete?.(transcript);
        lastTranscriptRef.current = transcript;
      }
    } catch (err) {
      console.error("Error stopping recognition:", err);
    } finally {
      recognizerRef.current = null;
      processorRef.current = null;
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

  useEffect(() => {
    return () => {
      stopListening();
      modelRef.current?.terminate();
      modelRef.current = null;
    };
  }, [stopListening]);

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
