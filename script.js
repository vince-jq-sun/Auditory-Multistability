let audioContext;
let bufferSource;
let isPlaying = false;
let gainNode;

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
  }
}

function updateSliderValue(sliderId, valueId) {
  const slider = document.getElementById(sliderId);
  const valueDisplay = document.getElementById(valueId);
  slider.addEventListener('input', function () {
    valueDisplay.textContent = this.value;
    if (isPlaying) {
      updateSequence(); // Update the sequence if it's playing
    }
  });
}

function createToneBuffer(fA, fB, toneDur, pr) {
  const sampleRate = audioContext.sampleRate;
  const toneLength = sampleRate * toneDur;
  const interval = sampleRate / pr;
  const silenceLength = interval - toneLength;
  const totalLength = interval * 4; // Length of one full sequence (ABA_)
  const bufferSize = totalLength * Math.ceil(20 / (4 / pr)); // 20 seconds of buffer

  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  // Function to fill buffer with a tone
  function fillTone(frequency, start, duration) {
    for (let i = 0; i < duration; i++) {
      data[start + i] += 0.5 * Math.sin(2 * Math.PI * frequency * (i / sampleRate));
    }
  }

  // Filling the buffer with the ABA_ sequence
  for (let time = 0; time < bufferSize; time += totalLength) {
    fillTone(fA, time, toneLength); // A
    fillTone(fB, time + interval, toneLength); // B
    fillTone(fA, time + 2 * interval, toneLength); // A
    // Silence is automatically inserted after the third tone
  }

  return buffer;
}

function playSequence() {
    if (bufferSource) {
      bufferSource.stop();
      bufferSource.disconnect();
    }

    const pr = parseInt(document.getElementById('pr').value);
    const userInputToneDur = parseFloat(document.getElementById('toneDur').value);
    const maxToneDur = 1 / pr; // Maximum allowed Tone Duration based on PR

    // Use the minimum of user input tone duration and the calculated maximum
    const actualToneDur = Math.min(userInputToneDur, maxToneDur);

    bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = createToneBuffer(
      parseInt(document.getElementById('fa').value),
      parseInt(document.getElementById('fa').value) * Math.pow(2, -parseInt(document.getElementById('df').value) / 12),
      actualToneDur, // Use the actual tone duration here
      pr
    );
    bufferSource.loop = true;

    gainNode.gain.value = parseFloat(document.getElementById('volume').value);
    bufferSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    bufferSource.start();
}


function updateSequence() {
    if (isPlaying) {
      playSequence(); // Restart the sequence with new parameters
    }
  }
  
  function togglePlayPause() {
    initAudioContext(); // Initialize Audio Context on user interaction
  
    const playPauseButton = document.getElementById('playPause');
    if (!isPlaying) {
      isPlaying = true;
      playPauseButton.textContent = 'Pause';
      playSequence();
    } else {
      isPlaying = false;
      playPauseButton.textContent = 'Play';
      if (bufferSource) {
        bufferSource.stop();
      }
    }
  }
  
  document.addEventListener('DOMContentLoaded', function () {
    // Set up sliders and event listeners
    updateSliderValue('pr', 'pr-value');
    updateSliderValue('toneDur', 'toneDur-value');
    updateSliderValue('fa', 'fa-value');
    updateSliderValue('df', 'df-value');
    updateSliderValue('volume', 'volume-value');
  
    // Setup play/pause button
    document.getElementById('playPause').addEventListener('click', togglePlayPause);
  
    // Adjust the volume
    document.getElementById('volume').addEventListener('input', function () {
      gainNode.gain.setValueAtTime(this.value, audioContext.currentTime);
      if (isPlaying) {
        updateSequence(); // Update the sequence if it's playing
      }
    });
  });