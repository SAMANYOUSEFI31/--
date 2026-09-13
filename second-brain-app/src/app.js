/**
 * Main Application Entry Point
 * Second Brain App v1.0.0
 */

import storage from './core/storage.js';
import router from './core/router.js';
import appState from './core/state.js';
import notifications from './modules/notification.js';
import modal from './modules/modal.js';
import theme from './modules/theme.js';
import search from './modules/search.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderNoteForm, renderTaskForm, renderProjectForm, renderGoalForm } from './components/forms.js';
import { parseTags, downloadFile, formatDate, isPWA } from './core/utils.js';

class SecondBrainApp {
  constructor() {
    this._initialized = false;
    this._pwaInstallPrompt = null;
  }

  async init() {
    try {
      console.log('🧠 Second Brain App starting...');
      theme.init();
      notifications.init();
      modal.init();
      this._syncStateFromStorage();
      this._setupSidebar();
      this._setupHeader();
      this._setupRouter();
      this._setupGlobalEvents();
      this._setupPWA();
      this._setupKeyboardShortcuts();
      search.init();
      await this._registerSW();
      router.start('/dashboard');
      this._updateBadges();
      this._showApp();
      this._initialized = true;
      window.__app = this;
      console.log('✅ App initialized successfully');
    } catch (err) {
      console.error('❌ App initialization failed:', err);
      this._showError(err.message);
    }
  }

  // ============ ROUTER ============
  _setupRouter() {
    const pages = {
      '/dashboard': { id:'dashboard', title:'داشبورد',      render:() => renderDashboard() },
      '/notes':     { id:'notes',     title:'یادداشت‌ها',   render:() => this._renderNotes() },
      '/tasks':     { id:'tasks',     title:'وظایف',        render:() => this._renderTasks() },
      '/projects':  { id:'projects',  title:'پروژه‌ها',     render:() => this._renderProjects() },
      '/goals':     { id:'goals',     title:'اهداف',        render:() => this._renderGoals() },
      '/habits':    { id:'habits',    title:'عادت‌ها',      render:() => {} },
      '/calendar':  { id:'calendar',  title:'تقویم',        render:() => {} },
      '/knowledge': { id:'knowledge', title:'دانش‌نامه',    render:() => {} },
      '/analytics': { id:'analytics', title:'آمار و تحلیل', render:() => {} },
      '/settings':  { id:'settings',  title:'تنظیمات',     render:() => this._renderSettings() }
    };

    Object.entries(pages).forEach(([path, config]) => {
      router.on(path, () => {
        this._activatePage(config.id, config.title);
        config.render();
        appState.set('currentPage', config.id);
      });
    });

    router.notFound(() => router.navigate('/dashboard', true));
  }

