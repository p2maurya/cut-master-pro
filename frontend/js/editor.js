// ============================================
// CutMaster Pro - Video Editor
// CapCut-like functionality
// ============================================

// STATE MANAGEMENT
const editor = {
  projectId: new URLSearchParams(window.location.search).get('id'),
  currentTool: 'cut',
  timeline: [],
  selectedClipIndex: null,
  playhead: 0,
  isPlaying: false,
  zoom: 100,
  aspectRatio: '9:16',
  background: { type: 'color', value: '#000000' },
  effects: [],
  texts: [],
  transitions: [],
  undoStack: [],
  redoStack: [],
  
  // Video properties
  duration: 0,
  currentTime: 0,
  volume: 1,
  
  // UI state
  activePanel: 'media',
  textDraft: '',
  textStyle: 'basic',
  textColor: '#ffffff'
};

let video = null;
let canvas = null;
let ctx = null;

// ============================================
// INITIALIZATION
// ============================================
async function init() {
  // Check auth
  if (!api.isLoggedIn()) {
    window.location.href = '/frontend/pages/login.html';
    return;
  }

  // Load project
  if (!editor.projectId) {
    toast('No project ID provided', 'err');
    setTimeout(() => window.history.back(), 1500);
    return;
  }

  const projectRes = await api.getProject(editor.projectId);
  if (!projectRes.ok) {
    toast('Failed to load project', 'err');
    return;
  }

  const project = projectRes.project;
  document.getElementById('proj-name').textContent = project.name;
  
  // Restore project state
  if (project.data) {
    Object.assign(editor, project.data);
  }

  // Setup video element
  const videoContainer = document.querySelector('.prev-screen');
  video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  
  // Setup canvas for effects
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');

  // Load media library
  loadMediaLibrary();

  // Setup UI
  updateAspectRatioDisplay();
  renderTimeline();
  
  // Auto-save every 30 seconds
  setInterval(saveProject, 30000);
}

// ============================================
// MEDIA & UPLOADS
// ============================================
async function handleUpload(input) {
  const files = input.files;
  if (!files.length) return;

  for (let file of files) {
    const formData = new FormData();
    formData.append('video', file);

    toast('Uploading video...', 'ok');
    const res = await api.uploadVideo(formData);
    
    if (res.ok) {
      toast('Video uploaded successfully!', 'ok');
      loadMediaLibrary();
    } else {
      toast('Upload failed: ' + res.message, 'err');
    }
  }
  input.value = '';
}

async function loadMediaLibrary() {
  const videosRes = await api.getVideos();
  if (!videosRes.ok) return;

  const lib = document.getElementById('media-lib');
  lib.innerHTML = '';

  videosRes.videos.forEach(video => {
    const div = document.createElement('div');
    div.className = 'mi v16';
    div.title = 'Click to add to timeline';
    div.onclick = () => addToTimeline('clip', video.filename, video.url);
    
    const size = document.createElement('div');
    size.style.fontSize = '0.55rem';
    size.style.color = 'var(--text3)';
    size.textContent = api.formatBytes(video.size);
    
    const label = document.createElement('div');
    label.className = 'mi-lbl';
    label.textContent = '+Add';
    
    div.appendChild(size);
    div.appendChild(label);
    lib.appendChild(div);
  });
}

// ============================================
// TIMELINE OPERATIONS
// ============================================
function addToTimeline(type, name, url = '') {
  if (editor.timeline.length >= 20) {
    toast('Max 20 clips per project', 'err');
    return;
  }

  const clip = {
    id: Math.random().toString(36).substr(2, 9),
    type: type, // 'clip', 'audio', 'text', 'transition'
    name: name,
    url: url,
    startTime: editor.duration,
    duration: 5, // Default 5 seconds
    startFrame: 0,
    endFrame: Math.floor(5 * 24), // Assuming 24fps
    effects: [],
    volume: 1,
    muted: false
  };

  editor.timeline.push(clip);
  editor.duration += clip.duration;
  saveToUndo();
  renderTimeline();
  toast(`Added "${name}"`, 'ok');
}

function removeClip(index) {
  if (index < 0 || index >= editor.timeline.length) return;
  
  const clip = editor.timeline[index];
  editor.duration -= clip.duration;
  editor.timeline.splice(index, 1);
  
  saveToUndo();
  renderTimeline();
  toast('Clip removed', 'ok');
}

