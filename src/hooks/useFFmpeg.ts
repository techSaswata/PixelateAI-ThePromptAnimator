'use client';

import { useState, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface FFmpegHook {
  ffmpeg: FFmpeg | null;
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  convertToMp4: (videoBlob: Blob) => Promise<Blob>;
  trimVideo: (videoBlob: Blob, startTime: number, duration: number) => Promise<Blob>;
  mergeVideos: (videoBlobs: Blob[]) => Promise<Blob>;
  addAudio: (videoBlob: Blob, audioBlob: Blob) => Promise<Blob>;
}

export function useFFmpeg(): FFmpegHook {
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load FFmpeg on component mount
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        
        // Create a new FFmpeg instance
        const instance = new FFmpeg();
        
        // Load FFmpeg core
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await instance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        setFFmpeg(instance);
        setIsLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load FFmpeg'));
      } finally {
        setIsLoading(false);
      }
    };

    load();
    
    // Cleanup function
    return () => {
      if (ffmpeg) {
        ffmpeg.terminate();
      }
    };
  }, []);

  // Convert video to MP4
  const convertToMp4 = useCallback(async (videoBlob: Blob): Promise<Blob> => {
    if (!ffmpeg || !isLoaded) {
      throw new Error('FFmpeg is not loaded');
    }

    try {
      // Write input file to memory
      await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob));
      
      // Run FFmpeg command
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-c:a', 'aac',
        'output.mp4'
      ]);
      
      // Read the output file
      const data = await ffmpeg.readFile('output.mp4');
      
      // Convert to blob
      return new Blob([data], { type: 'video/mp4' });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to convert video'));
      throw err;
    }
  }, [ffmpeg, isLoaded]);

  // Trim video
  const trimVideo = useCallback(async (
    videoBlob: Blob,
    startTime: number,
    duration: number
  ): Promise<Blob> => {
    if (!ffmpeg || !isLoaded) {
      throw new Error('FFmpeg is not loaded');
    }

    try {
      // Write input file to memory
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));
      
      // Run FFmpeg command to trim video
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-ss', `${startTime}`,
        '-t', `${duration}`,
        '-c', 'copy',
        'output.mp4'
      ]);
      
      // Read the output file
      const data = await ffmpeg.readFile('output.mp4');
      
      // Convert to blob
      return new Blob([data], { type: 'video/mp4' });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to trim video'));
      throw err;
    }
  }, [ffmpeg, isLoaded]);

  // Merge videos
  const mergeVideos = useCallback(async (videoBlobs: Blob[]): Promise<Blob> => {
    if (!ffmpeg || !isLoaded || videoBlobs.length === 0) {
      throw new Error('FFmpeg is not loaded or no videos provided');
    }

    try {
      // Create a file list for concatenation
      let fileContent = '';
      
      // Write each video file to memory
      for (let i = 0; i < videoBlobs.length; i++) {
        const filename = `input${i}.mp4`;
        await ffmpeg.writeFile(filename, await fetchFile(videoBlobs[i]));
        fileContent += `file ${filename}\n`;
      }
      
      // Write the file list
      await ffmpeg.writeFile('filelist.txt', fileContent);
      
      // Run FFmpeg command to concatenate videos
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'filelist.txt',
        '-c', 'copy',
        'output.mp4'
      ]);
      
      // Read the output file
      const data = await ffmpeg.readFile('output.mp4');
      
      // Convert to blob
      return new Blob([data], { type: 'video/mp4' });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to merge videos'));
      throw err;
    }
  }, [ffmpeg, isLoaded]);

  // Add audio to video
  const addAudio = useCallback(async (videoBlob: Blob, audioBlob: Blob): Promise<Blob> => {
    if (!ffmpeg || !isLoaded) {
      throw new Error('FFmpeg is not loaded');
    }

    try {
      // Write input files to memory
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));
      await ffmpeg.writeFile('audio.mp3', await fetchFile(audioBlob));
      
      // Run FFmpeg command to add audio
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-i', 'audio.mp3',
        '-map', '0:v',
        '-map', '1:a',
        '-c:v', 'copy',
        '-shortest',
        'output.mp4'
      ]);
      
      // Read the output file
      const data = await ffmpeg.readFile('output.mp4');
      
      // Convert to blob
      return new Blob([data], { type: 'video/mp4' });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add audio'));
      throw err;
    }
  }, [ffmpeg, isLoaded]);

  return {
    ffmpeg,
    isLoaded,
    isLoading,
    error,
    convertToMp4,
    trimVideo,
    mergeVideos,
    addAudio
  };
} 