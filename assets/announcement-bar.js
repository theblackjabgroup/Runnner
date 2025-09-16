/* Announcement Bar JavaScript */

document.addEventListener('DOMContentLoaded', function () {
  const announcementBar = document.querySelector('.announcement-bar');

  const setAnnouncementBarHeight = () => {
    if (!announcementBar) return;
    const height = announcementBar.offsetHeight;
    document.documentElement.style.setProperty('--announcement-bar-height', `${height}px`);
  };

  setAnnouncementBarHeight();
  window.addEventListener('resize', setAnnouncementBarHeight, { passive: true });
});
