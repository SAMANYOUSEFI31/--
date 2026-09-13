/**
 * Reusable Form Components
 * Second Brain App v1.0.0
 */

import { formatTags, toISODate } from '../core/utils.js';
import storage from '../core/storage.js';

export function renderNoteForm(note = null) {
  const isEdit = note !== null;
  return `
    <div class="modal-header">
      <h3 class="modal-title">
        <i class="fas fa-sticky-note" style="color:var(--color-brand-500);margin-left:8px;"></i>
        ${isEdit ? 'ویرایش یادداشت' : 'یادداشت جدید'}
      </h3>
      <button class="btn btn-ghost btn-icon modal-close-btn" aria-label="بستن">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <form data-form="note" novalidate>
      <div class="modal-body">
        ${isEdit ? `<input type="hidden" name="id" value="${note.id}">` : ''}
        <div class="form-group">
          <label class="form-label required">عنوان</label>
          <input type="text" name="title" class="form-input" value="${note?.title || ''}" placeholder="عنوان یادداشت" required maxlength="200">
        </div>
        <div class="form-group">
          <label class="form-label">محتوا</label>
          <textarea name="content" class="form-textarea" placeholder="محتوای یادداشت..." rows="7">${note?.content || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">دسته‌بندی</label>
            <select name="category" class="form-select">
              <option value="">بدون دسته‌بندی</option>
              <option value="personal" ${note?.category === 'personal' ? 'selected' : ''}>شخصی</option>
              <option value="work" ${note?.category === 'work' ? 'selected' : ''}>کاری</option>
              <option value="study" ${note?.category === 'study' ? 'selected' : ''}>مطالعه</option>
              <option value="ideas" ${note?.category === 'ideas' ? 'selected' : ''}>ایده‌ها</option>
              <option value="reference" ${note?.category === 'reference' ? 'selected' : ''}>مرجع</option>
              <option value="quick" ${note?.category === 'quick' ? 'selected' : ''}>سریع</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">رنگ</label>
            <div class="color-input-wrapper">
              <input type="color" name="color" class="form-color" value="${note?.color || '#6366f1'}">
              <span class="text-sm text-muted">رنگ یادداشت</span>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">برچسب‌ها</label>
          <input type="text" name="tags" class="form-input" value="${formatTags(note?.tags || [])}" placeholder="برچسب‌ها را با کاما جدا کنید">
          <span class="form-hint">مثال: کار, مهم, ایده</span>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close-btn">لغو</button>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-${isEdit ? 'save' : 'plus'}"></i>
          ${isEdit ? 'ذخیره تغییرات' : 'ایجاد یادداشت'}
        </button>
      </div>
    </form>
  `;
}

