/**
 * Dashboard Page
 * Second Brain App v1.0.0
 */

import storage from '../core/storage.js';
import modal from '../modules/modal.js';
import notifications from '../modules/notification.js';
import { renderTaskForm } from '../components/forms.js';
import { formatRelativeTime, formatDate, truncate } from '../core/utils.js';

export function renderDashboard() {
  const container = document.getElementById('page-dashboard');
  if (!container) return;

  const data = storage.getAll();
  const stats = computeStats(data);

  container.innerHTML = `
    <div class="dashboard-stats">
      ${statCard({ label:'یادداشت‌ها', value:stats.totalNotes, icon:'fas fa-sticky-note', color:'#6366f1', change:`+${stats.notesToday} امروز`, positive:stats.notesToday>=0, page:'notes' })}
      ${statCard({ label:'وظایف باقی‌مانده', value:stats.pendingTasks, icon:'fas fa-tasks', color:'#f59e0b', change:stats.overdueTasks>0?`${stats.overdueTasks} عقب‌افتاده`:'به‌روز', positive:stats.overdueTasks===0, page:'tasks' })}
      ${statCard({ label:'پروژه‌های فعال', value:stats.activeProjects, icon:'fas fa-folder-open', color:'#06b6d4', change:`از ${stats.totalProjects} پروژه`, positive:true, page:'projects' })}
      ${statCard({ label:'پیشرفت اهداف', value:`${stats.goalsProgress}%`, icon:'fas fa-bullseye', color:'#10b981', change:`${stats.totalGoals} هدف`, positive:stats.goalsProgress>=50, page:'goals' })}
    </div>

    <div class="dashboard-widgets">
      <!-- Quick Note -->
      <div class="widget">
        <div class="widget-header">
          <h3 class="widget-title"><i class="fas fa-bolt" style="color:var(--color-brand-500);margin-left:8px;"></i>یادداشت سریع</h3>
        </div>
        <textarea id="quick-note-input" class="form-textarea" placeholder="یادداشت سریع... (Ctrl+Enter برای ذخیره)" rows="5" style="margin-bottom:12px;"></textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn btn-secondary btn-sm" id="quick-note-clear"><i class="fas fa-times"></i> پاک</button>
          <button class="btn btn-primary btn-sm" id="quick-note-save"><i class="fas fa-save"></i> ذخیره</button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="widget">
        <div class="widget-header">
          <h3 class="widget-title"><i class="fas fa-history" style="color:var(--color-brand-500);margin-left:8px;"></i>فعالیت‌های اخیر</h3>
          <button class="widget-action-btn" id="refresh-activity"><i class="fas fa-sync-alt"></i></button>
        </div>
        <div id="activity-list">${renderActivityList(data)}</div>
      </div>

      <!-- Today Tasks -->
      <div class="widget">
        <div class="widget-header">
          <h3 class="widget-title"><i class="fas fa-calendar-day" style="color:var(--color-brand-500);margin-left:8px;"></i>وظایف امروز</h3>
          <button class="widget-action-btn" id="add-task-widget"><i class="fas fa-plus"></i></button>
        </div>
        <div id="today-tasks-list">${renderTodayTasks(data.tasks || [])}</div>
      </div>
    </div>
  `;

  bindDashboardEvents();
}

function statCard({ label, value, icon, color, change, positive, page }) {
  return `
    <div class="stat-card" data-navigate="${page}">
      <div class="stat-card-header">
        <span class="stat-card-label">${label}</span>
        <div class="stat-card-icon" style="background:${color};"><i class="${icon}"></i></div>
      </div>
      <div class="stat-card-value">${value}</div>
      <div class="stat-card-change ${positive ? 'positive' : 'negative'}">
        <i class="fas fa-${positive ? 'arrow-up' : 'arrow-down'}"></i>
        <span>${change}</span>
      </div>
    </div>
  `;
}

function renderActivityList(data) {
  const activities = getRecentActivities(data);
  if (activities.length === 0) {
    return `<div class="empty-state" style="padding:2rem 1rem;">
      <div class="empty-state-icon"><i class="fas fa-history"></i></div>
      <p class="empty-state-desc">هنوز فعالیتی ثبت نشده است</p>
    </div>`;
  }
  return activities.map(a => `
    <div class="activity-item">
      <div class="activity-icon" style="background:${a.color};"><i class="${a.icon}"></i></div>
      <div class="activity-body">
        <div class="activity-title">${truncate(a.title, 40)}</div>
        <div class="activity-time">${formatRelativeTime(a.timestamp)}</div>
      </div>
    </div>
  `).join('');
}

