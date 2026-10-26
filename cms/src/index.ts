import type { Core } from '@strapi/strapi';
import { seed } from './seed';

// Read-only access for the blog. Only published posts are ever returned.
const PUBLIC_ACTIONS = [
  'api::post.post.find',
  'api::post.post.findOne',
  'api::tag.tag.find',
  'api::tag.tag.findOne',
  'api::about.about.find',
];

async function grantPublicRead(strapi: Core.Strapi) {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!role) return;

  const permissions = strapi.db.query('plugin::users-permissions.permission');
  for (const action of PUBLIC_ACTIONS) {
    const existing = await permissions.findOne({ where: { action, role: role.id } });
    if (!existing) await permissions.create({ data: { action, role: role.id } });
  }
}

const CONTENT_EVENTS = [
  'entry.create',
  'entry.update',
  'entry.delete',
  'entry.publish',
  'entry.unpublish',
];
const BLOG_MODELS = new Set(['post', 'tag', 'about']);

// Tells the blog to drop its cache whenever blog content changes, so edits
// show up on the next page load instead of after the cache expires.
function notifyBlogOnChange(strapi: Core.Strapi) {
  const blogUrl = process.env.BLOG_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!blogUrl || !secret) {
    strapi.log.warn('BLOG_URL or REVALIDATE_SECRET not set; the blog will update when its cache expires.');
    return;
  }

  for (const event of CONTENT_EVENTS) {
    strapi.eventHub.on(event, async ({ model }: { model?: string }) => {
      if (!model || !BLOG_MODELS.has(model)) return;
      try {
        const res = await fetch(`${blogUrl.replace(/\/$/, '')}/api/revalidate`, {
          method: 'POST',
          headers: { 'x-revalidate-secret': secret },
        });
        if (!res.ok) strapi.log.warn(`Blog revalidate returned ${res.status}`);
      } catch (error) {
        strapi.log.warn(`Blog revalidate failed: ${(error as Error).message}`);
      }
    });
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicRead(strapi);
    await seed(strapi);
    notifyBlogOnChange(strapi);
  },
};
