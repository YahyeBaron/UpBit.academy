import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { buildRoadmapViewModel } from '../lib/roadmap-data';
import { Course } from '../lib/data';

describe('Roadmap Data Model & View Model Tests', () => {
  const dummyCourse = (week: number, slug: string): Course => ({
    slug,
    title: `CS50 - Week ${week}: Test Module`,
    tagline: `Tagline for week ${week}`,
    category: 'frontend',
    image: '/assets/w-rc.jpg',
    description: `Description for week ${week}`,
    longDescription: `Long description for week ${week}`,
    instructorId: 'yahye',
    instructors: ['/assets/pri-next.jpg'],
    rating: 5,
    reviews: 10,
    students: 100,
    duration: '4h 00m',
    totalLessons: 8,
    level: 'Beginner',
    price: 0,
    originalPrice: 50,
    tags: ['CS50'],
    lastUpdated: '2026',
    includes: ['Video'],
    whatYouLearn: ['Learn concepts'],
    curriculum: [
      {
        title: 'Section 1',
        lessons: [{ id: `l-${week}-1`, title: 'Intro', duration: '10:00', type: 'video' }],
      },
    ],
    hasCertificate: true,
    totalHours: 4,
    completionCriteria: 'Complete all',
    seriesName: 'CS50 Computer Science',
    seriesOrder: week,
  });

  test('builds complete 11-milestone roadmap with fallback when courses are empty', () => {
    const viewModel = buildRoadmapViewModel([]);
    assert.equal(viewModel.totalMilestones, 11);
    assert.equal(viewModel.milestones.length, 11);
    assert.equal(viewModel.phases.length, 4);
    assert.equal(viewModel.milestones[0].weekNumber, 0);
    assert.equal(viewModel.milestones[10].weekNumber, 10);
    assert.equal(viewModel.milestones[0].status, 'next'); // first milestone is next for new learner
    assert.equal(viewModel.milestones[1].status, 'upcoming');
  });

  test('maps database courses by seriesOrder correctly', () => {
    const catalog: Course[] = [
      dummyCourse(0, 'cs50-week-0-scratch'),
      dummyCourse(1, 'cs50-week-1-c'),
      dummyCourse(2, 'cs50-week-2-arrays'),
    ];

    const viewModel = buildRoadmapViewModel(catalog);
    assert.equal(viewModel.milestones[0].isAvailable, true);
    assert.equal(viewModel.milestones[0].slug, 'cs50-week-0-scratch');
    assert.equal(viewModel.milestones[0].totalLessons, 8);
    assert.equal(viewModel.milestones[1].isAvailable, true);
    assert.equal(viewModel.milestones[1].slug, 'cs50-week-1-c');
  });

  test('determines status correctly from user enrollments', () => {
    const catalog: Course[] = [
      dummyCourse(0, 'cs50-week-0-scratch'),
      dummyCourse(1, 'cs50-week-1-c'),
      dummyCourse(2, 'cs50-week-2-arrays'),
    ];

    const enrollments = [
      { courseId: 'cs50-week-0-scratch', progress: 100 },
      { courseId: 'cs50-week-1-c', progress: 45 },
    ];

    const viewModel = buildRoadmapViewModel(catalog, enrollments);

    assert.equal(viewModel.milestones[0].status, 'completed');
    assert.equal(viewModel.milestones[0].progressPct, 100);

    assert.equal(viewModel.milestones[1].status, 'in-progress');
    assert.equal(viewModel.milestones[1].progressPct, 45);

    assert.equal(viewModel.milestones[2].status, 'upcoming');

    // Continue milestone should point to the in-progress course
    assert.equal(viewModel.continueMilestone?.weekNumber, 1);
  });

  test('incorporates client-persisted completed weeks for guests', () => {
    const viewModel = buildRoadmapViewModel([], [], [0, 1]);

    assert.equal(viewModel.milestones[0].status, 'completed');
    assert.equal(viewModel.milestones[1].status, 'completed');
    assert.equal(viewModel.milestones[2].status, 'next');
    assert.equal(viewModel.completedMilestones, 2);
    assert.equal(viewModel.completionPercentage, Math.round((2 / 11) * 100));
  });

  test('partitions milestones into the 4 official phases with accurate counts', () => {
    const viewModel = buildRoadmapViewModel([], [], [0, 1, 2]);

    assert.equal(viewModel.phases[0].id, 'phase-1');
    assert.equal(viewModel.phases[0].totalCount, 3); // Weeks 0, 1, 2
    assert.equal(viewModel.phases[0].completedCount, 3);
    assert.equal(viewModel.phases[0].progressPct, 100);

    assert.equal(viewModel.phases[1].id, 'phase-2');
    assert.equal(viewModel.phases[1].totalCount, 3); // Weeks 3, 4, 5
    assert.equal(viewModel.phases[1].completedCount, 0);

    assert.equal(viewModel.phases[2].id, 'phase-3');
    assert.equal(viewModel.phases[2].totalCount, 2); // Weeks 6, 7

    assert.equal(viewModel.phases[3].id, 'phase-4');
    assert.equal(viewModel.phases[3].totalCount, 3); // Weeks 8, 9, 10
  });
});