function renderTodayTasks(tasks) {
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today.getTime() + 86400000);
  const todayTasks = tasks.filter(task => {
    if (task.dueDate) return new Date(task.dueDate) < tomorrow;
    const created = new Date(task.createdAt);
    return created >= today && created < tomorrow;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const p = { high:3, medium:2, low:1 };
    return (p[b.priority]||0) - (p[a.priority]||0);
  });

  if (todayTasks.length === 0) {
    return `<div class="empty-state" style="padding:2rem 1rem;">
      <div class="empty-state-icon"><i class="fas fa-check-circle"></i></div>
      <p class="empty-state-desc">امروز وظیفه‌ای ندارید!</p>
      <button class="btn btn-primary btn-sm" data-navigate="tasks">مشاهده همه وظایف</button>
    </div>`;
  }

  return todayTasks.map(task => `
    <div class="task-row ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
      <div class="task-check ${task.completed ? 'checked' : ''}" onclick="window.__app.toggleTask('${task.id}')">
        ${task.completed ? '<i class="fas fa-check"></i>' : ''}
      </div>
      <div class="task-info">
        <div class="task-name">${truncate(task.title, 35)}</div>
        <div class="task-meta-row">
          ${task.priority ? `<span class="priority-${task.priority}">${{high:'بالا',medium:'متوسط',low:'کم'}[task.priority]}</span>` : ''}
          ${task.dueDate ? `<span class="task-due">${formatDate(task.dueDate)}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function computeStats(data) {
  const notes = data.notes || [], tasks = data.tasks || [], projects = data.projects || [], goals = data.goals || [];
  const today = new Date(); today.setHours(0,0,0,0);
  return {
    totalNotes: notes.length,
    notesToday: notes.filter(n => new Date(n.createdAt) >= today).length,
    pendingTasks: tasks.filter(t => !t.completed).length,
    overdueTasks: tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today).length,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active' || !p.status).length,
    totalGoals: goals.length,
    goalsProgress: goals.length > 0 ? Math.round(goals.reduce((s,g) => s+(g.progress||0), 0) / goals.length) : 0
  };
}

function getRecentActivities(data) {
  const activities = [];
  const add = (items, type, icon, color, titleFn) => {
    (items||[]).slice(0,5).forEach(item => activities.push({
      id:`${type}-${item.id}`, title:titleFn(item),
      timestamp:item.updatedAt||item.createdAt, icon, color, type
    }));
  };
  add(data.notes,    'note',    'fas fa-sticky-note', '#6366f1', n=>`یادداشت: ${n.title}`);
  add(data.tasks,    'task',    'fas fa-tasks',       '#f59e0b', t=>`وظیفه: ${t.title}`);
  add(data.projects, 'project', 'fas fa-folder',      '#06b6d4', p=>`پروژه: ${p.name}`);
  return activities.sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp)).slice(0,8);
}

function bindDashboardEvents() {
  // Stat card navigation
  document.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', () => window.__app?.navigate(el.dataset.navigate));
  });

  // Quick note
  const saveBtn = document.getElementById('quick-note-save');
  const clearBtn = document.getElementById('quick-note-clear');
  const input = document.getElementById('quick-note-input');

  saveBtn?.addEventListener('click', () => saveQuickNote(input));
  clearBtn?.addEventListener('click', () => { if(input) { input.value=''; input.focus(); } });
  input?.addEventListener('keydown', e => { if(e.key==='Enter' && e.ctrlKey) saveQuickNote(input); });

  // Refresh activity
  document.getElementById('refresh-activity')?.addEventListener('click', () => {
    const list = document.getElementById('activity-list');
    if(list) list.innerHTML = renderActivityList(storage.getAll());
  });

  // Add task from widget
  document.getElementById('add-task-widget')?.addEventListener('click', () => {
    modal.open(renderTaskForm(), { size:'medium' });
    document.addEventListener('modal:submit', e => {
      if(e.detail.formType === 'task') {
        storage.add('tasks', { ...e.detail.data, completed:false, status:'pending' });
        modal.close();
        notifications.success('وظیفه جدید ایجاد شد ✓');
        renderDashboard();
      }
    }, { once:true });
  });
}

function saveQuickNote(input) {
  const content = input?.value?.trim();
  if (!content) return;
  storage.add('notes', { title:'یادداشت سریع', content, category:'quick', tags:['سریع'], color:'#6366f1' });
  input.value = '';
  notifications.success('یادداشت سریع ذخیره شد ✓');
  renderDashboard();
}