/* ========================================
   LUCIDE ICONS (CDN - demo only)
   ======================================== */
// Icon categories for filtering (will be populated dynamically from Lucide)
const ICON_CATEGORIES = {
  navigasjon: [],
  handlingar: [],
  kommunikasjon: [],
  media: [],
  grensesnitt: []
};

// Predefined category mappings (icon name -> category)
const ICON_CATEGORY_MAP = {
  // Navigation
  'home': 'navigasjon', 'search': 'navigasjon', 'menu': 'navigasjon', 'arrow-right': 'navigasjon',
  'arrow-left': 'navigasjon', 'chevron-down': 'navigasjon', 'chevron-up': 'navigasjon',
  'chevron-left': 'navigasjon', 'chevron-right': 'navigasjon', 'external-link': 'navigasjon',
  'arrow-up': 'navigasjon', 'arrow-down': 'navigasjon', 'move': 'navigasjon', 'maximize': 'navigasjon',
  'minimize': 'navigasjon', 'zoom-in': 'navigasjon', 'zoom-out': 'navigasjon', 'layout': 'navigasjon',
  'sidebar': 'navigasjon', 'columns': 'navigasjon', 'panel-left': 'navigasjon', 'panel-right': 'navigasjon',
  'panel-top': 'navigasjon', 'panel-bottom': 'navigasjon', 'compass': 'navigasjon', 'map': 'navigasjon',
  'map-pin': 'navigasjon', 'navigation': 'navigasjon', 'locate': 'navigasjon', 'crosshair': 'navigasjon',
  'target': 'navigasjon', 'corner-up-left': 'navigasjon', 'corner-up-right': 'navigasjon',
  'corner-down-left': 'navigasjon', 'corner-down-right': 'navigasjon', 'circle': 'navigasjon',
  'square': 'navigasjon', 'triangle': 'navigasjon', 'hexagon': 'navigasjon', 'pentagon': 'navigasjon',
  // Actions
  'plus': 'handlingar', 'check': 'handlingar', 'x': 'handlingar', 'edit': 'handlingar',
  'trash': 'handlingar', 'copy': 'handlingar', 'download': 'handlingar', 'upload': 'handlingar',
  'save': 'handlingar', 'undo': 'handlingar', 'redo': 'handlingar', 'refresh-cw': 'handlingar',
  'rotate-ccw': 'handlingar', 'rotate-cw': 'handlingar', 'scissors': 'handlingar',
  'clipboard': 'handlingar', 'file': 'handlingar', 'file-text': 'handlingar',
  'folder': 'handlingar', 'folder-open': 'handlingar', 'archive': 'handlingar',
  'package': 'handlingar', 'paperclip': 'handlingar', 'link': 'handlingar', 'unlink': 'handlingar',
  'bookmark': 'handlingar', 'star': 'handlingar', 'heart': 'handlingar',
  'thumbs-up': 'handlingar', 'thumbs-down': 'handlingar', 'flag': 'handlingar',
  'git-branch': 'handlingar', 'git-commit': 'handlingar', 'git-merge': 'handlingar',
  'git-pull-request': 'handlingar', 'git-fork': 'handlingar', 'layers': 'handlingar',
  // Communication
  'mail': 'kommunikasjon', 'message-circle': 'kommunikasjon', 'bell': 'kommunikasjon',
  'send': 'kommunikasjon', 'phone': 'kommunikasjon', 'message-square': 'kommunikasjon',
  'at-sign': 'kommunikasjon', 'share': 'kommunikasjon', 'share-2': 'kommunikasjon',
  'rss': 'kommunikasjon', 'send-horizontal': 'kommunikasjon', 'message-square-diff': 'kommunikasjon',
  'message-square-plus': 'kommunikasjon', 'message-square-quote': 'kommunikasjon',
  'messages-square': 'kommunikasjon', 'phone-call': 'kommunikasjon',
  'phone-incoming': 'kommunikasjon', 'phone-outgoing': 'kommunikasjon',
  'voicemail': 'kommunikasjon', 'mail-check': 'kommunikasjon', 'mail-open': 'kommunikasjon',
  'mail-plus': 'kommunikasjon', 'mail-x': 'kommunikasjon', 'bell-ring': 'kommunikasjon',
  'bell-off': 'kommunikasjon', 'message-square-heart': 'kommunikasjon',
  'message-square-text': 'kommunikasjon', 'message-text': 'kommunikasjon',
  'message-square-code': 'kommunikasjon', 'share-network': 'kommunikasjon',
  'message-square-reply': 'kommunikasjon', 'message-square-more': 'kommunikasjon',
  'messages-square-more': 'kommunikasjon', 'message-square-x': 'kommunikasjon',
  'message-square-check': 'kommunikasjon', 'phone-missed': 'kommunikasjon',
  'phone-off': 'kommunikasjon', 'phone-paused': 'kommunikasjon',
  'phone-incoming-call': 'kommunikasjon', 'phone-outgoing-call': 'kommunikasjon',
  // Media
  'image': 'media', 'play': 'media', 'music': 'media', 'camera': 'media',
  'video': 'media', 'volume': 'media', 'volume-2': 'media', 'volume-x': 'media',
  'mic': 'media', 'mic-off': 'media', 'film': 'media', 'radio': 'media',
  'tv': 'media', 'monitor': 'media', 'speaker': 'media', 'headphones': 'media',
  'pause': 'media', 'skip-back': 'media', 'skip-forward': 'media', 'rewind': 'media',
  'fast-forward': 'media', 'play-circle': 'media', 'music-2': 'media', 'music-3': 'media',
  'music-4': 'media', 'video-off': 'media', 'camera-off': 'media', 'mic-2': 'media',
  'monitor-off': 'media', 'monitor-speaker': 'media', 'monitor-play': 'media',
  'monitor-stop': 'media', 'monitor-up': 'media', 'monitor-x': 'media',
  'speaker-high': 'media', 'speaker-low': 'media', 'speaker-x': 'media',
  'headphones-off': 'media', 'headset': 'media', 'airplay': 'media', 'cast': 'media',
  'clapperboard': 'media', 'disc': 'media', 'film-strip': 'media', 'frame': 'media',
  'image-down': 'media', 'image-minus': 'media', 'image-off': 'media',
  'image-plus': 'media', 'image-up': 'media', 'music-off': 'media',
  'pause-circle': 'media', 'play-square': 'media', 'radio-receiver': 'media',
  'scan': 'media', 'scan-line': 'media', 'tv-2': 'media', 'vibrate': 'media',
  // UI
  'settings': 'grensesnitt', 'user': 'grensesnitt', 'lock': 'grensesnitt',
  'eye': 'grensesnitt', 'info': 'grensesnitt', 'alert-triangle': 'grensesnitt',
  'help-circle': 'grensesnitt', 'more-horizontal': 'grensesnitt', 'more-vertical': 'grensesnitt',
  'sliders': 'grensesnitt', 'toggle-left': 'grensesnitt', 'toggle-right': 'grensesnitt',
  'check-circle': 'grensesnitt', 'x-circle': 'grensesnitt', 'alert-circle': 'grensesnitt',
  'clock': 'grensesnitt', 'calendar': 'grensesnitt', 'moon': 'grensesnitt',
  'sun': 'grensesnitt', 'log-out': 'grensesnitt', 'log-in': 'grensesnitt',
  'user-plus': 'grensesnitt', 'user-minus': 'grensesnitt', 'users': 'grensesnitt',
  'shield': 'grensesnitt', 'shield-check': 'grensesnitt', 'shield-alert': 'grensesnitt',
  'shield-x': 'grensesnitt', 'shield-off': 'grensesnitt', 'lock-open': 'grensesnitt',
  'eye-off': 'grensesnitt', 'eye-closed': 'grensesnitt', 'user-check': 'grensesnitt',
  'user-cog': 'grensesnitt', 'user-x': 'grensesnitt', 'users-2': 'grensesnitt',
  'users-3': 'grensesnitt', 'user-crown': 'grensesnitt', 'user-circle': 'grensesnitt',
  'user-circle-2': 'grensesnitt', 'user-circle-check': 'grensesnitt',
  'user-circle-x': 'grensesnitt', 'user-circle-minus': 'grensesnitt',
  'user-circle-plus': 'grensesnitt', 'user-square': 'grensesnitt',
  'user-square-2': 'grensesnitt', 'user-square-check': 'grensesnitt',
  'user-square-x': 'grensesnitt', 'user-square-minus': 'grensesnitt',
  'user-square-plus': 'grensesnitt', 'fingerprint': 'grensesnitt', 'hand': 'grensesnitt',
  'hand-heart': 'grensesnitt', 'hand-helping': 'grensesnitt', 'hand-metal': 'grensesnitt',
  'handshake': 'grensesnitt', 'activity': 'grensesnitt', 'activity-square': 'grensesnitt',
  'alarm-clock': 'grensesnitt', 'anchor': 'grensesnitt', 'aperture': 'grensesnitt',
  'armchair': 'grensesnitt', 'asterisk': 'grensesnitt', 'battery': 'grensesnitt',
  'battery-charging': 'grensesnitt', 'battery-full': 'grensesnitt',
  'battery-low': 'grensesnitt', 'battery-medium': 'grensesnitt',
  'battery-warning': 'grensesnitt', 'book': 'grensesnitt', 'book-bookmark': 'grensesnitt',
  'book-check': 'grensesnitt', 'book-copy': 'grensesnitt', 'book-edit': 'grensesnitt',
  'book-heart': 'grensesnitt', 'book-lock': 'grensesnitt', 'book-minus': 'grensesnitt',
  'book-open': 'grensesnitt', 'book-plus': 'grensesnitt', 'book-text': 'grensesnitt',
  'book-x': 'grensesnitt', 'bookmark-check': 'grensesnitt', 'bookmark-minus': 'grensesnitt',
  'bookmark-plus': 'grensesnitt', 'bookmark-x': 'grensesnitt', 'bot': 'grensesnitt',
  'box': 'grensesnitt', 'brain': 'grensesnitt', 'briefcase': 'grensesnitt',
  'building': 'grensesnitt', 'building-2': 'grensesnitt', 'calculator': 'grensesnitt',
  'calendar-check': 'grensesnitt', 'calendar-clock': 'grensesnitt',
  'calendar-days': 'grensesnitt', 'calendar-heart': 'grensesnitt',
  'calendar-minus': 'grensesnitt', 'calendar-off': 'grensesnitt',
  'calendar-plus': 'grensesnitt', 'calendar-range': 'grensesnitt',
  'calendar-search': 'grensesnitt', 'calendar-x': 'grensesnitt', 'check': 'grensesnitt',
  'check-circle-2': 'grensesnitt', 'check-square': 'grensesnitt', 'circle': 'grensesnitt',
  'circle-dollar-sign': 'grensesnitt', 'circle-dot': 'grensesnitt',
  'circle-slash': 'grensesnitt', 'circle-user': 'grensesnitt',
  'circle-user-round': 'grensesnitt', 'clipboard': 'grensesnitt',
  'clipboard-check': 'grensesnitt', 'clipboard-copy': 'grensesnitt',
  'clipboard-edit': 'grensesnitt', 'clipboard-list': 'grensesnitt',
  'clipboard-paste': 'grensesnitt', 'clipboard-x': 'grensesnitt', 'clock-1': 'grensesnitt',
  'clock-10': 'grensesnitt', 'clock-11': 'grensesnitt', 'clock-12': 'grensesnitt',
  'clock-2': 'grensesnitt', 'clock-3': 'grensesnitt', 'clock-4': 'grensesnitt',
  'clock-5': 'grensesnitt', 'clock-6': 'grensesnitt', 'clock-7': 'grensesnitt',
  'clock-8': 'grensesnitt', 'clock-9': 'grensesnitt', 'clone': 'grensesnitt',
  'cloud': 'grensesnitt', 'cloud-cog': 'grensesnitt', 'cloud-drizzle': 'grensesnitt',
  'cloud-fog': 'grensesnitt', 'cloud-hail': 'grensesnitt', 'cloud-lightning': 'grensesnitt',
  'cloud-moon': 'grensesnitt', 'cloud-moon-rain': 'grensesnitt', 'cloud-off': 'grensesnitt',
  'cloud-rain': 'grensesnitt', 'cloud-rain-wind': 'grensesnitt', 'cloud-snow': 'grensesnitt',
  'cloud-sun': 'grensesnitt', 'cloud-sun-rain': 'grensesnitt', 'cloudy': 'grensesnitt',
  'code': 'grensesnitt', 'code-2': 'grensesnitt', 'code-copyleft': 'grensesnitt',
  'code-copyright': 'grensesnitt', 'cog': 'grensesnitt', 'coins': 'grensesnitt',
  'combine': 'grensesnitt', 'command': 'grensesnitt', 'component': 'grensesnitt',
  'computer': 'grensesnitt', 'contact': 'grensesnitt', 'container': 'grensesnitt',
  'contrast': 'grensesnitt', 'copy': 'grensesnitt', 'copy-check': 'grensesnitt',
  'copy-minus': 'grensesnitt', 'copy-plus': 'grensesnitt', 'copy-slash': 'grensesnitt',
  'copy-x': 'grensesnitt', 'copyright': 'grensesnitt', 'cpu': 'grensesnitt',
  'credit-card': 'grensesnitt', 'crop': 'grensesnitt', 'cross': 'grensesnitt',
  'crown': 'grensesnitt', 'currency': 'grensesnitt', 'database': 'grensesnitt',
  'database-backup': 'grensesnitt', 'database-zap': 'grensesnitt', 'delete': 'grensesnitt',
  'diamond': 'grensesnitt', 'divide': 'grensesnitt', 'divide-circle': 'grensesnitt',
  'divide-square': 'grensesnitt', 'dollar-sign': 'grensesnitt', 'download': 'grensesnitt',
  'download-cloud': 'grensesnitt', 'droplet': 'grensesnitt', 'droplets': 'grensesnitt',
  'edit': 'grensesnitt', 'edit-2': 'grensesnitt', 'edit-3': 'grensesnitt',
  'equal': 'grensesnitt', 'equal-not': 'grensesnitt', 'eraser': 'grensesnitt',
  'euro': 'grensesnitt', 'expand': 'grensesnitt', 'external-link': 'grensesnitt',
  'file': 'grensesnitt', 'file-audio': 'grensesnitt', 'file-code': 'grensesnitt',
  'file-csv': 'grensesnitt', 'file-diff': 'grensesnitt', 'file-digit': 'grensesnitt',
  'file-down': 'grensesnitt', 'file-heart': 'grensesnitt', 'file-image': 'grensesnitt',
  'file-input': 'grensesnitt', 'file-json': 'grensesnitt', 'file-lock': 'grensesnitt',
  'file-lock-2': 'grensesnitt', 'file-minus': 'grensesnitt', 'file-minus-2': 'grensesnitt',
  'file-output': 'grensesnitt', 'file-pen': 'grensesnitt', 'file-pen-line': 'grensesnitt',
  'file-plus': 'grensesnitt', 'file-plus-2': 'grensesnitt', 'file-search': 'grensesnitt',
  'file-spreadsheet': 'grensesnitt', 'file-stack': 'grensesnitt', 'file-symlink': 'grensesnitt',
  'file-text': 'grensesnitt', 'file-up': 'grensesnitt', 'file-video': 'grensesnitt',
  'file-x': 'grensesnitt', 'file-x-2': 'grensesnitt', 'files': 'grensesnitt',
  'filter': 'grensesnitt', 'flag': 'grensesnitt', 'flag-off': 'grensesnitt',
  'flag-triangle-left': 'grensesnitt', 'flag-triangle-right': 'grensesnitt',
  'flame': 'grensesnitt', 'flame-kindling': 'grensesnitt', 'flashlight': 'grensesnitt',
  'flashlight-off': 'grensesnitt', 'flask-conical': 'grensesnitt',
  'flask-round': 'grensesnitt', 'flower': 'grensesnitt', 'flower-2': 'grensesnitt',
  'flower-lotus': 'grensesnitt', 'flower-tulip': 'grensesnitt', 'focus': 'grensesnitt',
  'folder': 'grensesnitt', 'folder-down': 'grensesnitt', 'folder-git-2': 'grensesnitt',
  'folder-input': 'grensesnitt', 'folder-kanban': 'grensesnitt', 'folder-key': 'grensesnitt',
  'folder-lock': 'grensesnitt', 'folder-minus': 'grensesnitt', 'folder-open': 'grensesnitt',
  'folder-plus': 'grensesnitt', 'folder-root': 'grensesnitt', 'folder-symlink': 'grensesnitt',
  'folder-tree': 'grensesnitt', 'folder-up': 'grensesnitt', 'folder-up-down': 'grensesnitt',
  'folder-x': 'grensesnitt', 'form-input': 'grensesnitt', 'frame': 'grensesnitt',
  'frown': 'grensesnitt', 'fuel': 'grensesnitt', 'fullscreen': 'grensesnitt',
  'function-square': 'grensesnitt', 'gamepad': 'grensesnitt', 'gamepad-2': 'grensesnitt',
  'gauge': 'grensesnitt', 'gavel': 'grensesnitt', 'gem': 'grensesnitt',
  'ghost': 'grensesnitt', 'gift': 'grensesnitt', 'git-branch-plus': 'grensesnitt',
  'git-commit-vertical': 'grensesnitt', 'git-pull-request-arrow': 'grensesnitt',
  'git-pull-request-closed': 'grensesnitt', 'git-pull-request-create': 'grensesnitt',
  'git-pull-request-draft': 'grensesnitt', 'glass': 'grensesnitt',
  'glass-water': 'grensesnitt', 'glasses': 'grensesnitt', 'globe': 'grensesnitt',
  'globe-2': 'grensesnitt', 'graduation-cap': 'grensesnitt', 'grid': 'grensesnitt',
  'grip-horizontal': 'grensesnitt', 'grip-vertical': 'grensesnitt', 'hammer': 'grensesnitt',
  'hand-platter': 'grensesnitt', 'hard-drive': 'grensesnitt', 'hard-hat': 'grensesnitt',
  'hash': 'grensesnitt', 'haze': 'grensesnitt', 'heading': 'grensesnitt',
  'heading-1': 'grensesnitt', 'heading-2': 'grensesnitt', 'heading-3': 'grensesnitt',
  'heading-4': 'grensesnitt', 'heading-5': 'grensesnitt', 'heading-6': 'grensesnitt',
  'headphones-off': 'grensesnitt', 'heart-crack': 'grensesnitt',
  'heart-handshake': 'grensesnitt', 'heart-off': 'grensesnitt',
  'heart-pulse': 'grensesnitt', 'hexagon': 'grensesnitt', 'highlighter': 'grensesnitt',
  'history': 'grensesnitt', 'home-check': 'grensesnitt', 'home-minus': 'grensesnitt',
  'home-plus': 'grensesnitt', 'home-x': 'grensesnitt', 'hop-off': 'grensesnitt',
  'horizontal-rule': 'grensesnitt', 'hourglass': 'grensesnitt', 'import': 'grensesnitt',
  'inbox': 'grensesnitt', 'indent': 'grensesnitt', 'indent-decrease': 'grensesnitt',
  'indent-increase': 'grensesnitt', 'infinity': 'grensesnitt', 'inspect': 'grensesnitt',
  'italic': 'grensesnitt', 'japanese-yen': 'grensesnitt', 'joystick': 'grensesnitt',
  'key': 'grensesnitt', 'keyboard': 'grensesnitt', 'keyboard-music': 'grensesnitt',
  'lamp': 'grensesnitt', 'lamp-ceiling': 'grensesnitt', 'lamp-desk': 'grensesnitt',
  'lamp-floor': 'grensesnitt', 'lamp-wall-down': 'grensesnitt',
  'lamp-wall-up': 'grensesnitt', 'land-plot': 'grensesnitt', 'landmark': 'grensesnitt',
  'languages': 'grensesnitt', 'laptop': 'grensesnitt', 'laptop-2': 'grensesnitt',
  'lasso': 'grensesnitt', 'lattice': 'grensesnitt', 'layout': 'grensesnitt',
  'layout-dashboard': 'grensesnitt', 'layout-grid': 'grensesnitt',
  'layout-list': 'grensesnitt', 'layout-template': 'grensesnitt',
  'leaf': 'grensesnitt', 'library': 'grensesnitt', 'life-buoy': 'grensesnitt',
  'lightbulb': 'grensesnitt', 'lightbulb-off': 'grensesnitt', 'link': 'grensesnitt',
  'link-2': 'grensesnitt', 'link-2-off': 'grensesnitt', 'linkedin': 'grensesnitt',
  'list': 'grensesnitt', 'list-checks': 'grensesnitt', 'list-collapse': 'grensesnitt',
  'list-end': 'grensesnitt', 'list-filter': 'grensesnitt', 'list-music': 'grensesnitt',
  'list-ordered': 'grensesnitt', 'list-plus': 'grensesnitt', 'list-restart': 'grensesnitt',
  'list-start': 'grensesnitt', 'list-tree': 'grensesnitt', 'list-video': 'grensesnitt',
  'list-x': 'grensesnitt', 'loader': 'grensesnitt', 'loader-2': 'grensesnitt',
  'locate-fixed': 'grensesnitt', 'locate-off': 'grensesnitt', 'lock-keyhole': 'grensesnitt',
  'lock-open': 'grensesnitt', 'lollipop': 'grensesnitt', 'luggage': 'grensesnitt',
  'magnet': 'grensesnitt', 'mail-check': 'grensesnitt', 'mail-down': 'grensesnitt',
  'mail-open': 'grensesnitt', 'mail-plus': 'grensesnitt', 'mail-question': 'grensesnitt',
  'mail-remove': 'grensesnitt', 'mail-search': 'grensesnitt',
  'mail-warning': 'grensesnitt', 'mail-x': 'grensesnitt', 'mailbox': 'grensesnitt',
  'mails': 'grensesnitt', 'map-pin-off': 'grensesnitt', 'martini': 'grensesnitt',
  'maximize-2': 'grensesnitt', 'medal': 'grensesnitt', 'megaphone': 'grensesnitt',
  'megaphone-off': 'grensesnitt', 'meh': 'grensesnitt', 'merge': 'grensesnitt',
  'message-circle-dashed': 'grensesnitt', 'message-circle-off': 'grensesnitt',
  'message-square-dashed': 'grensesnitt', 'message-square-off': 'grensesnitt',
  'mic-2': 'grensesnitt', 'microscope': 'grensesnitt', 'microwave': 'grensesnitt',
  'milestone': 'grensesnitt', 'milk': 'grensesnitt', 'minimize-2': 'grensesnitt',
  'minus': 'grensesnitt', 'minus-circle': 'grensesnitt', 'minus-square': 'grensesnitt',
  'monitor-check': 'grensesnitt', 'monitor-dot': 'grensesnitt',
  'monitor-down': 'grensesnitt', 'monitor-off': 'grensesnitt',
  'monitor-pause': 'grensesnitt', 'monitor-play': 'grensesnitt',
  'monitor-slash': 'grensesnitt', 'monitor-speaker': 'grensesnitt',
  'monitor-stop': 'grensesnitt', 'monitor-up': 'grensesnitt',
  'monitor-x': 'grensesnitt', 'moon-star': 'grensesnitt', 'mountain': 'grensesnitt',
  'mountain-snow': 'grensesnitt', 'mouse': 'grensesnitt',
  'mouse-pointer-2': 'grensesnitt', 'mouse-pointer-click': 'grensesnitt',
  'mouse-pointer-off': 'grensesnitt', 'move-3d': 'grensesnitt',
  'move-diagonal': 'grensesnitt', 'move-diagonal-2': 'grensesnitt',
  'move-down': 'grensesnitt', 'move-down-left': 'grensesnitt',
  'move-down-right': 'grensesnitt', 'move-horizontal': 'grensesnitt',
  'move-left': 'grensesnitt', 'move-right': 'grensesnitt', 'move-up': 'grensesnitt',
  'move-up-left': 'grensesnitt', 'move-up-right': 'grensesnitt',
  'move-vertical': 'grensesnitt', 'music-2': 'grensesnitt', 'music-3': 'grensesnitt',
  'music-4': 'grensesnitt', 'music-off': 'grensesnitt', 'navigation-2': 'grensesnitt',
  'navigation-2-off': 'grensesnitt', 'navigation-off': 'grensesnitt',
  'network': 'grensesnitt', 'newspaper': 'grensesnitt', 'nfc': 'grensesnitt',
  'octagon': 'grensesnitt', 'option': 'grensesnitt', 'outdent': 'grensesnitt',
  'package': 'grensesnitt', 'package-2': 'grensesnitt', 'package-check': 'grensesnitt',
  'package-minus': 'grensesnitt', 'package-open': 'grensesnitt',
  'package-plus': 'grensesnitt', 'package-search': 'grensesnitt',
  'package-x': 'grensesnitt', 'paint-bucket': 'grensesnitt',
  'paint-bucket-2': 'grensesnitt', 'paintbrush': 'grensesnitt',
  'paintbrush-2': 'grensesnitt', 'palette': 'grensesnitt', 'palmtree': 'grensesnitt',
  'panel-bottom-close': 'grensesnitt', 'panel-left-close': 'grensesnitt',
  'panel-right-close': 'grensesnitt', 'panel-top-close': 'grensesnitt',
  'parachute': 'grensesnitt', 'pause-circle': 'grensesnitt',
  'pause-octagon': 'grensesnitt', 'pen': 'grensesnitt', 'pen-line': 'grensesnitt',
  'pen-square': 'grensesnitt', 'pen-tool': 'grensesnitt', 'pencil': 'grensesnitt',
  'percent': 'grensesnitt', 'person-standing': 'grensesnitt', 'phone-x': 'grensesnitt',
  'pi': 'grensesnitt', 'pickaxe': 'grensesnitt', 'piggy-bank': 'grensesnitt',
  'pilcrow': 'grensesnitt', 'pin': 'grensesnitt', 'pin-off': 'grensesnitt',
  'pipette': 'grensesnitt', 'pizza': 'grensesnitt', 'plane': 'grensesnitt',
  'plane-landing': 'grensesnitt', 'plane-takeoff': 'grensesnitt', 'planet': 'grensesnitt',
  'plant': 'grensesnitt', 'play-circle': 'grensesnitt', 'play-square': 'grensesnitt',
  'plug': 'grensesnitt', 'plug-2': 'grensesnitt', 'plug-2-off': 'grensesnitt',
  'plug-zap': 'grensesnitt', 'plus-circle': 'grensesnitt', 'plus-octagon': 'grensesnitt',
  'plus-square': 'grensesnitt', 'pocket': 'grensesnitt', 'pocket-knife': 'grensesnitt',
  'podcast': 'grensesnitt', 'pointer': 'grensesnitt', 'pound-sterling': 'grensesnitt',
  'power': 'grensesnitt', 'power-off': 'grensesnitt', 'presentation': 'grensesnitt',
  'printer': 'grensesnitt', 'printer-check': 'grensesnitt', 'projector': 'grensesnitt',
  'pulse': 'grensesnitt', 'puzzle': 'grensesnitt', 'qr-code': 'grensesnitt',
  'quote': 'grensesnitt', 'rabbit': 'grensesnitt', 'radar': 'grensesnitt',
  'radio-receiver': 'grensesnitt', 'radius': 'grensesnitt', 'rainbow': 'grensesnitt',
  'range': 'grensesnitt', 'rat': 'grensesnitt', 'ratio': 'grensesnitt',
  'read': 'grensesnitt', 'receipt': 'grensesnitt',
  'rectangle-horizontal': 'grensesnitt', 'rectangle-vertical': 'grensesnitt',
  'recycle': 'grensesnitt', 'redo-2': 'grensesnitt', 'refresh-ccw': 'grensesnitt',
  'refresh-cw': 'grensesnitt', 'refrigerator': 'grensesnitt', 'regex': 'grensesnitt',
  'remove-formatting': 'grensesnitt', 'repeat': 'grensesnitt', 'repeat-1': 'grensesnitt',
  'repeat-2': 'grensesnitt', 'replace': 'grensesnitt', 'reply': 'grensesnitt',
  'reply-all': 'grensesnitt', 'ribbon': 'grensesnitt', 'rocket': 'grensesnitt',
  'rocking-chair': 'grensesnitt', 'roller-coaster': 'grensesnitt',
  'rss': 'grensesnitt', 'ruler': 'grensesnitt', 'russian-ruble': 'grensesnitt',
  'sack': 'grensesnitt', 'sack-dollar': 'grensesnitt', 'scale': 'grensesnitt',
  'scale-3d': 'grensesnitt', 'scaling': 'grensesnitt', 'scan-face': 'grensesnitt',
  'scan-line': 'grensesnitt', 'scan-text': 'grensesnitt', 'scissors-line-dashed': 'grensesnitt',
  'school': 'grensesnitt', 'screen-share-off': 'grensesnitt', 'scroll': 'grensesnitt',
  'search-check': 'grensesnitt', 'search-code': 'grensesnitt',
  'search-slash': 'grensesnitt', 'search-x': 'grensesnitt', 'send-to-back': 'grensesnitt',
  'separator-horizontal': 'grensesnitt', 'separator-vertical': 'grensesnitt',
  'server': 'grensesnitt', 'server-cog': 'grensesnitt', 'server-crash': 'grensesnitt',
  'server-off': 'grensesnitt', 'settings-2': 'grensesnitt', 'share-2-off': 'grensesnitt',
  'share-3': 'grensesnitt', 'share-off': 'grensesnitt', 'sheet': 'grensesnitt',
  'shell': 'grensesnitt', 'shield-ellipsis': 'grensesnitt',
  'shield-question': 'grensesnitt', 'ship': 'grensesnitt', 'shirt': 'grensesnitt',
  'shopping-bag': 'grensesnitt', 'shopping-cart': 'grensesnitt',
  'shovel': 'grensesnitt', 'shower-head': 'grensesnitt', 'shrink': 'grensesnitt',
  'shuffle': 'grensesnitt', 'sidebar-close': 'grensesnitt',
  'sidebar-open': 'grensesnitt', 'sigma': 'grensesnitt', 'signal': 'grensesnitt',
  'signal-high': 'grensesnitt', 'signal-low': 'grensesnitt',
  'signal-medium': 'grensesnitt', 'signal-zero': 'grensesnitt', 'siren': 'grensesnitt',
  'skull': 'grensesnitt', 'slack': 'grensesnitt', 'slash': 'grensesnitt',
  'sliders-horizontal': 'grensesnitt', 'sliders-vertical': 'grensesnitt',
  'smartphone': 'grensesnitt', 'smartphone-charging': 'grensesnitt',
  'smartphone-nfc': 'grensesnitt', 'smile': 'grensesnitt', 'smile-plus': 'grensesnitt',
  'snowflake': 'grensesnitt', 'sofa': 'grensesnitt', 'soup': 'grensesnitt',
  'space': 'grensesnitt', 'speaker-high': 'grensesnitt', 'speaker-low': 'grensesnitt',
  'speaker-x': 'grensesnitt', 'speech': 'grensesnitt', 'spell-check': 'grensesnitt',
  'spider': 'grensesnitt', 'split': 'grensesnitt', 'split-square-horizontal': 'grensesnitt',
  'split-square-vertical': 'grensesnitt', 'sprout': 'grensesnitt', 'square': 'grensesnitt',
  'square-0': 'grensesnitt', 'square-1': 'grensesnitt', 'square-2': 'grensesnitt',
  'square-3': 'grensesnitt', 'square-4': 'grensesnitt', 'square-5': 'grensesnitt',
  'square-6': 'grensesnitt', 'square-7': 'grensesnitt', 'square-8': 'grensesnitt',
  'square-9': 'grensesnitt', 'square-dashed': 'grensesnitt', 'square-dot': 'grensesnitt',
  'square-slash': 'grensesnitt', 'square-stack': 'grensesnitt',
  'squirrel': 'grensesnitt', 'stamp': 'grensesnitt', 'star-half': 'grensesnitt',
  'star-off': 'grensesnitt', 'stars': 'grensesnitt', 'step-back': 'grensesnitt',
  'step-forward': 'grensesnitt', 'stethoscope': 'grensesnitt', 'sticker': 'grensesnitt',
  'sticky-note': 'grensesnitt', 'stop-circle': 'grensesnitt', 'store': 'grensesnitt',
  'stretch-horizontal': 'grensesnitt', 'stretch-vertical': 'grensesnitt',
  'strikethrough': 'grensesnitt', 'subscript': 'grensesnitt', 'subtitles': 'grensesnitt',
  'sun-dim': 'grensesnitt', 'sun-medium': 'grensesnitt', 'sun-moon': 'grensesnitt',
  'sun-snow': 'grensesnitt', 'sun-wind': 'grensesnitt', 'sunrise': 'grensesnitt',
  'sunset': 'grensesnitt', 'superscript': 'grensesnitt', 'swatch-book': 'grensesnitt',
  'switch-camera': 'grensesnitt', 'sword': 'grensesnitt', 'syringe': 'grensesnitt',
  'table': 'grensesnitt', 'table-2': 'grensesnitt', 'tablet': 'grensesnitt',
  'tag': 'grensesnitt', 'tags': 'grensesnitt', 'tent': 'grensesnitt',
  'terminal': 'grensesnitt', 'terminal-square': 'grensesnitt',
  'text-cursor': 'grensesnitt', 'text-cursor-input': 'grensesnitt',
  'text-select': 'grensesnitt', 'thermometer': 'grensesnitt',
  'thermometer-snowflake': 'grensesnitt', 'thermometer-sun': 'grensesnitt',
  'thermometer-chevrons-down': 'grensesnitt',
  'thermometer-chevrons-up': 'grensesnitt', 'thermometer-simple': 'grensesnitt',
  'ticket': 'grensesnitt', 'timer': 'grensesnitt', 'timer-off': 'grensesnitt',
  'timer-reset': 'grensesnitt', 'tornado': 'grensesnitt', 'tower-off': 'grensesnitt',
  'toy-brick': 'grensesnitt', 'train-front': 'grensesnitt',
  'train-front-tunnel': 'grensesnitt', 'trash-2': 'grensesnitt',
  'trash-2-check': 'grensesnitt', 'trash-2-x': 'grensesnitt',
  'trash-check': 'grensesnitt', 'tree-deciduous': 'grensesnitt',
  'tree-pine': 'grensesnitt', 'trees': 'grensesnitt', 'trello': 'grensesnitt',
  'trending-down': 'grensesnitt', 'trending-up': 'grensesnitt',
  'triangle-alert': 'grensesnitt', 'truck': 'grensesnitt', 'turtle': 'grensesnitt',
  'tv-2': 'grensesnitt', 'type': 'grensesnitt', 'umbrella': 'grensesnitt',
  'umbrella-off': 'grensesnitt', 'underline': 'grensesnitt', 'undo-2': 'grensesnitt',
  'unlink-2': 'grensesnitt', 'unlock': 'grensesnitt', 'unplug': 'grensesnitt',
  'upload-cloud': 'grensesnitt', 'usb': 'grensesnitt', 'user-check': 'grensesnitt',
  'user-cog': 'grensesnitt', 'user-crown': 'grensesnitt', 'user-minus': 'grensesnitt',
  'user-plus': 'grensesnitt', 'user-x': 'grensesnitt', 'users-2': 'grensesnitt',
  'users-3': 'grensesnitt', 'utensils': 'grensesnitt', 'utensils-crossed': 'grensesnitt',
  'venetian-mask': 'grensesnitt', 'verified': 'grensesnitt', 'vibrate-off': 'grensesnitt',
  'video-off': 'grensesnitt', 'view': 'grensesnitt', 'voicemail': 'grensesnitt',
  'volume-1': 'grensesnitt', 'volume-2': 'grensesnitt', 'volume-x': 'grensesnitt',
  'vote': 'grensesnitt', 'wallet': 'grensesnitt', 'wallet-cards': 'grensesnitt',
  'wand': 'grensesnitt', 'wand-2': 'grensesnitt', 'watch': 'grensesnitt',
  'water': 'grensesnitt', 'water-drop': 'grensesnitt', 'water-off': 'grensesnitt',
  'waves': 'grensesnitt', 'webcam': 'grensesnitt', 'webhook': 'grensesnitt',
  'wifi': 'grensesnitt', 'wifi-off': 'grensesnitt', 'wind': 'grensesnitt',
  'wine': 'grensesnitt', 'wrap-text': 'grensesnitt', 'wrench': 'grensesnitt',
  'x-octagon': 'grensesnitt', 'x-square': 'grensesnitt', 'y': 'grensesnitt',
  'youtube': 'grensesnitt', 'zap': 'grensesnitt', 'zap-off': 'grensesnitt'
};