function trimClip(index, startFrame, endFrame) {
  if (index < 0 || index >= editor.timeline.length) return;
  
  const clip = editor.timeline[index];
  const oldDuration = clip.duration;
  
  clip.startFrame = startFrame;
  clip.endFrame = endFrame;
  clip.duration = (endFrame - startFrame) / 24; // 24fps
  
  editor.duration = editor.duration - oldDuration + clip.duration;
  
  saveToUndo();
  renderTimeline();
}

function splitClip(index, frame) {
  if (index < 0 || index >= editor.timeline.length) return;
  
  const clip = editor.timeline[index];
  if (frame <= clip.startFrame || frame >= clip.endFrame) return;

  const newClip = JSON.parse(JSON.stringify(clip));
  newClip.id = Math.random().toString(36).substr(2, 9);
  
  clip.endFrame = frame;
  clip.duration = (frame - clip.startFrame) / 24;
  
  newClip.startFrame = frame;
  newClip.duration = (newClip.endFrame - frame) / 24;
  newClip.startTime = clip.startTime + clip.duration;

  editor.timeline.splice(index + 1, 0, newClip);
  
  saveToUndo();
  renderTimeline();
  toast('Clip split', 'ok');
}

// ============================================
// TEXT & EFFECTS
// ============================================
function addCustomText() {
  const text = document.getElementById('custom-text').value.trim();
  if (!text) {
    toast('Please enter text', 'err');
    return;
  }

  const textObj = {
    id: Math.random().toString(36).substr(2, 9),
    type: 'text',
    content: text,
    style: editor.textStyle,
    color: editor.textColor,
    fontSize: 2,
    x: 50,
    y: 20,
    duration: 5,
    startTime: editor.duration,
    animation: 'none'
  };

  editor.texts.push(textObj);
  document.getElementById('custom-text').value = '';
  updateTextDraft();
  renderPreview();
  toast('Text added', 'ok');
}

function updateTextDraft() {
  const text = document.getElementById('custom-text').value || 'Your text preview';
  const preview = document.getElementById('text-draft-preview');
  preview.textContent = text;
  preview.style.color = editor.textColor;
  preview.style.fontWeight = editor.textStyle === 'title' ? 'bold' : 'normal';
}

function setTextStyle(style, btn) {
  editor.textStyle = style;
  document.querySelectorAll('[onclick*="setTextStyle"]').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  updateTextDraft();
}

function setTextColor(color, btn) {
  editor.textColor = color;
  document.querySelectorAll('.color-dot').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  updateTextDraft();
}

function applyFX(fxName) {
  if (!editor.selectedClipIndex) {
    toast('Select a clip first', 'err');
    return;
  }

  const clip = editor.timeline[editor.selectedClipIndex];
  clip.effects = clip.effects || [];
  clip.effects.push(fxName);

  saveToUndo();
  renderPreview();
  toast(`Effect "${fxName}" applied`, 'ok');
}

// ============================================
// TIMELINE RENDERING
// ============================================
function renderTimeline() {
  const tracks = document.querySelector('.tl-tracks');
  if (!tracks) return;

  const rulerHTML = createRuler();
  const tracksHTML = createTrackElements();

  tracks.innerHTML = rulerHTML + tracksHTML;
  updatePlayheadPosition();
  setupPlayback();
}

function createRuler() {
  const pixelsPerSecond = 60;
  const totalWidth = Math.max(600, editor.duration * pixelsPerSecond);
  
  let ruler = `<div class="ruler" style="width:${totalWidth}px">`;
  
  for (let i = 0; i <= editor.duration; i += 5) {
    const pos = i * pixelsPerSecond;
    ruler += `<div class="r-mark" style="left:${pos}px">${formatTime(i)}</div>`;
    ruler += `<div class="r-tick" style="left:${pos}px"></div>`;
  }

  ruler += '</div>';
  return ruler;
}