  _activatePage(pageId, title) {
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`)?.classList.add('active');
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.textContent = title;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });
    document.getElementById('page-container')?.scrollTo(0, 0);
  }

  navigate(page) { router.navigate(`/${page}`); }

  // ============ SIDEBAR ============
  _setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('mobile-overlay');

    const settings = storage.getSettings();
    if (settings.sidebarCollapsed) sidebar?.classList.add('collapsed');

    toggleBtn?.addEventListener('click', () => {
      sidebar?.classList.toggle('collapsed');
      storage.updateSettings({ sidebarCollapsed: sidebar?.classList.contains('collapsed') });
    });

    mobileBtn?.addEventListener('click', () => this._toggleMobileSidebar());
    overlay?.addEventListener('click', () => this._closeMobileSidebar());

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        this.navigate(item.dataset.page);
        this._closeMobileSidebar();
      });
    });
  }

  _toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar?.classList.contains('mobile-open')) {
      this._closeMobileSidebar();
    } else {
      sidebar?.classList.add('mobile-open');
      overlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  _closeMobileSidebar() {
    document.getElementById('sidebar')?.classList.remove('mobile-open');
    document.getElementById('mobile-overlay')?.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ============ HEADER ============
  _setupHeader() {
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
      theme.toggle();
      storage.updateSettings({ theme: theme.current });
    });
    document.getElementById('export-btn')?.addEventListener('click', () => this._exportData());
    document.getElementById('sync-btn')?.addEventListener('click', () => this._syncData());
  }

  // ============ GLOBAL EVENTS ============
  _setupGlobalEvents() {
    document.addEventListener('click', e => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) { e.preventDefault(); this._handleAction(actionBtn.dataset.action); }

      const navigateEl = e.target.closest('[data-navigate]');
      if (navigateEl) { e.preventDefault(); this.navigate(navigateEl.dataset.navigate); }

      // Close dropdowns on outside click
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
      }
    });

    document.addEventListener('modal:submit', e => this._handleModalSubmit(e.detail));
    storage.on('*', () => { this._updateBadges(); this._syncStateFromStorage(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 768) this._closeMobileSidebar(); });
  }

  // ============ KEYBOARD SHORTCUTS ============
  _setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('global-search-input')?.focus(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); this._handleAction('new-note'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 't') { e.preventDefault(); this._handleAction('new-task'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); this.navigate('dashboard'); }
    });
  }

  // ============ ACTIONS ============
  _handleAction(action) {
    const map = {
      'new-note':    () => modal.open(renderNoteForm(), { size:'medium' }),
      'new-task':    () => modal.open(renderTaskForm(), { size:'medium' }),
      'new-project': () => modal.open(renderProjectForm(), { size:'medium' }),
      'new-goal':    () => modal.open(renderGoalForm(), { size:'medium' })
    };
    map[action]?.() || console.warn('[App] Unknown action:', action);
  }

  // ============ MODAL SUBMIT ============
  _handleModalSubmit({ formType, data }) {
    const handlers = {
      note:    () => this._saveNote(data),
      task:    () => this._saveTask(data),
      project: () => this._saveProject(data),
      goal:    () => this._saveGoal(data)
    };
    handlers[formType]?.() || console.warn('[App] Unknown form type:', formType);
  }

  _saveNote(data) {
    if (!data.title?.trim()) { notifications.error('عنوان یادداشت الزامی است'); return; }
    const noteData = { title:data.title.trim(), content:data.content?.trim()||'', category:data.category||'', color:data.color||'#6366f1', status:data.status||'active', tags:parseTags(data.tags||'') };
    if (data.id) { storage.update('notes', data.id, noteData); notifications.success('یادداشت ویرایش شد ✓'); }
    else { storage.add('notes', noteData); notifications.success('یادداشت جدید ایجاد شد ✓'); }
    modal.close(); this._refreshCurrentPage();
  }

  _saveTask(data) {
    if (!data.title?.trim()) { notifications.error('عنوان وظیفه الزامی است'); return; }
    const taskData = { title:data.title.trim(), description:data.description?.trim()||'', priority:data.priority||'medium', dueDate:data.dueDate||null, projectId:data.projectId||null, tags:parseTags(data.tags||''), completed:false, status:'pending' };
    if (data.id) { storage.update('tasks', data.id, taskData); notifications.success('وظیفه ویرایش شد ✓'); }
    else { storage.add('tasks', taskData); notifications.success('وظیفه جدید ایجاد شد ✓'); }
    modal.close(); this._refreshCurrentPage();
  }

  _saveProject(data) {
    if (!data.name?.trim()) { notifications.error('نام پروژه الزامی است'); return; }
    const projectData = { name:data.name.trim(), description:data.description?.trim()||'', startDate:data.startDate||null, endDate:data.endDate||null, color:data.color||'#6366f1', status:data.status||'active', progress:0 };
    if (data.id) { storage.update('projects', data.id, projectData); notifications.success('پروژه ویرایش شد ✓'); }
    else { storage.add('projects', projectData); notifications.success('پروژه جدید ایجاد شد ✓'); }
    modal.close(); this._refreshCurrentPage();
  }

  _saveGoal(data) {
    if (!data.title?.trim()) { notifications.error('عنوان هدف الزامی است'); return; }
    const goalData = { title:data.title.trim(), description:data.description?.trim()||'', category:data.category||'personal', deadline:data.deadline||null, progress:parseInt(data.progress)||0, status:'active' };
    if (data.id) { storage.update('goals', data.id, goalData); notifications.success('هدف ویرایش شد ✓'); }
    else { storage.add('goals', goalData); notifications.success('هدف جدید ایجاد شد ✓'); }
    modal.close(); this._refreshCurrentPage();
  }

  // ============ TASK TOGGLE ============
  toggleTask(taskId) {
    const task = storage.findById('tasks', taskId);
    if (!task) return;
    const completed = !task.completed;
    storage.update('tasks', taskId, { completed, completedAt:completed?new Date().toISOString():null, status:completed?'done':'pending' });
    if (completed) notifications.success(`وظیفه "${task.title}" تکمیل شد ✓`);
    this._refreshCurrentPage();
  }

  // ============ DELETE ============
  async deleteItem(collection, id, name) {
    const confirmed = await modal.confirm(`آیا از حذف "${name}" مطمئن هستید؟`, { title:'حذف', confirmText:'حذف', cancelText:'لغو', type:'danger' });
    if (confirmed) { storage.delete(collection, id); notifications.success('با موفقیت حذف شد'); this._refreshCurrentPage(); }
  }

  // ============ PAGE RENDERERS ============
  _renderNotes() {
    const container = document.getElementById('notes-content');
    if (!container) return;
    const notes = storage.getCollection('notes');
    if (notes.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-sticky-note"></i></div><h3 class="empty-state-title">هنوز یادداشتی ندارید</h3><p class="empty-state-desc">اولین یادداشت خود را ایجاد کنید</p><button class="btn btn-primary" data-action="new-note"><i class="fas fa-plus"></i> یادداشت جدید</button></div>`;
      return;
    }
    const catLabels = { personal:'شخصی', work:'کاری', study:'مطالعه', ideas:'ایده‌ها', reference:'مرجع', quick:'سریع' };
    container.innerHTML = `<div class="content-grid content-grid-auto">${notes.map(note => `
      <div class="card card-interactive">
        <div class="card-header">
          <div>
            <div class="card-title">${note.title}</div>
            ${note.category ? `<div class="card-subtitle">${catLabels[note.category]||note.category}</div>` : ''}
          </div>
          <div class="dropdown">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="this.nextElementSibling.classList.toggle('open')"><i class="fas fa-ellipsis-v"></i></button>
            <div class="dropdown-menu">
              <div class="dropdown-item" onclick="window.__app._editNote('${note.id}')"><i class="fas fa-edit"></i> ویرایش</div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item danger" onclick="window.__app.deleteItem('notes','${note.id}','${note.title}')"><i class="fas fa-trash"></i> حذف</div>
            </div>
          </div>
        </div>
        <div class="card-body line-clamp-3">${note.content||'<span style="color:var(--text-muted)">بدون محتوا</span>'}</div>
        ${note.tags?.length ? `<div class="card-tags">${note.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>` : ''}
        <div class="card-footer">
          <span class="text-xs text-muted">${formatDate(note.createdAt)}</span>
          <div style="width:12px;height:12px;border-radius:50%;background:${note.color||'#6366f1'};"></div>
        </div>
      </div>
    `).join('')}</div>`;
  }

  _editNote(id) {
    const note = storage.findById('notes', id);
    if (note) modal.open(renderNoteForm(note), { size:'medium' });
  }

  _renderTasks() {
    const container = document.getElementById('tasks-content');
    if (!container) return;
    const tasks = storage.getCollection('tasks');
    if (tasks.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-tasks"></i></div><h3 class="empty-state-title">هنوز وظیفه‌ای ندارید</h3><p class="empty-state-desc">اولین وظیفه خود را ایجاد کنید</p><button class="btn btn-primary" data-action="new-task"><i class="fas fa-plus"></i> وظیفه جدید</button></div>`;
      return;
    }
    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    const renderList = list => list.map(task => `
      <div class="card" style="margin-bottom:8px;${task.completed?'opacity:0.6':''}">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="task-check ${task.completed?'checked':''}" onclick="window.__app.toggleTask('${task.id}')">
            ${task.completed?'<i class="fas fa-check"></i>':''}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:500;${task.completed?'text-decoration:line-through;color:var(--text-muted)':''}">${task.title}</div>
            ${task.description?`<div class="text-sm text-muted" style="margin-top:4px;">${task.description}</div>`:''}
            <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
              ${task.priority?`<span class="priority-${task.priority}">${{high:'بالا',medium:'متوسط',low:'کم'}[task.priority]}</span>`:''}
              ${task.dueDate?`<span class="text-xs text-muted"><i class="fas fa-calendar"></i> ${formatDate(task.dueDate)}</span>`:''}
            </div>
          </div>
          <div class="dropdown">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="this.nextElementSibling.classList.toggle('open')"><i class="fas fa-ellipsis-v"></i></button>
            <div class="dropdown-menu">
              <div class="dropdown-item" onclick="window.__app._editTask('${task.id}')"><i class="fas fa-edit"></i> ویرایش</div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item danger" onclick="window.__app.deleteItem('tasks','${task.id}','${task.title}')"><i class="fas fa-trash"></i> حذف</div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    container.innerHTML = `
      ${pending.length>0?`<h3 style="font-size:1rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;">در انتظار (${pending.length})</h3>${renderList(pending)}`:''}
      ${completed.length>0?`<h3 style="font-size:1rem;font-weight:600;color:var(--text-secondary);margin:24px 0 12px;">تکمیل‌شده (${completed.length})</h3>${renderList(completed)}`:''}
    `;
  }

  _editTask(id) {
    const task = storage.findById('tasks', id);
    if (task) modal.open(renderTaskForm(task), { size:'medium' });
  }

  _renderProjects() {
    const container = document.getElementById('projects-content');
    if (!container) return;
    const projects = storage.getCollection('projects');
    if (projects.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-folder-open"></i></div><h3 class="empty-state-title">هنوز پروژه‌ای ندارید</h3><p class="empty-state-desc">اولین پروژه خود را ایجاد کنید</p><button class="btn btn-primary" data-action="new-project"><i class="fas fa-plus"></i> پروژه جدید</button></div>`;
      return;
    }
    const statusLabels = { active:'فعال', paused:'متوقف', completed:'تکمیل‌شده', archived:'آرشیو' };
    container.innerHTML = `<div class="content-grid content-grid-auto">${projects.map(p => `
      <div class="card card-interactive">
        <div class="card-header">
          <div>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:14px;height:14px;border-radius:50%;background:${p.color||'#6366f1'};flex-shrink:0;"></div>
              <div class="card-title">${p.name}</div>
            </div>
            <div class="card-subtitle">${statusLabels[p.status]||'فعال'}</div>
          </div>
          <div class="dropdown">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="this.nextElementSibling.classList.toggle('open')"><i class="fas fa-ellipsis-v"></i></button>
            <div class="dropdown-menu">
              <div class="dropdown-item" onclick="window.__app._editProject('${p.id}')"><i class="fas fa-edit"></i> ویرایش</div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item danger" onclick="window.__app.deleteItem('projects','${p.id}','${p.name}')"><i class="fas fa-trash"></i> حذف</div>
            </div>
          </div>
        </div>
        ${p.description?`<div class="card-body line-clamp-2">${p.description}</div>`:''}
        <div class="card-footer">
          <span class="text-xs text-muted">${p.startDate?formatDate(p.startDate):''}${p.endDate?` ← ${formatDate(p.endDate)}`:''}</span>
        </div>
      </div>
    `).join('')}</div>`;
  }

  _editProject(id) {
    const project = storage.findById('projects', id);
    if (project) modal.open(renderProjectForm(project), { size:'medium' });
  }

  _renderGoals() {
    const container = document.getElementById('goals-content');
    if (!container) return;
    const goals = storage.getCollection('goals');
    if (goals.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-bullseye"></i></div><h3 class="empty-state-title">هنوز هدفی ندارید</h3><p class="empty-state-desc">اولین هدف خود را تعریف کنید</p><button class="btn btn-primary" data-action="new-goal"><i class="fas fa-plus"></i> هدف جدید</button></div>`;
      return;
    }
    const catLabels = { personal:'شخصی', career:'شغلی', health:'سلامت', financial:'مالی', learning:'یادگیری', social:'اجتماعی' };
    container.innerHTML = `<div class="content-grid content-grid-auto">${goals.map(g => `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${g.title}</div>
            <div class="card-subtitle">${catLabels[g.category]||g.category}</div>
          </div>
          <div class="dropdown">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="this.nextElementSibling.classList.toggle('open')"><i class="fas fa-ellipsis-v"></i></button>
            <div class="dropdown-menu">
              <div class="dropdown-item" onclick="window.__app._editGoal('${g.id}')"><i class="fas fa-edit"></i> ویرایش</div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item danger" onclick="window.__app.deleteItem('goals','${g.id}','${g.title}')"><i class="fas fa-trash"></i> حذف</div>
            </div>
          </div>
        </div>
        ${g.description?`<div class="card-body" style="margin-bottom:12px;">${g.description}</div>`:''}
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span class="text-xs text-muted">پیشرفت</span>
            <span class="text-xs font-semibold" style="color:var(--color-brand-500);">${g.progress||0}%</span>
          </div>
          <div class="progress"><div class="progress-bar" style="width:${g.progress||0}%"></div></div>
        </div>
        ${g.deadline?`<div class="card-footer"><span class="text-xs text-muted"><i class="fas fa-calendar"></i> مهلت: ${formatDate(g.deadline)}</span></div>`:''}
      </div>
    `).join('')}</div>`;
  }

  _editGoal(id) {
    const goal = storage.findById('goals', id);
    if (goal) modal.open(renderGoalForm(goal), { size:'medium' });
  }

  _renderSettings() {
    const container = document.getElementById('settings-content');
    if (!container) return;
    const stats = storage.getStats();
    container.innerHTML = `
      <div class="content-grid" style="max-width:600px;">
        <div class="card">
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px;">🎨 ظاهر</h3>
          <div class="form-group">
            <label class="form-label">تم</label>
            <div style="display:flex;gap:12px;">
              <button class="btn ${theme.current==='light'?'btn-primary':'btn-secondary'}" onclick="window.__app._setTheme('light')"><i class="fas fa-sun"></i> روشن</button>
              <button class="btn ${theme.current==='dark'?'btn-primary':'btn-secondary'}" onclick="window.__app._setTheme('dark')"><i class="fas fa-moon"></i> تاریک</button>
            </div>
          </div>
        </div>
        <div class="card">
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px;">💾 مدیریت داده</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
            <div style="background:var(--bg-surface-2);padding:12px;border-radius:8px;text-align:center;">
              <div style="font-size:1.5rem;font-weight:700;color:var(--color-brand-500);">${stats.notes}</div>
              <div class="text-xs text-muted">یادداشت</div>
            </div>
            <div style="background:var(--bg-surface-2);padding:12px;border-radius:8px;text-align:center;">
              <div style="font-size:1.5rem;font-weight:700;color:var(--color-warning);">${stats.tasks}</div>
              <div class="text-xs text-muted">وظیفه</div>
            </div>
            <div style="background:var(--bg-surface-2);padding:12px;border-radius:8px;text-align:center;">
              <div style="font-size:1.5rem;font-weight:700;color:var(--color-info);">${stats.projects}</div>
              <div class="text-xs text-muted">پروژه</div>
            </div>
            <div style="background:var(--bg-surface-2);padding:12px;border-radius:8px;text-align:center;">
              <div style="font-size:1.5rem;font-weight:700;color:var(--color-success);">${stats.sizeKB} KB</div>
              <div class="text-xs text-muted">حجم داده</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="window.__app._exportData()"><i class="fas fa-download"></i> خروجی JSON</button>
            <button class="btn btn-secondary" onclick="window.__app._importData()"><i class="fas fa-upload"></i> ورودی JSON</button>
            <button class="btn btn-danger" onclick="window.__app._resetData()"><i class="fas fa-trash"></i> پاک کردن همه</button>
          </div>
        </div>
        <div class="card">
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px;">ℹ️ درباره</h3>
          <div class="text-sm text-secondary">
            <p><strong>ذهن دوم</strong> - نسخه ۱.۰.۰</p>
            <p style="margin-top:8px;">سیستم مدیریت شخصی کامل و آفلاین</p>
            <p style="margin-top:8px;color:var(--text-muted);">تمام داده‌ها به صورت محلی در مرورگر شما ذخیره می‌شوند</p>
          </div>
        </div>
      </div>
    `;
  }

  _setTheme(t) { theme.set(t); storage.updateSettings({ theme:t }); this._renderSettings(); }

  // ============ DATA OPERATIONS ============
  _exportData() {
    const data = storage.export();
    downloadFile(data, `second-brain-backup-${new Date().toISOString().split('T')[0]}.json`);
    notifications.success('پشتیبان‌گیری انجام شد ✓');
  }

  _importData() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        if (storage.import(text)) { notifications.success('داده‌ها وارد شدند ✓'); this._refreshCurrentPage(); this._updateBadges(); }
        else notifications.error('خطا در وارد کردن داده‌ها');
      } catch { notifications.error('فایل نامعتبر است'); }
    };
    input.click();
  }

  async _resetData() {
    const confirmed = await modal.confirm('تمام داده‌های شما حذف خواهند شد!', { title:'پاک کردن همه', confirmText:'بله، پاک کن', cancelText:'لغو', type:'danger' });
    if (confirmed) { storage.reset(); notifications.success('تمام داده‌ها پاک شدند'); this.navigate('dashboard'); }
  }

  async _syncData() {
    const btn = document.getElementById('sync-btn');
    const icon = btn?.querySelector('i');
    if (icon) icon.classList.add('animate-spin');
    await new Promise(r => setTimeout(r, 1200));
    if (icon) icon.classList.remove('animate-spin');
    notifications.info('همگام‌سازی کامل شد (حالت آفلاین)');
  }

  // ============ BADGES ============
  _updateBadges() {
    const data = storage.getAll();
    const pending = (data.tasks||[]).filter(t => !t.completed).length;
    const update = (id, count) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-flex' : 'none';
    };
    update('badge-notes',    (data.notes||[]).length);
    update('badge-tasks',    pending);
    update('badge-projects', (data.projects||[]).length);
  }

  _syncStateFromStorage() {
    const data = storage.getAll();
    appState.merge({ notes:data.notes||[], tasks:data.tasks||[], projects:data.projects||[], goals:data.goals||[] });
  }

  _refreshCurrentPage() {
    const current = appState.get('currentPage');
    const map = { dashboard:()=>renderDashboard(), notes:()=>this._renderNotes(), tasks:()=>this._renderTasks(), projects:()=>this._renderProjects(), goals:()=>this._renderGoals(), settings:()=>this._renderSettings() };
    map[current]?.();
    this._updateBadges();
  }

  // ============ PWA ============
  _setupPWA() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this._pwaInstallPrompt = e;
      setTimeout(() => {
        const banner = document.getElementById('pwa-banner');
        if (banner && !isPWA()) banner.style.display = 'flex';
      }, 3000);
    });

    document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
      if (!this._pwaInstallPrompt) return;
      this._pwaInstallPrompt.prompt();
      const { outcome } = await this._pwaInstallPrompt.userChoice;
      if (outcome === 'accepted') notifications.success('برنامه با موفقیت نصب شد! 🎉');
      this._pwaInstallPrompt = null;
      document.getElementById('pwa-banner').style.display = 'none';
    });

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      document.getElementById('pwa-banner').style.display = 'none';
    });

    window.addEventListener('appinstalled', () => {
      notifications.success('ذهن دوم نصب شد! 🎉');
      document.getElementById('pwa-banner').style.display = 'none';
    });
  }

  // ============ SERVICE WORKER ============
  async _registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('[App] SW registered:', reg.scope);
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            notifications.info('نسخه جدید در دسترس است. صفحه را رفرش کنید.', {
              duration: 0,
              action: { label:'رفرش', handler:() => window.location.reload() }
            });
          }
        });
      });
    } catch (err) {
      console.warn('[App] SW registration failed:', err);
    }
  }

  // ============ SHOW APP ============
  _showApp() {
    const loading = document.getElementById('loading-screen');
    const app = document.getElementById('app');
    setTimeout(() => {
      if (loading) { loading.classList.add('hidden'); setTimeout(() => loading.remove(), 500); }
      if (app) app.classList.add('ready');
    }, 800);
  }

  _showError(message) {
    const loading = document.getElementById('loading-screen');
    if (loading) {
      loading.innerHTML = `
        <div class="loading-content">
          <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
          <div class="loading-title" style="color:#ef4444;">خطا در راه‌اندازی</div>
          <div class="loading-subtitle">${message}</div>
          <button onclick="location.reload()" style="margin-top:24px;padding:10px 24px;background:white;color:#6366f1;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:1rem;">تلاش مجدد</button>
        </div>
      `;
    }
  }
}

const app = new SecondBrainApp();
document.addEventListener('DOMContentLoaded', () => app.init());
export default app;