export function renderTaskForm(task = null) {
  const isEdit = task !== null;
  const projects = storage.getCollection('projects');
  return `
    <div class="modal-header">
      <h3 class="modal-title">
        <i class="fas fa-tasks" style="color:var(--color-brand-500);margin-left:8px;"></i>
        ${isEdit ? 'ویرایش وظیفه' : 'وظیفه جدید'}
      </h3>
      <button class="btn btn-ghost btn-icon modal-close-btn" aria-label="بستن">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <form data-form="task" novalidate>
      <div class="modal-body">
        ${isEdit ? `<input type="hidden" name="id" value="${task.id}">` : ''}
        <div class="form-group">
          <label class="form-label required">عنوان وظیفه</label>
          <input type="text" name="title" class="form-input" value="${task?.title || ''}" placeholder="عنوان وظیفه" required maxlength="200">
        </div>
        <div class="form-group">
          <label class="form-label">توضیحات</label>
          <textarea name="description" class="form-textarea" placeholder="توضیحات بیشتر..." rows="3">${task?.description || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">اولویت</label>
            <select name="priority" class="form-select">
              <option value="low" ${task?.priority === 'low' ? 'selected' : ''}>🟢 کم</option>
              <option value="medium" ${!task?.priority || task?.priority === 'medium' ? 'selected' : ''}>🟡 متوسط</option>
              <option value="high" ${task?.priority === 'high' ? 'selected' : ''}>🔴 بالا</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">مهلت انجام</label>
            <input type="date" name="dueDate" class="form-input" value="${toISODate(task?.dueDate)}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">پروژه</label>
          <select name="projectId" class="form-select">
            <option value="">بدون پروژه</option>
            ${projects.map(p => `<option value="${p.id}" ${task?.projectId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">برچسب‌ها</label>
          <input type="text" name="tags" class="form-input" value="${formatTags(task?.tags || [])}" placeholder="برچسب‌ها را با کاما جدا کنید">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close-btn">لغو</button>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-${isEdit ? 'save' : 'plus'}"></i>
          ${isEdit ? 'ذخیره تغییرات' : 'ایجاد وظیفه'}
        </button>
      </div>
    </form>
  `;
}

export function renderProjectForm(project = null) {
  const isEdit = project !== null;
  return `
    <div class="modal-header">
      <h3 class="modal-title">
        <i class="fas fa-folder-open" style="color:var(--color-brand-500);margin-left:8px;"></i>
        ${isEdit ? 'ویرایش پروژه' : 'پروژه جدید'}
      </h3>
      <button class="btn btn-ghost btn-icon modal-close-btn" aria-label="بستن">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <form data-form="project" novalidate>
      <div class="modal-body">
        ${isEdit ? `<input type="hidden" name="id" value="${project.id}">` : ''}
        <div class="form-group">
          <label class="form-label required">نام پروژه</label>
          <input type="text" name="name" class="form-input" value="${project?.name || ''}" placeholder="نام پروژه" required maxlength="100">
        </div>
        <div class="form-group">
          <label class="form-label">توضیحات</label>
          <textarea name="description" class="form-textarea" placeholder="توضیحات پروژه..." rows="4">${project?.description || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">تاریخ شروع</label>
            <input type="date" name="startDate" class="form-input" value="${toISODate(project?.startDate)}">
          </div>
          <div class="form-group">
            <label class="form-label">تاریخ پایان</label>
            <input type="date" name="endDate" class="form-input" value="${toISODate(project?.endDate)}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">وضعیت</label>
            <select name="status" class="form-select">
              <option value="active" ${!project?.status || project?.status === 'active' ? 'selected' : ''}>فعال</option>
              <option value="paused" ${project?.status === 'paused' ? 'selected' : ''}>متوقف</option>
              <option value="completed" ${project?.status === 'completed' ? 'selected' : ''}>تکمیل‌شده</option>
              <option value="archived" ${project?.status === 'archived' ? 'selected' : ''}>آرشیو</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">رنگ پروژه</label>
            <div class="color-input-wrapper">
              <input type="color" name="color" class="form-color" value="${project?.color || '#6366f1'}">
              <span class="text-sm text-muted">رنگ شناسه</span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close-btn">لغو</button>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-${isEdit ? 'save' : 'plus'}"></i>
          ${isEdit ? 'ذخیره تغییرات' : 'ایجاد پروژه'}
        </button>
      </div>
    </form>
  `;
}

export function renderGoalForm(goal = null) {
  const isEdit = goal !== null;
  return `
    <div class="modal-header">
      <h3 class="modal-title">
        <i class="fas fa-bullseye" style="color:var(--color-brand-500);margin-left:8px;"></i>
        ${isEdit ? 'ویرایش هدف' : 'هدف جدید'}
      </h3>
      <button class="btn btn-ghost btn-icon modal-close-btn" aria-label="بستن">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <form data-form="goal" novalidate>
      <div class="modal-body">
        ${isEdit ? `<input type="hidden" name="id" value="${goal.id}">` : ''}
        <div class="form-group">
          <label class="form-label required">عنوان هدف</label>
          <input type="text" name="title" class="form-input" value="${goal?.title || ''}" placeholder="هدف خود را بنویسید" required>
        </div>
        <div class="form-group">
          <label class="form-label">توضیحات</label>
          <textarea name="description" class="form-textarea" placeholder="چرا این هدف مهم است؟" rows="3">${goal?.description || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">دسته‌بندی</label>
            <select name="category" class="form-select">
              <option value="personal" ${goal?.category === 'personal' ? 'selected' : ''}>شخصی</option>
              <option value="career" ${goal?.category === 'career' ? 'selected' : ''}>شغلی</option>
              <option value="health" ${goal?.category === 'health' ? 'selected' : ''}>سلامت</option>
              <option value="financial" ${goal?.category === 'financial' ? 'selected' : ''}>مالی</option>
              <option value="learning" ${goal?.category === 'learning' ? 'selected' : ''}>یادگیری</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">مهلت</label>
            <input type="date" name="deadline" class="form-input" value="${toISODate(goal?.deadline)}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">پیشرفت فعلی: <span id="progress-value">${goal?.progress || 0}%</span></label>
          <input type="range" name="progress" min="0" max="100" value="${goal?.progress || 0}"
            style="width:100%;accent-color:var(--color-brand-500);"
            oninput="document.getElementById('progress-value').textContent=this.value+'%'">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close-btn">لغو</button>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-${isEdit ? 'save' : 'plus'}"></i>
          ${isEdit ? 'ذخیره تغییرات' : 'ایجاد هدف'}
        </button>
      </div>
    </form>
  `;
}