function createTrackElements() {
  let html = '';

  // Video track
  html += '<div class="tl-row">';
  editor.timeline.forEach((clip, idx) => {
    const selected = idx === editor.selectedClipIndex ? 'selected' : '';
    const left = clip.startTime * 60;
    const width = clip.duration * 60;
    
    html += `
      <div class="clip clip-${clip.type} ${selected}" 
           style="left:${left}px;width:${width}px"
           onclick="selectClip(${idx})"
           ondblclick="showClipEditor(${idx})">
        <span>${clip.name}</span>
      </div>
    `;
  });
  html += '</div>';

  // Audio track
  if (editor.timeline.some(c => c.type === 'audio')) {
    html += '<div class="tl-row">';
    editor.timeline.forEach((clip, idx) => {
      if (clip.type === 'audio') {
        const left = clip.startTime * 60;
        const width = clip.duration * 60;
        html += `<div class="clip clip-a" style="left:${left}px;width:${width}px">${clip.name}</div>`;
      }
    });
    html += '</div>';
  }

  // Playhead
  html += `<div class="playhead" style="left:${editor.playhead * 60}px;z-index:20"></div>`;

  return html;
}

function selectClip(index) {
  editor.selectedClipIndex = index;
  renderTimeline();
}

function updatePlayheadPosition() {
  const playhead = document.querySelector('.playhead');
  if (playhead) {
    playhead.style.left = (editor.playhead * 60) + 'px';
  }
}

