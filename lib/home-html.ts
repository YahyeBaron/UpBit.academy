import { Course } from '@/lib/data';
import { HOME_PAGE_TEMPLATE } from '@/lib/home-template';

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getHomePageHtml(courses: Course[]): string {
  const displayCourses = courses.slice(0, 6);

  const cardsHtml = displayCourses
    .map((course) => {
      const level = course.level || 'Beginner';
      const levelClass = level.toLowerCase().includes('adv')
        ? 'advanced'
        : level.toLowerCase().includes('inter')
        ? 'intermediate'
        : 'beginner';
      const rating = Number(course.rating || 4.95).toFixed(2);
      const reviews = course.reviews || 980;
      const duration = course.duration || '6h';
      const mentor =
        (course.instructors && course.instructors[0]) || 'UpBit Mentor';
      const title = course.title || 'Course';
      const desc = course.tagline || course.description || '';
      const slug = course.slug || '';

      const thumbContent = course.image
        ? `<img src="${escapeHtml(course.image)}" alt="${escapeHtml(title)}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />`
        : `<div class="course-card__thumb-art" style="background:linear-gradient(135deg,#0d1a3a 0%,#1a0d3a 60%,#0a0a1a 100%)">
            <span class="thumb-glow" style="width:120px;height:120px;top:-20px;left:-20px;background:#4d65ff"></span>
            <span class="thumb-glow" style="width:90px;height:90px;bottom:-10px;right:10px;background:#B23FE0"></span>
          </div>`;

      return `
<a href="/courses/${escapeHtml(slug)}" class="course-card" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;">
  <div class="course-card__thumb" style="position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;flex-shrink:0;">
    ${thumbContent}
    <div class="course-card__preview-btn"><span>&#9654; View Course</span></div>
    <div class="course-card__badge ${levelClass}">${escapeHtml(level)}</div>
    <div class="course-card__bookmark">&#9646;</div>
  </div>
  <div class="course-card__body">
    <div class="course-card__meta">
      <div class="course-card__rating">
        <span class="star">&#9733;</span> ${escapeHtml(rating)} <span class="count">(${escapeHtml(reviews)})</span>
      </div>
      <div class="course-card__duration">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        ${escapeHtml(duration)}
      </div>
    </div>
    <h3 class="course-card__title">${escapeHtml(title)}</h3>
    <p class="course-card__desc">${escapeHtml(desc)}</p>
    <div class="course-card__footer">
      <div class="course-card__mentor">
        <div class="course-card__mentor-icon">&#127891;</div>
        ${escapeHtml(mentor)}
      </div>
      <span class="course-card__cta">View Course &#8594;</span>
    </div>
  </div>
</a>
`;
    })
    .join('\n');

  const viewAllBtnHtml = `
<div class="courses-view-all-wrap" style="display:flex;justify-content:center;margin-top:3.5rem;width:100%;">
  <a href="/courses" class="button is-chamfer is-grad w-button" style="padding:16px 44px;font-size:1.05rem;font-weight:700;display:inline-flex;align-items:center;gap:12px;text-decoration:none;border-radius:100px;letter-spacing:0.02em;box-shadow:0 12px 36px rgba(77,101,255,0.4);">
    View All Courses &amp; Categories &#8594;
  </a>
</div>
`;

  return HOME_PAGE_TEMPLATE
    .replace('<!-- COURSES_GRID_PLACEHOLDER -->', cardsHtml)
    .replace('<!-- VIEW_ALL_BUTTON_PLACEHOLDER -->', viewAllBtnHtml);
}
