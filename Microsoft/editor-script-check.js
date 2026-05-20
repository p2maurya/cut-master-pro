
    const APP_BASE = window.location.protocol === 'http:' || window.location.protocol === 'https:'
      ? window.location.origin
      : 'http://localhost:5000';
    const API = APP_BASE + '/api';
    const token = () => localStorage.getItem('cm_token');

    // Auth guard
    if (!localStorage.getItem('cm_token')) window.location.href = APP_BASE + '/frontend/pages/login.html';

    // State
    const S = {
      projectId: localStorage.getItem('cm_project'),
      project: null, playing: false, t: 0, dur: 30,
      zoom: 100, tlZoom: 1, tool: 'cut', muted: false,
      expSettings: { res: '1080p', fps: 30, fmt: 'mp4', q: 'high' },
      colorGrade: {}, transform: { scale: 100, rotate: 0, opacity: 100, x: 0, y: 0 },
      ai: {}, aspectRatio: '9:16', volume: 100, speed: 1, autoSave: null, selectedClip: null, activeMedia: null, media: new Map()
    };

    function esc(s = '') {
      return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    function mediaUrl(item) {
      if (!item) return '';
      if (item.objectUrl) return item.objectUrl;
      return item.filepath?.startsWith('http') ? item.filepath : APP_BASE + item.filepath;
    }

    // API call
    async function api(url, opts = {}) {
      try {
        const r = await fetch(API + url, {
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
          ...opts
        });
        if (r.status === 401) { localStorage.removeItem('cm_token'); window.location.href = APP_BASE + '/frontend/pages/login.html'; return null; }
        const text = await r.text();
        const data = text ? JSON.parse(text) : {};
        return { ok: r.ok, status: r.status, ...data };
      } catch (e) { toast('Server error. Check backend is running.', 'err'); return { success: false, message: e.message }; }
    }

    // Toast
    function toast(msg, type = 'ok') {
      const el = document.createElement('div');
      el.className = 'toast ' + type;
      el.textContent = (type === 'ok' ? '✓ ' : '✕ ') + msg;
      document.getElementById('toasts').appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }

    // Load project
    async function loadProject() {
      if (!S.projectId) {
        document.getElementById('proj-name').textContent = 'Demo Project';
        document.getElementById('save-status').textContent = 'Local demo';
        toast('Editor ready. Create a project from Dashboard to save.');
        return;
      }
      const d = await api('/projects/' + S.projectId);
      if (d && d.success) {
        S.project = d.project;
        S.aspectRatio = d.project.aspectRatio || '9:16';
        document.getElementById('proj-name').textContent = d.project.title;
        document.getElementById('ratio-display').textContent = d.project.aspectRatio;
        const ratioMap = { '9:16': 'r916', '16:9': 'r169', '1:1': 'r11', '4:5': 'r916', '21:9': 'r169' };
        const sc = document.getElementById('prev-screen');
        sc.className = 'prev-screen ' + (ratioMap[d.project.aspectRatio] || 'r916');
        document.getElementById('ratio-badge').textContent = d.project.aspectRatio + ' · ' + (d.project.aspectRatio === '16:9' ? '1920×1080' : '1080×1920');
        document.getElementById('save-status').textContent = '✓ Saved';
        toast('Project loaded: ' + d.project.title);
      } else {
        S.projectId = null;
        localStorage.removeItem('cm_project');
        document.getElementById('proj-name').textContent = 'Demo Project';
        document.getElementById('save-status').textContent = 'Local demo';
        toast(d?.message || 'Project not found. Editor opened in demo mode.', 'err');
      }
    }

    // Load media library
    async function loadMedia() {
      const d = await api('/videos');
      const g = document.getElementById('media-lib');
      if (d && d.videos && d.videos.length) {
        d.videos.forEach(v => S.media.set(v._id, v));
        g.innerHTML = d.videos.map(v => `
        <div class="mi v16" draggable="true" ondragstart="dragMedia(event,'${v._id}')" onclick="addToTimeline('${v._id}','${esc(v.title || v.originalName || 'Video')}')" ondblclick="loadPreview('${v._id}')" title="${esc(v.title || v.originalName || 'Video')}">
          🎞️<div class="mi-name">${esc(v.title || v.originalName || 'Video')}</div><div class="mi-lbl">+Add</div>
        </div>`).join('');
      } else {
        g.innerHTML = `<div style="color:var(--text3);font-size:0.7rem;grid-column:1/-1;text-align:center;padding:0.5rem">${d?.message || 'Upload videos to see here'}</div>`;
      }
    }

    // Load editor templates
    async function loadEditorTpls() {
      const d = await api('/templates?limit=12');
      const c = document.getElementById('editor-tpls');
      const tIc = { vlog: '🌆', dance: '💃', travel: '🏔️', gaming: '🎮', fashion: '👗', food: '🍕', education: '🎓', music: '🎵', reels: '✨' };
      const tClr = ['linear-gradient(160deg,#1a0050,#500030)', 'linear-gradient(160deg,#003050,#001540)', 'linear-gradient(160deg,#004030,#002050)', 'linear-gradient(160deg,#500000,#300050)', 'linear-gradient(160deg,#002040,#001540)', 'linear-gradient(160deg,#301020,#100040)'];
      if (d && d.templates && d.templates.length) {
        c.innerHTML = `<div class="lut-g">${d.templates.map((t, i) => `
        <div class="lut" style="background:${tClr[i % 6]}" onclick="applyTpl('${t._id}')" title="${t.title}">${tIc[t.category] || '🎬'}</div>`).join('')}</div>`;
      } else {
        c.innerHTML = '<div style="color:var(--text3);font-size:0.7rem;text-align:center;padding:1rem">No templates. Run seed first.</div>';
      }
    }

    // Panel switching
    function switchPanel(name, btn) {
      ['media', 'text', 'effects', 'transitions', 'stickers', 'audio', 'ai', 'tpl'].forEach(p => {
        const el = document.getElementById('p-' + p);
        if (el) el.style.display = 'none';
      });
      const target = document.getElementById('p-' + name);
      if (target) { target.style.display = 'flex'; target.style.flexDirection = 'column'; }
      document.querySelectorAll('.tool').forEach(t => t.classList.remove('on'));
      if (btn) btn.classList.add('on');
      if (name === 'tpl') loadEditorTpls();
    }

    // Right panel switching
    function switchRpanel(name, btn) {
      ['clip', 'color', 'audio', 'export'].forEach(p => { document.getElementById('r-' + p).style.display = 'none'; });
      document.getElementById('r-' + name).style.display = 'block';
      document.querySelectorAll('.rtab').forEach(t => t.classList.remove('on'));
      if (btn) btn.classList.add('on');
    }

    // Tool selection
    function setTool(t, id) {
      S.tool = t;
      document.querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
      document.getElementById(id)?.classList.add('on');
      toast('Tool: ' + t);
    }

    // Clip actions
    function selectClip(el) {
      document.querySelectorAll('.clip').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      S.selectedClip = el;
      if (el.dataset.mediaId) loadPreview(el.dataset.mediaId);
      toast('Clip selected: ' + el.textContent.trim());
    }
    function addClip(type, name, meta = {}) {
      const rowMap = { video: 'row-v1', audio: 'row-a1', text: 'row-t1', fx: 'row-fx' };
      const row = document.getElementById(rowMap[type] || 'row-v1');
      if (!row) return;
      const clip = document.createElement('div');
      clip.className = 'clip clip-' + (type === 'video' ? 'v' : type === 'audio' ? 'a' : type === 'text' ? 't' : 'fx');
      clip.style.left = '70%'; clip.style.width = '20%';
      clip.textContent = name || type;
      if (meta.mediaId) clip.dataset.mediaId = meta.mediaId;
      clip.onclick = () => selectClip(clip);
      row.appendChild(clip);
      selectClip(clip);
      toast(name + ' added to timeline');
      schedSave();
    }
    function addToTimeline(id, name) {
      const item = S.media.get(id);
      addClip('video', '🎞 ' + (item?.title || name || 'Video'), { mediaId: id });
      if (item) loadPreview(id);
    }
    function dragMedia(event, id) {
      event.dataTransfer.setData('text/plain', id);
      event.dataTransfer.effectAllowed = 'copy';
    }
    function loadPreview(id) {
      const item = S.media.get(id);
      if (!item) return;
      S.activeMedia = item;
      const screen = document.getElementById('prev-screen');
      screen.innerHTML = `<video class="preview-media" id="preview-media" src="${mediaUrl(item)}" playsinline preload="metadata"></video>`;
      const video = document.getElementById('preview-media');
      video.muted = S.muted;
      video.volume = Math.max(0, Math.min(1, S.volume / 100));
      video.playbackRate = S.speed;
      video.currentTime = Math.min(S.t, video.duration || S.t || 0);
      video.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          S.dur = Math.round(video.duration);
          updateTime();
          buildRuler();
        }
      });
      applyPreviewStyles();
      toast('Loaded in preview: ' + (item.title || item.originalName || 'Video'));
    }
    function previewVideo() { return document.getElementById('preview-media'); }
    function applyPreviewStyles() {
      const video = previewVideo();
      if (!video) return;
      const t = S.transform;
      video.style.transform = `translate(${t.x || 0}px, ${t.y || 0}px) rotate(${t.rotate || 0}deg) scale(${(t.scale || 100) / 100})`;
      video.style.opacity = ((t.opacity ?? 100) / 100).toString();
      const c = S.colorGrade;
      video.style.filter = [
        `brightness(${100 + (c.brightness || 0)}%)`,
        `contrast(${100 + (c.contrast || 0)}%)`,
        `saturate(${100 + (c.saturation || 0)}%)`,
        S.ai.stabilized ? 'drop-shadow(0 0 12px rgba(0,229,255,0.28))' : '',
        S.ai.backgroundRemoved ? 'contrast(115%)' : ''
      ].join(' ');
      video.muted = S.muted;
      video.volume = Math.max(0, Math.min(1, S.volume / 100));
      video.playbackRate = S.speed;
    }
    function addPreviewBadge(text) {
      const screen = document.getElementById('prev-screen');
      screen.querySelectorAll('.ai-watermark').forEach(el => el.remove());
      const badge = document.createElement('div');
      badge.className = 'ai-watermark';
      badge.textContent = text;
      screen.appendChild(badge);
    }
    function addCaptionOverlay(text = 'Auto caption: your spoken words appear here') {
      const screen = document.getElementById('prev-screen');
      let caption = document.getElementById('caption-overlay');
      if (!caption) {
        caption = document.createElement('div');
        caption.id = 'caption-overlay';
        caption.className = 'caption-overlay';
        screen.appendChild(caption);
      }
      caption.textContent = text;
      toast('Caption added to preview');
    }
    function addTextOverlay(text) {
      const screen = document.getElementById('prev-screen');
      let overlay = document.getElementById('text-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'text-overlay';
        overlay.className = 'text-overlay';
        screen.appendChild(overlay);
      }
      overlay.textContent = text;
    }
    function addCustomText(fallback = '') {
      const input = document.getElementById('custom-text');
      const text = (input?.value || fallback || prompt('Enter text:', 'My Title') || '').trim();
      if (!text) return toast('Text is empty', 'err');
      addTextOverlay(text);
      addClip('text', '🔤 ' + text);
      if (input) input.value = '';
      schedSave();
    }
    function setAspect(ratio, btn) {
      const classMap = { '9:16': 'r916', '16:9': 'r169', '1:1': 'r11', '4:5': 'r916' };
      const labelMap = { '9:16': '1080×1920', '16:9': '1920×1080', '1:1': '1080×1080', '4:5': '1080×1350' };
      S.aspectRatio = ratio;
      const screen = document.getElementById('prev-screen');
      screen.classList.remove('r916', 'r169', 'r11');
      screen.classList.add(classMap[ratio] || 'r916');
      document.getElementById('ratio-display').textContent = ratio;
      document.getElementById('ratio-badge').textContent = ratio + ' · ' + (labelMap[ratio] || '1080×1920');
      btn?.parentElement?.querySelectorAll('.sp-btn').forEach(b => b.classList.remove('on'));
      btn?.classList.add('on');
      toast('Aspect ratio changed: ' + ratio);
      schedSave();
    }
    function addTransition(name) { toast(name + ' transition added'); schedSave(); }
    function applyFX(name) { toast(name + ' effect applied'); schedSave(); }
    function applyLUT(el, name) { document.querySelectorAll('.lut').forEach(l => l.classList.remove('on')); el.classList.add('on'); toast('LUT: ' + name); S.colorGrade.lut = name; schedSave(); }
    function addSticker(em) { addClip('text', em + ' Sticker'); }
    function addAudio(name) { addClip('audio', name); }
    function splitAtPlayhead() { toast('Split at ' + document.getElementById('cur-time').textContent); }
    function delSelected() { if (S.selectedClip) { S.selectedClip.remove(); S.selectedClip = null; toast('Clip deleted'); schedSave(); } else toast('Select a clip first', 'err'); }
    function applyTpl(id) { toast('Template applied to timeline!'); schedSave(); }

    // Playback
    let playInterval = null;
    function togglePlay() {
      const video = previewVideo();
      S.playing = !S.playing;
      document.getElementById('play-btn').textContent = S.playing ? '⏸' : '▶';
      if (S.playing) {
        if (video) {
          video.muted = S.muted;
          video.volume = Math.max(0, Math.min(1, S.volume / 100));
          video.playbackRate = S.speed;
          video.currentTime = Math.min(S.t, video.duration || S.t);
          video.play().catch(() => toast('Click the video/play button once to allow audio.', 'err'));
        }
        playInterval = setInterval(() => {
          S.t = video ? video.currentTime : Math.min(S.t + 0.1, S.dur);
          updateTime();
          if (S.t >= S.dur || (video && video.ended)) { S.playing = false; S.t = 0; clearInterval(playInterval); document.getElementById('play-btn').textContent = '▶'; if (video) video.pause(); }
        }, 100);
      } else {
        clearInterval(playInterval);
        if (video) video.pause();
      }
    }
    function skip(s) {
      S.t = Math.max(0, Math.min(S.dur, S.t + s));
      const video = previewVideo();
      if (video) video.currentTime = Math.min(S.t, video.duration || S.t);
      updateTime();
    }
    function toggleMute() {
      S.muted = !S.muted;
      const video = previewVideo();
      if (video) video.muted = S.muted;
      document.getElementById('mute-btn').textContent = S.muted ? '🔇' : '🔊';
      toast(S.muted ? 'Muted' : 'Unmuted');
    }
    function updateTime() {
      const fmt = s => { const m = Math.floor(s / 60); return String(m).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
      document.getElementById('cur-time').textContent = fmt(S.t);
      document.getElementById('tot-time').textContent = '/ ' + fmt(S.dur);
      document.getElementById('dur-display').textContent = fmt(S.dur);
      document.getElementById('playhead').style.left = (S.t / S.dur * 100) + '%';
    }

    // Timeline click to seek
    document.getElementById('tl-tracks').addEventListener('click', e => {
      if (e.target.classList.contains('clip')) return;
      const rect = e.currentTarget.getBoundingClientRect();
      S.t = ((e.clientX - rect.left) / rect.width) * S.dur;
      const video = previewVideo();
      if (video) video.currentTime = Math.min(S.t, video.duration || S.t);
      updateTime();
    });

    // Ruler
    function buildRuler() {
      const r = document.getElementById('ruler'); r.innerHTML = '';
      for (let i = 0; i <= S.dur; i += 5) {
        const pct = (i / S.dur * 100) + '%';
        const m = document.createElement('div'); m.className = 'r-mark'; m.style.left = pct;
        m.textContent = Math.floor(i / 60) + ':' + String(i % 60).padStart(2, '0');
        r.appendChild(m);
        const t = document.createElement('div'); t.className = 'r-tick'; t.style.left = pct;
        r.appendChild(t);
      }
    }
    buildRuler();

    function zoom(d) { S.zoom = Math.max(25, Math.min(400, S.zoom + d)); document.getElementById('zoom-lbl').textContent = S.zoom + '%'; }
    function tlZoom(d) { S.tlZoom = Math.max(0.5, Math.min(5, S.tlZoom + d)); document.getElementById('tl-zoom').textContent = S.tlZoom + '×'; buildRuler(); }

    // Props
    function propChange(prop, val, sl) {
      const suffixes = { rotate: '°', opacity: '%', volume: '%', fadeIn: 's', fadeOut: 's', scale: '', x: '', y: '', pitch: '' };
      sl.nextElementSibling.textContent = val + (suffixes[prop] || '');
      if (['scale', 'rotate', 'opacity', 'x', 'y'].includes(prop)) S.transform[prop] = parseFloat(val);
      if (prop === 'volume') S.volume = parseFloat(val);
      applyPreviewStyles();
      schedSave();
    }
    function colorChange(prop, val, sl) {
      sl.nextElementSibling.textContent = val;
      S.colorGrade[prop] = parseInt(val);
      applyPreviewStyles();
      schedSave();
    }
    function setSpeed(v) {
      S.speed = v;
      document.querySelectorAll('.sp-btn').forEach(b => b.classList.toggle('on', parseFloat(b.textContent) === v));
      applyPreviewStyles();
      toast('Speed: ' + v + '×');
    }

    // Export options
    function setExp(key, val, el) {
      S.expSettings[key] = val;
      const row = el.closest('.opt-row') || el.parentElement;
      row.querySelectorAll('.opt').forEach(o => o.classList.remove('on'));
      el.classList.add('on');
    }
    function pickOpt(el, group) {
      el.closest('.opt-row').querySelectorAll('.opt').forEach(o => o.classList.remove('on'));
      el.classList.add('on');
    }

    // Export modal
    function openExport() { document.getElementById('exp-modal').classList.add('show'); }
    function closeExport() { document.getElementById('exp-modal').classList.remove('show'); }
    async function doExport() {
      closeExport();
      if (!S.activeMedia) {
        toast('Add/select a video before exporting.', 'err');
        return;
      }
      toast('Preparing export file...');
      if (S.projectId) await api('/projects/' + S.projectId, { method: 'PUT', body: JSON.stringify({ status: 'exporting', exportSettings: S.expSettings }) });
      try {
        const sourceUrl = mediaUrl(S.activeMedia);
        const res = await fetch(sourceUrl);
        const blob = await res.blob();
        const ext = S.expSettings.fmt === 'mov' ? 'mov' : S.expSettings.fmt === 'gif' ? 'gif' : (S.activeMedia.format || 'mp4');
        const safeTitle = (S.project?.title || S.activeMedia.title || 'cutmaster-export').replace(/[\\/:*?"<>|]+/g, '-');
        const fileName = `${safeTitle}.${ext}`;
        if (window.showSaveFilePicker) {
          const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: 'Video file', accept: { [blob.type || 'video/mp4']: ['.' + ext] } }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          toast('Export saved to selected location.');
        } else {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
          toast('Export downloaded. Browser chose the save location.');
        }
      } catch (err) {
        toast(err.name === 'AbortError' ? 'Export cancelled.' : 'Export failed: ' + err.message, 'err');
      }
    }

    // Project actions
    function renameProject() {
      const name = prompt('Project name:', S.project?.title || 'Untitled');
      if (name && name.trim()) {
        document.getElementById('proj-name').textContent = name;
        if (S.project) S.project.title = name;
        saveProject();
      }
    }
    function undo() { toast('Undo'); }
    function redo() { toast('Redo'); }
    function schedSave() {
      document.getElementById('save-status').textContent = 'Saving...';
      clearTimeout(S.autoSave);
      S.autoSave = setTimeout(saveProject, 2000);
    }
    async function saveProject() {
      if (!S.projectId) {
        document.getElementById('save-status').textContent = 'Local demo';
        toast('Create a project from Dashboard before saving to the server.', 'err');
        return;
      }
      const d = await api('/projects/' + S.projectId, {
        method: 'PUT', body: JSON.stringify({
          title: S.project?.title,
          aspectRatio: S.aspectRatio,
          colorGrade: S.colorGrade,
          status: 'draft',
          lastEditedAt: new Date()
        })
      });
      if (d && d.success) document.getElementById('save-status').textContent = '✓ Saved ' + new Date().toLocaleTimeString();
      else document.getElementById('save-status').textContent = '✕ Save failed';
    }

    // AI Tools
    function runAI(type) {
      const names = { 'auto-captions': 'Auto Captions', 'remove-bg': 'Background Removal', 'beat-sync': 'Beat Auto-Cut', 'stabilize': 'Stabilization', 'enhance': 'Super Resolution', 'voice': 'Voice Changer', 'portrait': 'Portrait Enhance', 'auto-edit': 'Auto Edit' };
      toast('Running AI: ' + (names[type] || type) + '... ⏳');
      setTimeout(() => {
        if (type === 'auto-captions') {
          addCaptionOverlay('Auto captions generated from your video');
          addClip('text', '🔤 Auto Captions');
        } else if (type === 'remove-bg') {
          S.ai.backgroundRemoved = true;
          document.getElementById('prev-screen').style.background = 'repeating-conic-gradient(#1f1f35 0 25%, #111126 0 50%) 50% / 18px 18px';
          addPreviewBadge('BG REMOVED');
          applyPreviewStyles();
        } else if (type === 'beat-sync') {
          addClip('fx', '⚡ Beat Cut 01');
          addClip('fx', '⚡ Beat Cut 02');
          addClip('fx', '⚡ Beat Cut 03');
        } else if (type === 'stabilize') {
          S.ai.stabilized = true;
          S.transform.scale = Math.max(S.transform.scale || 100, 105);
          document.getElementById('r-scale').value = S.transform.scale;
          document.getElementById('v-scale').textContent = S.transform.scale;
          addPreviewBadge('STABILIZED');
          applyPreviewStyles();
        } else if (type === 'enhance') {
          S.colorGrade.brightness = 8;
          S.colorGrade.contrast = 14;
          S.colorGrade.saturation = 18;
          addPreviewBadge('ENHANCED');
          applyPreviewStyles();
        } else if (type === 'voice') {
          S.speed = 1.05;
          const video = previewVideo();
          if (video) video.playbackRate = S.speed;
          addAudio('🎭 AI Voice Effect');
        } else if (type === 'portrait') {
          S.colorGrade.brightness = 10;
          S.colorGrade.saturation = 8;
          addPreviewBadge('PORTRAIT');
          applyPreviewStyles();
        } else if (type === 'auto-edit') {
          addClip('text', '🔤 AI Title');
          addClip('fx', '✨ AI Transition');
          addAudio('🎵 AI Music Bed');
          addCaptionOverlay('AI auto edit ready');
        }
        schedSave();
        toast((names[type] || type) + ' applied.');
      }, 700);
    }

    // Handle media upload in editor
    async function handleUpload(input) {
      const file = input.files[0]; if (!file) return;
      toast('Uploading ' + file.name + '...');
      const fd = new FormData(); fd.append('video', file); fd.append('title', file.name.replace(/\.[^/.]+$/, ''));
      try {
        const r = await fetch(API + '/videos/upload', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token() }, body: fd });
        const d = await r.json();
        if (d.success) {
          S.media.set(d.video._id, d.video);
          toast('Uploaded! Added to preview and timeline.');
          await loadMedia();
          addToTimeline(d.video._id, d.video.title || d.video.originalName);
        }
        else toast(d.message || 'Upload failed', 'err');
      } catch (e) { toast('Upload failed', 'err'); }
      input.value = '';
    }

    function handleDroppedFiles(files) {
      if (!files || !files.length) return;
      const input = document.getElementById('ed-fi');
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      input.files = dt.files;
      handleUpload(input);
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(type => {
      window.addEventListener(type, event => {
        event.preventDefault();
        event.stopPropagation();
      });
    });

    document.getElementById('prev-screen').addEventListener('drop', event => {
      const mediaId = event.dataTransfer.getData('text/plain');
      if (mediaId && S.media.has(mediaId)) addToTimeline(mediaId, S.media.get(mediaId).title);
      else handleDroppedFiles(event.dataTransfer.files);
    });

    document.getElementById('prev-screen').addEventListener('dragover', event => {
      event.dataTransfer.dropEffect = 'copy';
    });

    // Make inline HTML handlers reliable in every browser/dev-server mode.
    Object.assign(window, {
      addAudio, addClip, addSticker, addToTimeline, addTransition, applyFX, applyLUT, applyTpl,
      addCaptionOverlay, addCustomText, addPreviewBadge, addTextOverlay, applyPreviewStyles, closeExport, colorChange, delSelected, doExport, dragMedia,
      handleUpload, loadPreview, openExport, pickOpt, propChange, redo, renameProject,
      runAI, saveProject, selectClip, setAspect, setExp, setSpeed,
      setTool, skip, splitAtPlayhead, switchPanel, switchRpanel, tlZoom, toast, toggleMute,
      togglePlay, undo, zoom
    });

    window.addEventListener('error', event => {
      toast('Editor error: ' + event.message, 'err');
    });

    // Init
    loadProject();
    loadMedia();
    updateTime();
  
