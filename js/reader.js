/* 对照阅读页：侧边栏切换、折叠、记忆选中项 */
(function () {
  var LAST_KEY = 'opm_last_doc';
  var COLLAPSE_KEY = 'opm_sidebar_collapsed';

  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function setActive(id) {
    qsa('.sidebar a.nav-item').forEach(function (a) {
      if (a.getAttribute('data-target') === id) a.classList.add('active');
      else a.classList.remove('active');
    });
    if (id) localStorage.setItem(LAST_KEY, id);
  }

  function scrollTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    // 使用 scrollIntoView，scroll-margin-top 已处理 offset
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onNavClick(e) {
    var a = e.currentTarget;
    var id = a.getAttribute('data-target');
    if (!id) return;
    e.preventDefault();
    setActive(id);
    scrollTo(id);
    // 更新 hash 但不触发 jump（用 replaceState）
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    // 移动端点击后关闭侧边栏
    if (window.matchMedia('(max-width: 720px)').matches) {
      document.body.classList.remove('sidebar-open');
    }
  }

  function setupNav() {
    qsa('.sidebar a.nav-item').forEach(function (a) {
      a.addEventListener('click', onNavClick);
    });
  }

  function setupCollapse() {
    if (localStorage.getItem(COLLAPSE_KEY) === '1') {
      document.body.classList.add('sidebar-collapsed');
    }
    var btn = qs('#sidebarToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      // 移动端：toggle open；桌面端：toggle collapsed
      if (window.matchMedia('(max-width: 720px)').matches) {
        document.body.classList.toggle('sidebar-open');
      } else {
        var collapsed = document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
      }
    });
  }

  function initialTarget() {
    // 优先 URL hash；其次记忆；否则第一个
    var hash = (location.hash || '').replace(/^#/, '');
    if (hash && document.getElementById(hash)) return hash;
    var last = localStorage.getItem(LAST_KEY);
    if (last && document.getElementById(last)) return last;
    var first = qs('.sidebar a.nav-item');
    return first ? first.getAttribute('data-target') : null;
  }

  function setupScrollSpy() {
    var sections = qsa('.doc-section');
    if (!sections.length) return;
    var observer = new IntersectionObserver(function (entries) {
      // 取最靠上的可见 section
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      if (!visible.length) return;
      visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      var id = visible[0].target.id;
      if (id) setActive(id);
    }, { rootMargin: '-60px 0px -60% 0px', threshold: 0 });
    sections.forEach(function (s) { observer.observe(s); });
  }

  function init() {
    setupNav();
    setupCollapse();
    var target = initialTarget();
    if (target) {
      setActive(target);
      // 延迟滚动，等布局完成
      setTimeout(function () { scrollTo(target); }, 30);
    }
    setupScrollSpy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