// ============================================
// PREVIEW & PLAYBACK
// ============================================
async function renderPreview() {
  const screen = document.querySelector('.prev-screen');
  if (!screen) return;

  const aspectRatios = {
    '9:16': { w: 160, h: 284 },
    '16:9': { w: 380, h: 214 },
    '1:1': { w: 220, h: 220 },
    '4:5': { w: 210, h: 263 }
  };

  const ratio = aspectRatios[editor.aspectRatio] || { w: 160, h: 284 };
  
  canvas.width = ratio.w;
  canvas.height = ratio.h;

  // Draw background
  if (editor.background.type === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    // Simple gradient - can be enhanced
    ctx.fillStyle = editor.background.value || '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = editor.background.value || '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw texts
  editor.texts.forEach(text => {
    ctx.fillStyle = text.color || '#fff';
    ctx.font = `${text.fontSize * 10}px 'Outfit'`;
    ctx.textAlign = 'center';
    ctx.fillText(text.content, canvas.width / 2, canvas.height / 2);
  });

  // Update preview
  const img = canvas.toDataURL();
  screen.style.backgroundImage = `url(${img})`;
  screen.style.backgroundSize = 'cover';
}

function setupPlayback() {
  const playBtn = document.querySelector('.cb.play');
  if (playBtn) {
    playBtn.textContent = editor.isPlaying ? '⏸ Pause' : '▶ Play';
  }
}

function playVideo() {
  editor.isPlaying = !editor.isPlaying;
  
  if (editor.isPlaying) {
    const interval = setInterval(() => {
      editor.playhead += 0.016; // 60fps
      
      if (editor.playhead >= editor.duration) {
        editor.playhead = 0;
        editor.isPlaying = false;
        clearInterval(interval);
        setupPlayback();
        renderTimeline();
        return;
      }

      updatePlayheadPosition();
    }, 16);
  }

  setupPlayback();
}

// ============================================
// UI CONTROLS
// ============================================
function switchPanel(panel, btn) {
  editor.activePanel = panel;

  // Hide all panels
  document.querySelectorAll('[id^="p-"]').forEach(p => p.style.display = 'none');
  
  // Show selected
  const panelEl = document.getElementById(`p-${panel}`);
  if (panelEl) panelEl.style.display = 'flex';

  // Update buttons
  document.querySelectorAll('.tool').forEach(t => t.classList.remove('on'));
  btn.classList.add('on');
}

function setTool(tool, btnId) {
  editor.currentTool = tool;
  document.querySelectorAll('.tb-btn').forEach(b => b.classList.remove('on'));
  document.getElementById(btnId).classList.add('on');
}

function setBackground(type, value) {
  editor.background = { type, value };
  renderPreview();
  toast('Background updated', 'ok');
}

function selectAudio(name, el) {
  document.querySelectorAll('.audio-item').forEach(a => a.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('selected-bg-audio').textContent = name;
}

function addSelectedAudio() {
  const selected = document.querySelector('.audio-item.on');
  if (!selected) {
    toast('Select audio first', 'err');
    return;
  }
  
  const name = selected.querySelector('[style*="font-weight"]').textContent;
  addToTimeline('audio', name);
}

function addTransition(name) {
  if (!editor.selectedClipIndex) {
    toast('Select a clip first', 'err');
    return;
  }

  const transition = {
    name: name,
    duration: 0.5,
    clipIndex: editor.selectedClipIndex
  };

  editor.transitions.push(transition);
  saveToUndo();
  renderTimeline();
  toast(`Transition "${name}" added`, 'ok');
}

function generateCaptions() {
  const text = document.getElementById('caption-text').value || 'Auto-generated captions';
  document.getElementById('caption-text').value = text;
}

function applyCaptions() {
  const text = document.getElementById('caption-text').value;
  if (!text) {
    toast('Enter caption text', 'err');
    return;
  }

  addCustomText();
  document.getElementById('caption-text').value = '';
}

// ============================================
// PROJECT MANAGEMENT
// ============================================
async function saveProject() {
  if (!editor.projectId) return;

  const projectData = {
    timeline: editor.timeline,
    duration: editor.duration,
    aspectRatio: editor.aspectRatio,
    background: editor.background,
    texts: editor.texts,
    transitions: editor.transitions,
    effects: editor.effects,
    currentTime: editor.currentTime
  };

  const res = await api.saveProject(editor.projectId, { data: projectData });
  
  if (res.ok) {
    document.getElementById('save-status').textContent = '✓ Saved';
    setTimeout(() => {
      if (!editor.isPlaying) {
        document.getElementById('save-status').textContent = 'Auto-saving...';
      }
    }, 2000);
  }
}

async function renameProject() {
  const newName = prompt('Project name:', document.getElementById('proj-name').textContent);
  if (!newName) return;

  const res = await api.saveProject(editor.projectId, { name: newName });
  if (res.ok) {
    document.getElementById('proj-name').textContent = newName;
    toast('Project renamed', 'ok');
  }
}

function openExport() {
  document.querySelector('.overlay').classList.add('show');
}

function closeExport() {
  document.querySelector('.overlay').classList.remove('show');
}

async function exportVideo() {
  const format = document.querySelector('.opt.on')?.textContent || 'mp4';
  const resolution = document.querySelector('.sp-btns .sp-btn.on')?.textContent || '1080p';

  toast(`Exporting ${format.toUpperCase()} (${resolution})...`, 'ok');
  
  // Simulate export
  setTimeout(() => {
    toast('Export complete! Download started.', 'ok');
    closeExport();
  }, 3000);
}

// ============================================
// UNDO/REDO
// ============================================
function saveToUndo() {
  editor.undoStack.push(JSON.parse(JSON.stringify(editor.timeline)));
  editor.redoStack = [];
}

function undo() {
  if (editor.undoStack.length === 0) return;
  editor.redoStack.push(JSON.parse(JSON.stringify(editor.timeline)));
  editor.timeline = editor.undoStack.pop();
  renderTimeline();
  renderPreview();
}

function redo() {
  if (editor.redoStack.length === 0) return;
  editor.undoStack.push(JSON.parse(JSON.stringify(editor.timeline)));
  editor.timeline = editor.redoStack.pop();
  renderTimeline();
  renderPreview();
}

// ============================================
// UTILITIES
// ============================================
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateAspectRatioDisplay() {
  document.getElementById('ratio-display').textContent = editor.aspectRatio;
}

function updateDurationDisplay() {
  document.getElementById('dur-display').textContent = formatTime(editor.duration);
}

function toast(msg, type = 'ok') {
  const container = document.getElementById('toasts');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// EVENT LISTENERS
// ============================================
window.addEventListener('load', init);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') { e.preventDefault(); undo(); }
    if (e.key === 'y' || (e.shiftKey && e.key === 'z')) { e.preventDefault(); redo(); }
    if (e.key === 's') { e.preventDefault(); saveProject(); }
  }
  if (e.code === 'Space') {
    e.preventDefault();
    playVideo();
  }
  if (e.code === 'Delete') {
    if (editor.selectedClipIndex !== null) {
      removeClip(editor.selectedClipIndex);
      editor.selectedClipIndex = null;
    }
  }
});