// Get all available Lucide icons from the global lucide object
let allIcons = [];

/* ========================================
   FUNCTIONS
   ======================================== */
function setTheme(themeName) {
  document.body.setAttribute('data-theme', themeName);
  localStorage.setItem('neobrutalisme_theme', themeName);

  // Also store mode (light/dark) for cross-page persistence across pages
  // with different theme pairs (e.g., talsmia uses candy/neon, others use classic/space)
  const lightTheme = document.body.getAttribute('data-light-theme') || 'classic';
  const darkTheme = document.body.getAttribute('data-dark-theme') || 'space';
  if (themeName === lightTheme) {
    localStorage.setItem('neobrutalisme_mode', 'light');
  } else if (themeName === darkTheme) {
    localStorage.setItem('neobrutalisme_mode', 'dark');
  }

  // Close dropdowns if they exist
  const themeMenu = document.getElementById('themeMenu');
  const dd = document.querySelector('.theme-dropdown');
  if (themeMenu) themeMenu.classList.remove('open');
  if (dd) dd.classList.remove('open');

  // Update active state in theme menu if it exists
  const btnArray = document.querySelectorAll('.theme-dropdown-item');
  btnArray.forEach(btn => {
    if (btn.getAttribute('onclick') === `setTheme('${themeName}')`) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Dispatch global event (useful for Web Components)
  // Ensure the event travels across boundaries
  const event = new CustomEvent('theme-changed', {
    detail: themeName,
    bubbles: true,
    composed: true
  });
  document.dispatchEvent(event);
  window.dispatchEvent(event);
}

// Initialize theme from localStorage on page load
// Prefer mode (light/dark) so each page can use its own theme pair
function applyStoredTheme() {
  if (!document.body) return;
  const savedMode = localStorage.getItem('neobrutalisme_mode');
  if (savedMode) {
    const lightTheme = document.body.getAttribute('data-light-theme') || 'classic';
    const darkTheme = document.body.getAttribute('data-dark-theme') || 'space';
    const themeToApply = savedMode === 'dark' ? darkTheme : lightTheme;
    document.body.setAttribute('data-theme', themeToApply);
    return;
  }
  const savedTheme = localStorage.getItem('neobrutalisme_theme');
  if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
  }
}
if (document.body) {
  applyStoredTheme();
} else {
  document.addEventListener('DOMContentLoaded', applyStoredTheme);
}

let scrollbarWidth = 0;

function openModal(id) {
  scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = scrollbarWidth + 'px';
  }
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

function closeModalOutside(event, id) {
  if (event.target.classList.contains('modal-overlay')) {
    closeModal(id);
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const dd = document.querySelector('.theme-dropdown');
  if (dd && !dd.contains(e.target)) {
    document.getElementById('themeMenu').classList.remove('open');
    dd.classList.remove('open');
  }
});

// Icon accordion
function buildAccordion() {
  const container = document.getElementById('iconAccordion');
  if (!container) return;

  // Get all available icons from Lucide CDN
  let allIconNames = [];
  if (typeof lucide !== 'undefined' && lucide.icons) {
    allIconNames = Object.keys(lucide.icons);
  }

  // Populate categories based on mapping
  Object.keys(ICON_CATEGORIES).forEach(cat => ICON_CATEGORIES[cat] = []);
  const uncategorized = [];

  allIconNames.forEach(iconName => {
    const category = ICON_CATEGORY_MAP[iconName];
    if (category && ICON_CATEGORIES[category]) {
      ICON_CATEGORIES[category].push(iconName);
    } else {
      uncategorized.push(iconName);
    }
  });

  // Sort icons within each category
  Object.keys(ICON_CATEGORIES).forEach(cat => ICON_CATEGORIES[cat].sort());
  uncategorized.sort();

  let html = '';
  const categoryNames = {
    all: 'Alle',
    navigasjon: 'Navigasjon',
    handlingar: 'Handlingar',
    kommunikasjon: 'Kommunikasjon',
    media: 'Media',
    grensesnitt: 'Grensesnitt',
    andre: 'Andre (ukategoriserte)'
  };

  // Build categories including "all" and "andre"
  const allCategories = { all: null, ...ICON_CATEGORIES, andre: uncategorized };

  Object.entries(allCategories).forEach(([key, icons], index) => {
    const isOpen = index === 0 ? 'open' : '';
    const bodyOpen = index === 0 ? 'open' : '';

    let validIcons;
    if (key === 'all') {
      validIcons = allIconNames.sort();
    } else {
      validIcons = icons;
    }

    html += `
      <div class="icon-accordion">
        <div class="icon-accordion-header ${isOpen}" onclick="toggleAccordion(this)">
          <span>${categoryNames[key]} (${validIcons.length})</span>
          <i data-lucide="chevron-down" class="chevron"></i>
        </div>
        <div class="icon-accordion-body ${bodyOpen}">
          <div class="icon-grid">
            ${validIcons.map(name => `<div class="icon-item"><i data-lucide="${name}"></i><span>${name}</span></div>`).join('')}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function toggleAccordion(header) {
  header.classList.toggle('open');
  const body = header.nextElementSibling;
  body.classList.toggle('open');
}

// Render accordion on load
document.addEventListener('DOMContentLoaded', buildAccordion);

// Color overview
function buildColorOverview() {
  const grid = document.getElementById('colorGrid');
  if (!grid) return;

  const colorVariables = [
    { name: 'bg', label: 'Bakgrunn' },
    { name: 'surface', label: 'Overflate' },
    { name: 'text', label: 'Tekst' },
    { name: 'text-on-accent', label: 'Tekst på aksent' },
    { name: 'accent', label: 'Aksent' },
    { name: 'accent2', label: 'Aksent 2' },
    { name: 'accent3', label: 'Aksent 3' },
    { name: 'accent4', label: 'Aksent 4' },
    { name: 'accent5', label: 'Aksent 5' },
    { name: 'border', label: 'Border' },
    { name: 'shadow', label: 'Skygge' },
    { name: 'muted', label: 'Dempet' }
  ];

  const root = document.documentElement;
  const computed = getComputedStyle(root);

  grid.innerHTML = colorVariables.map(({ name, label }) => {
    const value = computed.getPropertyValue(`--${name}`).trim();
    const isAccent = name.startsWith('accent');
    let textColor = '';
    let showText = '';
    if (isAccent) {
      showText = 'Aa';
      if (name === 'accent' || name === 'accent2') {
        textColor = 'color: #ffffff;';
      } else {
        textColor = 'color: #000000;';
      }
    }
    return `
      <div class="color-item">
        <div class="color-swatch" style="background: var(--${name}); ${textColor} ${showText ? 'display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;' : ''}">${showText}</div>
        <span class="color-name">${label}</span>
        <span class="color-value">${value}</span>
      </div>
    `;
  }).join('');
}

// Update color overview when theme changes
const originalSetTheme = setTheme;
setTheme = function(theme) {
  originalSetTheme(theme);
  buildColorOverview();
};

// Build color overview on load
document.addEventListener('DOMContentLoaded', buildColorOverview);
