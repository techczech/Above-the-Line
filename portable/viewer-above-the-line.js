(() => {
  const result = JSON.parse(document.getElementById('above-the-line-result').textContent);
  const copy = JSON.parse(document.getElementById('above-the-line-copy').textContent);
  const root = document.getElementById('annotation');
  const error = document.getElementById('speech-error');
  const voiceSelect = document.getElementById('voice');
  const populateVoices = () => {
    const previous = voiceSelect.value;
    voiceSelect.replaceChildren(new Option(copy.defaultVoice, ''));
    const names = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], {type:'language'}) : null;
    for (const voice of speechSynthesis.getVoices()) {
      const option = new Option(`${voice.name} (${voice.lang})`, voice.voiceURI);
      let languageName = '';
      try { languageName = names?.of(voice.lang.split('-')[0]) || ''; } catch {}
      option.selected = previous ? previous === voice.voiceURI : voice.lang.toLowerCase() === result.sourceLang.toLowerCase() || languageName.toLowerCase() === result.sourceLang.toLowerCase();
      voiceSelect.add(option);
    }
  };
  if ('speechSynthesis' in window) { populateVoices(); speechSynthesis.addEventListener('voiceschanged', populateVoices); }
  for (const name of ['translation', 'grammar', 'idiomatic']) {
    document.getElementById(`show-${name}`).addEventListener('change', event => root.classList.toggle(`hide-${name}`, !event.target.checked));
  }
  document.getElementById('read').addEventListener('click', () => {
    error.textContent = '';
    if (!('speechSynthesis' in window)) { error.textContent = copy.unsupported; return; }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(result.annotation.stanzas.flatMap(stanza => stanza.lines.map(line => line.words.map(word => word.original).join(' '))).join('\n'));
    const voice = speechSynthesis.getVoices().find(item => item.voiceURI === voiceSelect.value);
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
    utterance.onerror = () => { error.textContent = copy.speechError; };
    speechSynthesis.speak(utterance);
  });
  document.getElementById('stop').addEventListener('click', () => window.speechSynthesis?.cancel());
  document.getElementById('print').addEventListener('click', () => window.print());
  document.getElementById('download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'above-the-line-result.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
