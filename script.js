document.addEventListener('DOMContentLoaded', function () {
    const prSlider = document.getElementById('pr');
    const toneDurSlider = document.getElementById('toneDur');
    const faSlider = document.getElementById('fa');
    const dfSlider = document.getElementById('df');
    const volumeSlider = document.getElementById('volume');
    const playPauseButton = document.getElementById('playPause');
    let isPlaying = false;
    let audioContext;
    let oscillatorA, oscillatorB;

    // Initialize Web Audio API
    function initAudio() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Function to play tones
    function playTones() {
        // Calculate the upper limit for tone duration
        const pr = parseFloat(prSlider.value);
        const maxDur = 1 / pr;
        let toneDur = parseFloat(toneDurSlider.value);
        toneDur = toneDur > maxDur ? maxDur : toneDur;

        // Calculate frequencies based on fA and DF
        const fA = parseFloat(faSlider.value);
        const df = parseFloat(dfSlider.value);
        const fB = fA * Math.pow(2, df / 12);

        // Create oscillators for A and B tones
        oscillatorA = audioContext.createOscillator();
        oscillatorB = audioContext.createOscillator();
        oscillatorA.frequency.setValueAtTime(fA, audioContext.currentTime);
        oscillatorB.frequency.setValueAtTime(fB, audioContext.currentTime);

        // Connect to volume control
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(parseFloat(volumeSlider.value), audioContext.currentTime);
        oscillatorA.connect(gainNode).connect(audioContext.destination);
        oscillatorB.connect(gainNode).connect(audioContext.destination);

        // Start the oscillators
        oscillatorA.start();
        oscillatorB.start();

        // Stop the oscillators after duration
        oscillatorA.stop(audioContext.currentTime + toneDur);
        oscillatorB.stop(audioContext.currentTime + toneDur);

        // Set up next tones
        setTimeout(playTones, 1000 / pr);
    }

    // Play/Pause toggle
    playPauseButton.addEventListener('click', function () {
        if (!audioContext) {
            initAudio();
        }
        if (!isPlaying) {
            playTones();
            playPauseButton.textContent = 'Pause';
        } else {
            // Pause the audio
            audioContext.suspend();
            playPauseButton.textContent = 'Play';
        }
        isPlaying = !isPlaying;
    });

    // Volume control
    volumeSlider.addEventListener('input', function () {
        if (audioContext && oscillatorA && oscillatorB) {
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(parseFloat(volumeSlider.value), audioContext.currentTime);
            oscillatorA.connect(gainNode).connect(audioContext.destination);
            oscillatorB.connect(gainNode).connect(audioContext.destination);
        }
    });
});
