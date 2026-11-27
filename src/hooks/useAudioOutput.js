import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const OUTPUT_STORAGE_KEY = 'nothing-audio:outputDeviceId';
const DEFAULT_OUTPUT = { deviceId: '', label: 'System Default' };

function readSavedSinkId() {
  try {
    return localStorage.getItem(OUTPUT_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function writeSavedSinkId(deviceId) {
  try {
    localStorage.setItem(OUTPUT_STORAGE_KEY, deviceId || '');
  } catch {
    // Ignore storage errors in private/restricted browser contexts.
  }
}

export function useAudioOutput({ audio, setContextSinkIdRef, onToast }) {
  const [devices, setDevices] = useState([DEFAULT_OUTPUT]);
  const [selectedId, setSelectedId] = useState(readSavedSinkId);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const pickedDevicesRef = useRef(new Map());
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

  const supported = useMemo(() => (
    typeof window !== 'undefined'
    && (
      (typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype)
      || (typeof AudioContext !== 'undefined' && 'setSinkId' in AudioContext.prototype)
    )
  ), []);

  const canSelectOutput = useMemo(() => (
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.selectAudioOutput === 'function'
  ), []);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      setDevices([DEFAULT_OUTPUT]);
      setNeedsUnlock(false);
      return [DEFAULT_OUTPUT];
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = allDevices.filter((item) => item.kind === 'audiooutput');
      const unlabeled = audioOutputs.some((item) => !item.label);
      setNeedsUnlock(audioOutputs.length <= 1 || unlabeled);

      const seenLabels = new Set();
      const nextDevices = [DEFAULT_OUTPUT];
      const defaultEntry = audioOutputs.find((item) => item.deviceId === 'default');
      const defaultLabel = defaultEntry?.label?.replace(/^Default\s*-\s*/i, '').trim() || '';

      audioOutputs.forEach((item) => {
        if (!item.label || item.deviceId === 'default' || item.deviceId === 'communications') return;
        const cleanLabel = item.label.trim();
        if (!cleanLabel || seenLabels.has(cleanLabel)) return;
        seenLabels.add(cleanLabel);
        nextDevices.push({ deviceId: item.deviceId, label: cleanLabel });
      });

      pickedDevicesRef.current.forEach((label, deviceId) => {
        if (deviceId && !nextDevices.some((item) => item.deviceId === deviceId)) {
          nextDevices.push({ deviceId, label });
        }
      });

      if (defaultLabel && nextDevices.length === 1) {
        nextDevices[0] = { deviceId: '', label: `Default (${defaultLabel})` };
      }

      setDevices(nextDevices);
      return nextDevices;
    } catch {
      setDevices([DEFAULT_OUTPUT]);
      return [DEFAULT_OUTPUT];
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    const mediaDevices = typeof navigator !== 'undefined' ? navigator.mediaDevices : null;
    if (!mediaDevices?.addEventListener) return undefined;
    mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  useEffect(() => {
    if (!audio || typeof audio.setSinkId !== 'function') return;
    audio.setSinkId(selectedId || '').catch((error) => {
      const hasContextSink = typeof AudioContext !== 'undefined' && typeof AudioContext.prototype.setSinkId === 'function';
      if (selectedId && !hasContextSink && (error?.name === 'NotFoundError' || error?.name === 'NotAllowedError')) {
        setSelectedId('');
        writeSavedSinkId('');
      }
    });
  }, [audio, selectedId]);

  const selectDevice = useCallback(async (deviceId, labelOverride) => {
    const nextId = deviceId || '';
    if (nextId && labelOverride) {
      pickedDevicesRef.current.set(nextId, labelOverride);
    }

    const attempts = [];
    if (setContextSinkIdRef?.current) {
      attempts.push(setContextSinkIdRef.current(nextId));
    }
    if (audio && typeof audio.setSinkId === 'function') {
      attempts.push(audio.setSinkId(nextId).then(() => true));
    }

    if (attempts.length > 0) {
      const results = await Promise.allSettled(attempts);
      const anyApplied = results.some((res) => res.status === 'fulfilled' && res.value === true);
      const anyRejected = results.some((res) => res.status === 'rejected');
      if (!anyApplied && anyRejected) {
        onToastRef.current?.('COULD NOT SWITCH OUTPUT DEVICE');
        if (nextId) {
          setSelectedId('');
          writeSavedSinkId('');
        }
        return;
      }
    }

    setSelectedId(nextId);
    writeSavedSinkId(nextId);
    const chosenLabel = labelOverride
      || devices.find((item) => item.deviceId === nextId)?.label
      || 'System Default';
    onToastRef.current?.(`OUTPUT: ${chosenLabel.toUpperCase()}`);
  }, [audio, devices, setContextSinkIdRef]);

  const promptDevicePicker = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    if (typeof navigator.mediaDevices.selectAudioOutput === 'function') {
      try {
        const picked = await navigator.mediaDevices.selectAudioOutput();
        if (picked?.deviceId) {
          const cleanLabel = picked.label?.trim() || 'Selected Output';
          pickedDevicesRef.current.set(picked.deviceId, cleanLabel);
          await refreshDevices();
          await selectDevice(picked.deviceId, cleanLabel);
        }
      } catch (error) {
        if (error?.name !== 'AbortError' && error?.name !== 'NotAllowedError') {
          onToastRef.current?.('COULD NOT OPEN OUTPUT PICKER');
        }
      }
      return;
    }

    if (typeof navigator.mediaDevices.getUserMedia === 'function') {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        if (error?.name !== 'AbortError') {
          onToastRef.current?.('AUDIO PERMISSION REQUIRED TO LIST DEVICES');
        }
        return;
      } finally {
        stream?.getTracks().forEach((track) => track.stop());
      }
      const updated = await refreshDevices();
      if (updated.length > 1) {
        onToastRef.current?.(`DETECTED ${updated.length - 1} OUTPUT DEVICES`);
      } else {
        onToastRef.current?.('ONLY SYSTEM DEFAULT OUTPUT AVAILABLE');
      }
    }
  }, [refreshDevices, selectDevice]);

  const selectedLabel = useMemo(() => {
    const match = devices.find((item) => item.deviceId === selectedId);
    if (match) return match.label;
    return pickedDevicesRef.current.get(selectedId) || 'System Default';
  }, [devices, selectedId]);

  return {
    devices,
    selectedId,
    selectedLabel,
    supported,
    needsUnlock,
    canSelectOutput,
    selectDevice,
    refreshDevices,
    promptDevicePicker,
  };
}
