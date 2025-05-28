import { useState, useEffect, useCallback } from 'react';

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface Window {
  webkitSpeechRecognition: SpeechRecognitionConstructor;
}

interface AudioDevicesHook {
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  selectedCandidateInputDevice: string;
  selectedInterviewerInputDevice: string;
  selectedOutputDevice: string;
  setSelectedCandidateInputDevice: (deviceId: string) => void;
  setSelectedInterviewerInputDevice: (deviceId: string) => void;
  setSelectedOutputDevice: (deviceId: string) => void;
  isCandidateListening: boolean;
  isInterviewerListening: boolean;
  startCandidateListening: () => Promise<void>;
  startInterviewerListening: () => Promise<void>;
  stopCandidateListening: () => void;
  stopInterviewerListening: () => void;
  candidateTranscript: string;
  interviewerTranscript: string;
  onCandidateSilenceThreshold: (callback: (transcript: string) => void) => void;
  onInterviewerSilenceThreshold: (callback: (transcript: string) => void) => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  isScreenSharing: boolean;
}

const SILENCE_THRESHOLD = 2000; // 2 seconds of silence to consider speech ended

export const useAudioDevices = (): AudioDevicesHook => {
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [selectedCandidateInputDevice, setSelectedCandidateInputDevice] = useState<string>('');
  const [selectedInterviewerInputDevice, setSelectedInterviewerInputDevice] = useState<string>('');
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>('');
  const [isCandidateListening, setIsCandidateListening] = useState(false);
  const [isInterviewerListening, setIsInterviewerListening] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [candidateTranscript, setCandidateTranscript] = useState('');
  const [interviewerTranscript, setInterviewerTranscript] = useState('');
  const [candidateRecognition, setCandidateRecognition] = useState<SpeechRecognition | null>(null);
  const [interviewerRecognition, setInterviewerRecognition] = useState<SpeechRecognition | null>(null);
  const [candidateLastSpeechTime, setCandidateLastSpeechTime] = useState<number>(0);
  const [interviewerLastSpeechTime, setInterviewerLastSpeechTime] = useState<number>(0);
  const [candidateSilenceTimeout, setCandidateSilenceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [interviewerSilenceTimeout, setInterviewerSilenceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [candidateSilenceCallback, setCandidateSilenceCallback] = useState<((transcript: string) => void) | null>(null);
  const [interviewerSilenceCallback, setInterviewerSilenceCallback] = useState<((transcript: string) => void) | null>(null);
  const [candidateFinalTranscript, setCandidateFinalTranscript] = useState('');
  const [interviewerFinalTranscript, setInterviewerFinalTranscript] = useState('');
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mixedStream, setMixedStream] = useState<MediaStream | null>(null);

  // Get available audio devices
  const getAudioDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`,
        }));
      const outputs = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${device.deviceId.slice(0, 5)}`,
        }));

      setInputDevices(inputs);
      setOutputDevices(outputs);

      if (inputs.length > 0) {
        if (!selectedCandidateInputDevice) {
          setSelectedCandidateInputDevice(inputs[0].deviceId);
        }
        if (!selectedInterviewerInputDevice && inputs.length > 1) {
          setSelectedInterviewerInputDevice(inputs[1].deviceId);
        }
      }
      if (outputs.length > 0 && !selectedOutputDevice) {
        setSelectedOutputDevice(outputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting audio devices:', error);
    }
  }, [selectedCandidateInputDevice, selectedInterviewerInputDevice, selectedOutputDevice]);

  useEffect(() => {
    getAudioDevices();
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    };
  }, [getAudioDevices]);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    if (audioContext && audioContext.state !== 'closed') {
      try {
        audioContext.close();
      } catch (error) {
        console.error('Error closing audio context:', error);
      }
      setAudioContext(null);
    }
    setIsScreenSharing(false);
  }, [screenStream, audioContext]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Create audio context for mixing only if it doesn't exist
      if (!audioContext || audioContext.state === 'closed') {
        const context = new AudioContext();
        setAudioContext(context);
      }

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }, [audioContext, stopScreenShare]);

  const mixStreams = useCallback((micStream: MediaStream, screenStream: MediaStream) => {
    if (!audioContext || audioContext.state === 'closed') {
      console.warn('AudioContext is not available or closed');
      return null;
    }

    try {
      const destination = audioContext.createMediaStreamDestination();
      
      // Add mic source
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);

      // Add screen share audio source if available
      if (screenStream.getAudioTracks().length > 0) {
        const screenSource = audioContext.createMediaStreamSource(screenStream);
        screenSource.connect(destination);
      }

      // Combine audio tracks
      return new MediaStream([
        ...destination.stream.getAudioTracks(),
        ...screenStream.getVideoTracks(),
      ]);
    } catch (error) {
      console.error('Error mixing streams:', error);
      return null;
    }
  }, [audioContext]);

  const startCandidateListening = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      // Get mic stream first
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: selectedCandidateInputDevice }
        }
      });

      // Initialize speech recognition
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // Add error handling
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'aborted') {
          // Try to restart recognition if it was aborted
          try {
            recognition.stop();
            setTimeout(() => {
              recognition.start();
            }, 100);
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            stopCandidateListening();
          }
        } else {
          stopCandidateListening();
        }
      };

      // Add end event handling
      recognition.onend = () => {
        if (isCandidateListening) {
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            stopCandidateListening();
          }
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        const isFinal = event.results[current].isFinal;

        if (isFinal) {
          setCandidateFinalTranscript(prev => {
            const newTranscript = prev ? `${prev} ${transcript}` : transcript;
            setCandidateTranscript(newTranscript);
            return newTranscript;
          });
        } else {
          setCandidateTranscript(prev => {
            const interimTranscript = candidateFinalTranscript ? `${candidateFinalTranscript} ${transcript}` : transcript;
            return interimTranscript;
          });
        }

        setCandidateLastSpeechTime(Date.now());

        // Clear existing timeout
        if (candidateSilenceTimeout) {
          clearTimeout(candidateSilenceTimeout);
        }

        // Set new timeout for silence detection
        const timeout = setTimeout(() => {
          if (Date.now() - candidateLastSpeechTime >= SILENCE_THRESHOLD) {
            if (candidateSilenceCallback && candidateFinalTranscript) {
              candidateSilenceCallback(candidateFinalTranscript);
              setCandidateFinalTranscript('');
              setCandidateTranscript('');
            }
          }
        }, SILENCE_THRESHOLD);

        setCandidateSilenceTimeout(timeout);
      };

      // Start recognition
      recognition.start();
      setCandidateRecognition(recognition);
      setIsCandidateListening(true);

      // Mix with screen share if available
      if (screenStream) {
        const mixed = mixStreams(micStream, screenStream);
        if (mixed) {
          setMixedStream(mixed);
        }
      }

    } catch (error) {
      console.error('Error starting speech recognition:', error);
      stopCandidateListening();
    }
  }, [selectedCandidateInputDevice, candidateLastSpeechTime, candidateSilenceTimeout, candidateSilenceCallback, candidateFinalTranscript, screenStream, mixStreams]);

  const startInterviewerListening = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      // Get mic stream first
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: selectedInterviewerInputDevice }
        }
      });

      // Initialize speech recognition
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // Add error handling
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'aborted') {
          // Try to restart recognition if it was aborted
          try {
            recognition.stop();
            setTimeout(() => {
              recognition.start();
            }, 100);
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            stopInterviewerListening();
          }
        } else {
          stopInterviewerListening();
        }
      };

      // Add end event handling
      recognition.onend = () => {
        if (isInterviewerListening) {
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            stopInterviewerListening();
          }
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        const isFinal = event.results[current].isFinal;

        if (isFinal) {
          setInterviewerFinalTranscript(prev => {
            const newTranscript = prev ? `${prev} ${transcript}` : transcript;
            setInterviewerTranscript(newTranscript);
            return newTranscript;
          });
        } else {
          setInterviewerTranscript(prev => {
            const interimTranscript = interviewerFinalTranscript ? `${interviewerFinalTranscript} ${transcript}` : transcript;
            return interimTranscript;
          });
        }

        setInterviewerLastSpeechTime(Date.now());

        // Clear existing timeout
        if (interviewerSilenceTimeout) {
          clearTimeout(interviewerSilenceTimeout);
        }

        // Set new timeout for silence detection
        const timeout = setTimeout(() => {
          if (Date.now() - interviewerLastSpeechTime >= SILENCE_THRESHOLD) {
            if (interviewerSilenceCallback && interviewerFinalTranscript) {
              interviewerSilenceCallback(interviewerFinalTranscript);
              setInterviewerFinalTranscript('');
              setInterviewerTranscript('');
            }
          }
        }, SILENCE_THRESHOLD);

        setInterviewerSilenceTimeout(timeout);
      };

      // Start recognition
      recognition.start();
      setInterviewerRecognition(recognition);
      setIsInterviewerListening(true);

      // Mix with screen share if available
      if (screenStream) {
        const mixed = mixStreams(micStream, screenStream);
        if (mixed) {
          setMixedStream(mixed);
        }
      }

    } catch (error) {
      console.error('Error starting speech recognition:', error);
      stopInterviewerListening();
    }
  }, [selectedInterviewerInputDevice, interviewerLastSpeechTime, interviewerSilenceTimeout, interviewerSilenceCallback, interviewerFinalTranscript, screenStream, mixStreams]);

  const stopCandidateListening = useCallback(() => {
    if (candidateRecognition) {
      candidateRecognition.stop();
      setCandidateRecognition(null);
    }
    if (candidateSilenceTimeout) {
      clearTimeout(candidateSilenceTimeout);
      setCandidateSilenceTimeout(null);
    }
    setIsCandidateListening(false);
    setCandidateTranscript('');
    setCandidateFinalTranscript('');
  }, [candidateRecognition, candidateSilenceTimeout]);

  const stopInterviewerListening = useCallback(() => {
    if (interviewerRecognition) {
      interviewerRecognition.stop();
      setInterviewerRecognition(null);
    }
    if (interviewerSilenceTimeout) {
      clearTimeout(interviewerSilenceTimeout);
      setInterviewerSilenceTimeout(null);
    }
    setIsInterviewerListening(false);
    setInterviewerTranscript('');
    setInterviewerFinalTranscript('');
  }, [interviewerRecognition, interviewerSilenceTimeout]);

  const onCandidateSilenceThreshold = useCallback((callback: (transcript: string) => void) => {
    setCandidateSilenceCallback(() => callback);
  }, []);

  const onInterviewerSilenceThreshold = useCallback((callback: (transcript: string) => void) => {
    setInterviewerSilenceCallback(() => callback);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        try {
          audioContext.close();
        } catch (error) {
          console.error('Error closing audio context:', error);
        }
      }
      stopCandidateListening();
      stopInterviewerListening();
    };
  }, [screenStream, audioContext, stopCandidateListening, stopInterviewerListening]);

  return {
    inputDevices,
    outputDevices,
    selectedCandidateInputDevice,
    selectedInterviewerInputDevice,
    selectedOutputDevice,
    setSelectedCandidateInputDevice,
    setSelectedInterviewerInputDevice,
    setSelectedOutputDevice,
    isCandidateListening,
    isInterviewerListening,
    startCandidateListening,
    startInterviewerListening,
    stopCandidateListening,
    stopInterviewerListening,
    candidateTranscript,
    interviewerTranscript,
    onCandidateSilenceThreshold,
    onInterviewerSilenceThreshold,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
  };
}; 