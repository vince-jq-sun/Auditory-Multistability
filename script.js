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
  let toneLength = Math.floor(sampleRate * toneDur);
  let interval = Math.floor(sampleRate / pr);
  let silenceLength = interval - toneLength;

  if (3 * toneLength > interval * 3) {
    toneLength = Math.floor(interval / 3);
    silenceLength = interval - toneLength;
  }

  const totalLength = interval * 4; // Length of one full sequence (ABA_)
  const bufferSize = totalLength * Math.ceil(20 / (4 / pr)); // 20 seconds of buffer
  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  const rampSamples = Math.floor(sampleRate * 0.01); // 10 ms in samples

  // Function to fill buffer with a tone
  function fillTone(frequency, start, duration) {
    for (let i = 0; i < duration; i++) {
      let amplitude = 0.5; // Default amplitude

      // Ramping up
      if (i < rampSamples) {
        amplitude *= i / rampSamples;
      }

      // Ramping down
      if (i >= duration - rampSamples) {
        amplitude *= (duration - i) / rampSamples;
      }

      data[start + i] += amplitude * Math.sin(2 * Math.PI * frequency * (i / sampleRate));
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

  const fh = parseFloat(document.getElementById('fh').value);
  const df = parseFloat(document.getElementById('df').value);

  const fl = fh * Math.pow(2, -Math.abs(df) / 12);

  let fA, fB;
  if (df >= 0){
    fA = fh;
    fB = fl;
  }else{
    fA = fl;
    fB = fh;
  }
  // const fA = fh;
  // const fB = fh * Math.pow(2, df / 12);

  // Use the minimum of user input tone duration and the calculated maximum
  const actualToneDur = Math.min(userInputToneDur, maxToneDur);

  bufferSource = audioContext.createBufferSource();
  bufferSource.buffer = createToneBuffer(fA,fB,actualToneDur,pr);
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
  updateSliderValue('fh', 'fh-value');
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
