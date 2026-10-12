(function () {
  'use strict';
  document.getElementById('test-size').addEventListener('change', event => {
    const [width, height] = event.target.value.split(',').map(Number);
    const frame = document.getElementById('test-frame');
    frame.width = width; frame.height = height;
  });
})();
