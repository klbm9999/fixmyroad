import {
    filterKnowledgeArticles,
    getAllSlugs,
    getArticle,
    getKnowledgeManifest,
} from './knowledge';

const EXPECTED_CHECKLIST_SLUGS = [
  'lane-markings',
  'crossings',
  'cracks-potholes',
  'road-signage',
  'speed-limits',
  'margins-shoulders',
  'sidewalks',
  'drainage',
  'street-lighting',
  'traffic-lighting',
];

const EXPECTED_IRC_SLUGS = ['pothole-repair', 'drainage', 'shoulder-specs'];

const EXPECTED_GHMC_SLUGS = [
  'road-maintenance-guidelines',
  'who-maintains-what',
  'how-to-lodge-complaint',
  'ghmc-contacts-socials',
];

const EXPECTED_RTO_SLUGS = ['rto-role-road-safety', 'rto-contacts'];

const EXPECTED_RESPONSIBILITY_SLUGS = ['who-is-responsible-for-what'];

const EXPECTED_REPAIR_SLUGS = [
  'cold-vs-hot-mix',
  'materials-hyderabad',
  'equipment',
  'safety',
];

describe('knowledge loader', () => {
  describe('getKnowledgeManifest', () => {
    it('returns manifest with all planned sections', () => {
      const manifest = getKnowledgeManifest();
      expect(manifest.bySection).toHaveProperty('checklist');
      expect(manifest.bySection).toHaveProperty('irc');
      expect(manifest.bySection).toHaveProperty('ghmc');
      expect(manifest.bySection).toHaveProperty('rto');
      expect(manifest.bySection).toHaveProperty('responsibility');
      expect(manifest.bySection).toHaveProperty('repair');
    });

    it('includes all checklist articles', () => {
      const manifest = getKnowledgeManifest();
      const slugs = manifest.bySection.checklist.map((a) => a.slug);
      for (const slug of EXPECTED_CHECKLIST_SLUGS) {
        expect(slugs).toContain(slug);
      }
    });

    it('includes all irc articles', () => {
      const manifest = getKnowledgeManifest();
      const slugs = manifest.bySection.irc.map((a) => a.slug);
      for (const slug of EXPECTED_IRC_SLUGS) {
        expect(slugs).toContain(slug);
      }
    });

    it('includes all ghmc articles', () => {
      const manifest = getKnowledgeManifest();
      const slugs = manifest.bySection.ghmc.map((a) => a.slug);
      for (const slug of EXPECTED_GHMC_SLUGS) {
        expect(slugs).toContain(slug);
      }
    });

    it('includes all rto articles', () => {
      const manifest = getKnowledgeManifest();
      const slugs = manifest.bySection.rto.map((a) => a.slug);
      for (const slug of EXPECTED_RTO_SLUGS) {
        expect(slugs).toContain(slug);
      }
    });

    it('includes all responsibility articles', () => {
      const manifest = getKnowledgeManifest();
      const slugs = manifest.bySection.responsibility.map((a) => a.slug);
      for (const slug of EXPECTED_RESPONSIBILITY_SLUGS) {
        expect(slugs).toContain(slug);
      }
    });

    it('includes all repair articles', () => {
      const manifest = getKnowledgeManifest();
      const slugs = manifest.bySection.repair.map((a) => a.slug);
      for (const slug of EXPECTED_REPAIR_SLUGS) {
        expect(slugs).toContain(slug);
      }
    });

    it('every article has required frontmatter fields', () => {
      const manifest = getKnowledgeManifest();
      for (const entry of manifest.articles) {
        expect(entry.title).toBeDefined();
        expect(typeof entry.title).toBe('string');
        expect(entry.title.length).toBeGreaterThan(0);
        expect(entry.section).toBeDefined();
        expect(entry.slug).toBeDefined();
        expect(entry.lastUpdated).toBeDefined();
        expect(entry.href).toMatch(/^\/knowledge\/[^/]+\/[^/]+$/);
      }
    });
  });

  describe('getArticle', () => {
    it('returns article for valid section and slug', () => {
      const article = getArticle('checklist', 'lane-markings');
      expect(article).not.toBeNull();
      expect(article!.title).toBeDefined();
      expect(article!.section).toBe('checklist');
      expect(article!.slug).toBe('lane-markings');
      expect(article!.body).toBeDefined();
    });

    it('returns null for unknown section', () => {
      expect(getArticle('unknown', 'lane-markings')).toBeNull();
    });

    it('returns null for unknown slug', () => {
      expect(getArticle('checklist', 'nonexistent')).toBeNull();
    });
  });

  describe('getAllSlugs', () => {
    it('returns one entry per article', () => {
      const manifest = getKnowledgeManifest();
      const slugs = getAllSlugs();
      expect(slugs.length).toBe(manifest.articles.length);
    });

    it('every slug resolves to an article', () => {
      const slugs = getAllSlugs();
      for (const { section, slug } of slugs) {
        const article = getArticle(section, slug);
        expect(article).not.toBeNull();
      }
    });
  });

  describe('filterKnowledgeArticles', () => {
    it('returns all articles when query is empty', () => {
      const manifest = getKnowledgeManifest();
      const filtered = filterKnowledgeArticles(manifest.articles, '');
      expect(filtered.length).toBe(manifest.articles.length);
    });

    it('returns all articles when query is only whitespace', () => {
      const manifest = getKnowledgeManifest();
      const filtered = filterKnowledgeArticles(manifest.articles, '   ');
      expect(filtered.length).toBe(manifest.articles.length);
    });

    it('filters by title (case-insensitive)', () => {
      const manifest = getKnowledgeManifest();
      const filtered = filterKnowledgeArticles(manifest.articles, 'lane');
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((a) => a.title.toLowerCase().includes('lane'))).toBe(true);
    });

    it('filters by slug', () => {
      const manifest = getKnowledgeManifest();
      const filtered = filterKnowledgeArticles(manifest.articles, 'pothole');
      expect(filtered.some((a) => a.slug.includes('pothole'))).toBe(true);
    });

    it('returns empty array when no match', () => {
      const manifest = getKnowledgeManifest();
      const filtered = filterKnowledgeArticles(manifest.articles, 'xyznonexistent123');
      expect(filtered.length).toBe(0);
    });
  });
});
